const fs = require("fs/promises");
const path = require("path");
const { app } = require("electron");

const rootDir = path.join(__dirname, "..", "..");
const exampleConfigPath = path.join(rootDir, "config.example.json");
const localConfigPath = path.join(rootDir, "config.local.json");

function getDefaultUserBackupFolder() {
  return path.join(app.getPath("userData"), "backups", "default-icons");
}

function normalizePackFolders(config) {
  if (Array.isArray(config.packFolders)) {
    return config.packFolders.filter(Boolean);
  }

  if (config.packsFolder) {
    return [config.packsFolder];
  }

  return [];
}

function getFallbackConfig() {
  return {
    platform: "steam",
    gamePaths: {
      steam: "C:\\Program Files (x86)\\Steam\\steamapps\\common\\Dead by Daylight",
      epic: "C:\\Program Files\\Epic Games\\DeadByDaylight",
      custom: ""
    },
    packFolders: [],
    backupFolder: "",
    installMode: "clean",
    selectedCategories: [
      "CharPortraits",
      "Emblems",
      "Favors",
      "ItemAddons",
      "Items",
      "Perks",
      "Powers",
      "StatusEffects"
    ]
  };
}

async function readJsonIfExists(filePath) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function mergeConfig(base, override) {
  const merged = {
    ...base,
    ...(override || {}),
    gamePaths: {
      ...(base.gamePaths || {}),
      ...((override && override.gamePaths) || {})
    },
    selectedCategories:
      override && Array.isArray(override.selectedCategories)
        ? override.selectedCategories
        : base.selectedCategories
  };

  merged.packFolders = normalizePackFolders(merged);
  return merged;
}

async function loadConfig() {
  const fallback = getFallbackConfig();
  const example = await readJsonIfExists(exampleConfigPath);
  const local = await readJsonIfExists(localConfigPath);

  let config = mergeConfig(fallback, example || {});
  config = mergeConfig(config, local || {});
  config.packFolders = normalizePackFolders(config);

  if (!config.backupFolder) {
    config.backupFolder = getDefaultUserBackupFolder();
  }

  return config;
}

async function saveConfig(config) {
  const cleanConfig = {
    ...config,
    gamePaths: {
      steam: config.gamePaths?.steam || "",
      epic: config.gamePaths?.epic || "",
      custom: config.gamePaths?.custom || ""
    },
    packFolders: normalizePackFolders(config),
    backupFolder: config.backupFolder || "",
    installMode: config.installMode || "clean",
    selectedCategories: Array.isArray(config.selectedCategories)
      ? config.selectedCategories
      : []
  };

  delete cleanConfig.packsFolder;

  await fs.writeFile(localConfigPath, JSON.stringify(cleanConfig, null, 2), "utf8");
  return cleanConfig;
}

function getConfigPaths() {
  return {
    rootDir,
    exampleConfigPath,
    localConfigPath,
    userDataPath: app.getPath("userData")
  };
}

module.exports = {
  loadConfig,
  saveConfig,
  getConfigPaths
};
