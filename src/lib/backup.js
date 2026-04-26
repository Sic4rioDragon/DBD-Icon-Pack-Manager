const fs = require("fs/promises");
const path = require("path");

const {
  getIconsPath,
  pathExists,
  ensureDir,
  copyFileSafe,
  removeDirContents,
  walkFiles
} = require("./paths");

async function copyFolder(sourceFolder, destinationFolder) {
  await ensureDir(destinationFolder);

  const files = await walkFiles(sourceFolder);

  let copied = 0;

  for (const sourceFile of files) {
    const relativePath = path.relative(sourceFolder, sourceFile);
    const destinationFile = path.join(destinationFolder, relativePath);

    await copyFileSafe(sourceFile, destinationFile);
    copied += 1;
  }

  return copied;
}

async function getBackupInfo(config) {
  const backupFolder = config.backupFolder;
  const exists = await pathExists(backupFolder);
  const files = exists ? await walkFiles(backupFolder) : [];

  return {
    backupFolder,
    exists,
    fileCount: files.length
  };
}

async function createDefaultBackup(config) {
  const iconsPath = getIconsPath(config);
  const backupFolder = config.backupFolder;

  if (!(await pathExists(iconsPath))) {
    return {
      ok: false,
      message: `DBD icons folder was not found: ${iconsPath}`
    };
  }

  await ensureDir(backupFolder);

  const existingFiles = await walkFiles(backupFolder);

  if (existingFiles.length > 0) {
    return {
      ok: true,
      skipped: true,
      message: "Default backup already exists.",
      backupFolder,
      fileCount: existingFiles.length
    };
  }

  const copied = await copyFolder(iconsPath, backupFolder);

  return {
    ok: true,
    skipped: false,
    message: `Created default backup with ${copied} files.`,
    backupFolder,
    fileCount: copied
  };
}

async function restoreDefaultBackup(config) {
  const iconsPath = getIconsPath(config);
  const backupFolder = config.backupFolder;

  if (!(await pathExists(backupFolder))) {
    return {
      ok: false,
      message: `Backup folder was not found: ${backupFolder}`
    };
  }

  await ensureDir(iconsPath);
  await removeDirContents(iconsPath);

  const copied = await copyFolder(backupFolder, iconsPath);

  return {
    ok: true,
    message: `Restored ${copied} default icon files.`,
    restoredFiles: copied,
    iconsPath,
    backupFolder
  };
}

module.exports = {
  createDefaultBackup,
  restoreDefaultBackup,
  getBackupInfo,
  copyFolder
};