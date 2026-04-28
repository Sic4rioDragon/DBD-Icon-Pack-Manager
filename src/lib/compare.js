const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const { pathToFileURL } = require("url");

const {
  pathExists,
  ensureDir,
  copyFileSafe,
  isImageFile,
  walkFiles
} = require("./paths");

const CATEGORY_NAMES = {
  Actions: ["Actions", "Action"],
  CharPortraits: ["CharPortraits", "CharacterPortraits", "Character Portraits", "Portraits"],
  Emblems: ["Emblems", "Emblem"],
  Favors: ["Favors", "Favours", "Offerings", "Offering"],
  HelpLoading: ["HelpLoading", "Help Loading", "Loading", "LoadingScreens"],
  ItemAddons: ["ItemAddons", "Item Addons", "ItemAdd-ons", "Item Add-ons", "Addons", "Add-ons", "AddOns"],
  Items: ["Items", "Item"],
  Perks: ["Perks", "Perk"],
  Powers: ["Powers", "Power"],
  StatusEffects: ["StatusEffects", "Status Effects", "Status_Effects"]
};

const IGNORED_FOLDER_NAMES = new Set([
  "compare",
  "nolicense",
  "nolicence",
  "no_license",
  "no_licence",
  "no-license",
  "no-licence"
]);

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function normalizeFileName(fileName) {
  return String(fileName || "").toLowerCase();
}

