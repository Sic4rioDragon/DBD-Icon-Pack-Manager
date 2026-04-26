const path = require("path");

const {
  getIconsPath,
  pathExists,
  ensureDir,
  copyFileSafe,
  walkFiles,
  isImageFile
} = require("./paths");

const {
  createDefaultBackup,
  restoreDefaultBackup
} = require("./backup");

const {
  scanSinglePack
} = require("./scanner");

async function copyCategory(categoryInfo, iconsPath) {
  const files = (await walkFiles(categoryInfo.path)).filter(isImageFile);

  let copied = 0;

  for (const sourceFile of files) {
    const relativePath = path.relative(categoryInfo.path, sourceFile);
    const destinationFile = path.join(
      iconsPath,
      categoryInfo.originalFolderName,
      relativePath
    );

    await copyFileSafe(sourceFile, destinationFile);
    copied += 1;
  }

  return copied;
}

async function validateAndRepairIcons(config) {
  const iconsPath = getIconsPath(config);
  const backupFolder = config.backupFolder;

  if (!(await pathExists(iconsPath))) {
    return {
      ok: false,
      message: `DBD icons folder was not found: ${iconsPath}`
    };
  }

  if (!(await pathExists(backupFolder))) {
    return {
      ok: false,
      message: `Backup folder was not found: ${backupFolder}`
    };
  }

  const backupFiles = await walkFiles(backupFolder);

  let repaired = 0;
  let checked = 0;

  for (const backupFile of backupFiles) {
    checked += 1;

    const relativePath = path.relative(backupFolder, backupFile);
    const targetFile = path.join(iconsPath, relativePath);

    if (!(await pathExists(targetFile))) {
      await copyFileSafe(backupFile, targetFile);
      repaired += 1;
    }
  }

  return {
    ok: true,
    message:
      repaired > 0
        ? `Repaired ${repaired} missing icon files from default backup.`
        : "No missing icons found.",
    checkedFiles: checked,
    repairedFiles: repaired
  };
}

async function installPack(payload) {
  const { config, packPath, selectedCategories } = payload;

  const iconsPath = getIconsPath(config);

  if (!(await pathExists(iconsPath))) {
    return {
      ok: false,
      message: `DBD icons folder was not found: ${iconsPath}`
    };
  }

  if (!(await pathExists(packPath))) {
    return {
      ok: false,
      message: `Pack folder was not found: ${packPath}`
    };
  }

  const backupResult = await createDefaultBackup(config);

  if (!backupResult.ok) {
    return backupResult;
  }

  if (config.installMode === "clean") {
    const restoreResult = await restoreDefaultBackup(config);

    if (!restoreResult.ok) {
      return restoreResult;
    }
  }

  await ensureDir(iconsPath);

  const pack = await scanSinglePack(packPath);

  if (!pack.valid) {
    return {
      ok: false,
      message: "This pack does not seem to contain any supported icon folders."
    };
  }

  const selected = Array.isArray(selectedCategories)
    ? selectedCategories
    : Object.keys(pack.categories);

  const installedCategories = [];
  let copiedFiles = 0;

  for (const category of selected) {
    const categoryInfo = pack.categories[category];

    if (!categoryInfo) continue;

    const copied = await copyCategory(categoryInfo, iconsPath);

    copiedFiles += copied;
    installedCategories.push({
      category,
      copiedFiles: copied
    });
  }

  const repairResult = await validateAndRepairIcons(config);

  return {
    ok: true,
    message: `Installed ${copiedFiles} files from ${pack.name}.`,
    packName: pack.name,
    copiedFiles,
    installedCategories,
    repair: repairResult
  };
}

module.exports = {
  installPack,
  validateAndRepairIcons
};