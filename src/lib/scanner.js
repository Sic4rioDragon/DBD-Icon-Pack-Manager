const fs = require("fs/promises");
const path = require("path");

const {
  pathExists,
  isImageFile,
  walkFiles
} = require("./paths");

const KNOWN_CATEGORY_ALIASES = {
  CharPortraits: [
    "CharPortraits",
    "CharacterPortraits",
    "Character Portraits",
    "Portraits"
  ],

  Emblems: [
    "Emblems",
    "Emblem"
  ],

  Favors: [
    "Favors",
    "Favours",
    "Favor",
    "Favour",
    "Offerings",
    "Offering"
  ],

  ItemAddons: [
    "ItemAddons",
    "Item Addons",
    "ItemAdd-ons",
    "Item Add-ons",
    "Addons",
    "Add-ons",
    "AddOns"
  ],

  Items: [
    "Items",
    "Item"
  ],

  Perks: [
    "Perks",
    "Perk"
  ],

  Powers: [
    "Powers",
    "Power"
  ],

  StatusEffects: [
    "StatusEffects",
    "Status Effects",
    "Status_Effects"
  ]
};

function normalizeName(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function categoryFromFolderName(folderName) {
  const normalized = normalizeName(folderName);

  for (const [category, aliases] of Object.entries(KNOWN_CATEGORY_ALIASES)) {
    for (const alias of aliases) {
      if (normalizeName(alias) === normalized) {
        return category;
      }
    }
  }

  return null;
}

async function findIconsRoot(packPath) {
  const directIcons = path.join(packPath, "Icons");

  if (await pathExists(directIcons)) {
    return directIcons;
  }

  const deadByDaylightIcons = path.join(
    packPath,
    "DeadByDaylight",
    "Content",
    "UI",
    "Icons"
  );

  if (await pathExists(deadByDaylightIcons)) {
    return deadByDaylightIcons;
  }

  return packPath;
}

async function scanSinglePack(packPath) {
  const name = path.basename(packPath);
  const iconsRoot = await findIconsRoot(packPath);

  const pack = {
    name,
    path: packPath,
    iconsRoot,
    categories: {},
    totalFiles: 0,
    valid: false
  };

  if (!(await pathExists(packPath))) {
    pack.error = "Pack folder does not exist.";
    return pack;
  }

  const entries = await fs.readdir(iconsRoot, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const category = categoryFromFolderName(entry.name);
    if (!category) continue;

    const categoryPath = path.join(iconsRoot, entry.name);
    const files = (await walkFiles(categoryPath)).filter(isImageFile);

    pack.categories[category] = {
      name: category,
      originalFolderName: entry.name,
      path: categoryPath,
      fileCount: files.length
    };

    pack.totalFiles += files.length;
  }

  pack.valid = pack.totalFiles > 0;

  return pack;
}

async function scanPacksFolder(packsFolder) {
  const result = {
    folder: packsFolder,
    packs: [],
    totalPacks: 0,
    validPacks: 0,
    error: null
  };

  if (!packsFolder || !(await pathExists(packsFolder))) {
    result.error = "Packs folder does not exist.";
    return result;
  }

  const entries = await fs.readdir(packsFolder, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const packPath = path.join(packsFolder, entry.name);
    const pack = await scanSinglePack(packPath);

    result.packs.push(pack);
  }

  result.packs.sort((a, b) => a.name.localeCompare(b.name));
  result.totalPacks = result.packs.length;
  result.validPacks = result.packs.filter((pack) => pack.valid).length;

  return result;
}

module.exports = {
  scanPacksFolder,
  scanSinglePack,
  KNOWN_CATEGORY_ALIASES
};