function cleanName(value) {
  return String(value || "")
    .replace(/[<>:"/\\|?*]+/g, "_")
    .replace(/\s+/g, " ")
    .trim();
}

function shortHash(value) {
  return crypto
    .createHash("sha1")
    .update(String(value || ""))
    .digest("hex")
    .slice(0, 10);
}

function fileUrlWithCacheBust(filePath) {
  return `${pathToFileURL(filePath).toString()}?v=${Date.now()}-${shortHash(filePath)}`;
}

function getDefaultCompareFolder(config) {
  const firstPackFolder = Array.isArray(config.packFolders)
    ? config.packFolders[0]
    : config.packsFolder;

  if (firstPackFolder) {
    return path.join(firstPackFolder, "compare");
  }

  return "";
}

function isSamePath(a, b) {
  return path.resolve(String(a || "")).toLowerCase() === path.resolve(String(b || "")).toLowerCase();
}

function isPackRoot(config, folderPath) {
  const roots = getPackFolders(config);

  return roots.some((root) => isSamePath(root, folderPath));
}

function getCompareFolder(config) {
  const fallback = getDefaultCompareFolder(config);
  const requested = config.compareFolder || fallback;

  if (!requested) return "";

  // Safety: never allow the compare folder to be the pack root itself.
  // If someone selects D:\...\packs, use D:\...\packs\compare instead.
  if (isPackRoot(config, requested)) {
    return path.join(requested, "compare");
  }

  return requested;
}

function getCompareFolder(config) {
  return config.compareFolder || getDefaultCompareFolder(config);
}

function getPackFolders(config) {
  if (Array.isArray(config.packFolders)) {
    return config.packFolders.filter(Boolean);
  }

  return config.packsFolder ? [config.packsFolder] : [];
}

function hasIgnoredFolder(filePath) {
  const parts = filePath.split(path.sep);

  return parts.some((part) => {
    return IGNORED_FOLDER_NAMES.has(normalize(part));
  });
}

function categoryFromPart(part) {
  const normalized = normalize(part);

  for (const [category, aliases] of Object.entries(CATEGORY_NAMES)) {
    if (aliases.some((alias) => normalize(alias) === normalized)) {
      return category;
    }
  }

  return null;
}

function getFileInfo(rootFolder, filePath) {
  const relativePath = path.relative(rootFolder, filePath);
  const parts = relativePath.split(path.sep).filter(Boolean);

  if (parts.length < 2) return null;

  const packName = parts[0];
  const fileName = path.basename(filePath);

  let category = null;
  let categoryIndex = -1;

  for (let index = 1; index < parts.length - 1; index += 1) {
    const foundCategory = categoryFromPart(parts[index]);

    if (foundCategory) {
      category = foundCategory;
      categoryIndex = index;
      break;
    }
  }

  if (!category) {
    category = "Other";
    categoryIndex = Math.max(1, parts.length - 2);
  }

  let overFolder = "Base";

  if (categoryIndex >= 0 && parts.length - 2 > categoryIndex) {
    overFolder = parts[parts.length - 2];
  }

  const categoryPath = path.join(rootFolder, ...parts.slice(0, categoryIndex + 1));

  return {
    category,
    fileName,
    key: normalizeFileName(fileName),
    packName,
    packRoot: rootFolder,
    categoryPath,
    overFolder,
    originalPath: filePath,
    originalUrl: fileUrlWithCacheBust(filePath)
  };
}

async function collectFiles(config) {
  const roots = getPackFolders(config);
  const files = [];

  for (const rootFolder of roots) {
    if (!(await pathExists(rootFolder))) continue;

    const foundFiles = (await walkFiles(rootFolder)).filter((filePath) => {
      if (!isImageFile(filePath)) return false;
      if (path.extname(filePath).toLowerCase() !== ".png") return false;
      if (hasIgnoredFolder(filePath)) return false;
      return true;
    });

    for (const filePath of foundFiles) {
      const info = getFileInfo(rootFolder, filePath);
      if (!info) continue;

      files.push(info);
    }
  }

  return files;
}

async function scanCompareItems(config) {
  const files = await collectFiles(config);
  const grouped = new Map();

  for (const file of files) {
    const groupKey = `${file.category}::${file.key}`;

    if (!grouped.has(groupKey)) {
      grouped.set(groupKey, {
        category: file.category,
        fileName: file.fileName,
        key: file.key,
        entries: []
      });
    }

    grouped.get(groupKey).entries.push(file);
  }

  const items = Array.from(grouped.values())
    .filter((item) => item.entries.length > 1)
    .map((item) => ({
      ...item,
      count: item.entries.length,
      packs: item.entries.map((entry) => entry.packName)
    }))
    .sort((a, b) => {
      const byCategory = a.category.localeCompare(b.category);
      if (byCategory !== 0) return byCategory;
      return a.fileName.localeCompare(b.fileName);
    });

  const categories = {};

  for (const item of items) {
    if (!categories[item.category]) categories[item.category] = [];

    categories[item.category].push({
      category: item.category,
      fileName: item.fileName,
      key: item.key,
      count: item.count,
      packs: item.packs
    });
  }

  return {
    ok: true,
    rootCount: getPackFolders(config).length,
    itemCount: items.length,
    categories,
    compareFolder: getCompareFolder(config)
  };
}

async function prepareCompareItem(config, category, fileName) {
  const files = await collectFiles(config);
  const compareFolder = getCompareFolder(config);
  const targetItemFolder = path.join(compareFolder, category, path.parse(fileName).name);

  await ensureDir(targetItemFolder);

  const wantedKey = normalizeFileName(fileName);
  const entries = [];

  for (const file of files) {
    if (file.category !== category) continue;
    if (file.key !== wantedKey) continue;

    const label = `${cleanName(file.packName)} - ${cleanName(file.overFolder)}`;
    const uniquePart = shortHash(file.originalPath);
    const copiedName = `${label} - ${uniquePart}${path.extname(file.fileName)}`;
    const copiedPath = path.join(targetItemFolder, copiedName);

    await copyFileSafe(file.originalPath, copiedPath);

    entries.push({
      ...file,
      label,
      copiedPath,
      copiedUrl: fileUrlWithCacheBust(copiedPath)
    });
  }

  return {
    ok: true,
    category,
    fileName,
    compareFolder,
    itemFolder: targetItemFolder,
    entries
  };
}

async function removeEmptyParents(startFolder, stopFolder) {
  let current = startFolder;

  while (current && current !== stopFolder && current.startsWith(stopFolder)) {
    let entries;

    try {
      entries = await fs.readdir(current);
    } catch {
      return;
    }

    if (entries.length > 0) return;

    await fs.rmdir(current);
    current = path.dirname(current);
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function removeFileIfPossible(filePath) {
  if (!filePath || !(await pathExists(filePath))) {
    return {
      ok: true,
      removed: false,
      message: "File did not exist."
    };
  }

  const attempts = [75, 150, 300, 600, 1000];

  for (let index = 0; index < attempts.length; index += 1) {
    try {
      await fs.rm(filePath, { force: true });

      return {
        ok: true,
        removed: true,
        message: "Removed file."
      };
    } catch (error) {
      if (error.code !== "EBUSY" && error.code !== "EPERM") {
        throw error;
      }

      await wait(attempts[index]);
    }
  }

  return {
    ok: false,
    removed: false,
    busy: true,
    message: `Could not remove locked compare copy: ${filePath}`
  };
}

async function deleteCompareEntry(payload) {
  const { originalPath, copiedPath, categoryPath, compareItemFolder, trashFile } = payload;

  const copyResult = await removeFileIfPossible(copiedPath);

  if (originalPath && await pathExists(originalPath)) {
    if (typeof trashFile === "function") {
      await trashFile(originalPath);
    } else {
      throw new Error("Trash handler is not available.");
    }

    if (categoryPath) {
      await removeEmptyParents(path.dirname(originalPath), categoryPath);
    }
  }

  if (compareItemFolder) {
    await removeEmptyParents(compareItemFolder, path.dirname(path.dirname(compareItemFolder)));
  }

  return {
    ok: true,
    message: copyResult.busy
      ? "Moved the original file to trash. The compare copy was still locked, so it may disappear after restarting the app."
      : "Moved the original file to trash and removed the compare copy.",
    compareCopyBusy: Boolean(copyResult.busy)
  };
}

async function keepCompareEntry(payload) {
  const { copiedPath, compareItemFolder } = payload;

  const copyResult = await removeFileIfPossible(copiedPath);

  if (compareItemFolder) {
    await removeEmptyParents(compareItemFolder, path.dirname(path.dirname(compareItemFolder)));
  }

  return {
    ok: true,
    message: copyResult.busy
      ? "Kept the original. The compare copy was still locked, so it may disappear after restarting the app."
      : "Kept the original and removed the compare copy.",
    compareCopyBusy: Boolean(copyResult.busy)
  };
}

async function clearCompareCache(config) {
  const compareFolder = getCompareFolder(config);

  if (!compareFolder) {
    return {
      ok: false,
      message: "No compare folder is set."
    };
  }

  if (!(await pathExists(compareFolder))) {
    await ensureDir(compareFolder);

    return {
      ok: true,
      message: "Compare cache is already empty."
    };
  }

  const files = await walkFiles(compareFolder);

  for (const file of files) {
    try {
      await fs.rm(file, { force: true });
    } catch {
      // The app may still be showing the image. It can be cleaned next time.
    }
  }

  const entries = await fs.readdir(compareFolder, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(compareFolder, entry.name);

    try {
      await fs.rm(fullPath, { recursive: true, force: true });
    } catch {
      // Same here, locked temp files are not worth failing the whole action.
    }
  }

  await ensureDir(compareFolder);

  return {
    ok: true,
    message: "Compare cache cleared."
  };
}

module.exports = {
  getDefaultCompareFolder,
  scanCompareItems,
  prepareCompareItem,
  deleteCompareEntry,
  keepCompareEntry,
  clearCompareCache
};