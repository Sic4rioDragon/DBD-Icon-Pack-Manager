const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const path = require("path");

const {
  loadConfig,
  saveConfig,
  getConfigPaths
} = require("./lib/config");

const {
  getIconsPath,
  pathExists,
  ensureDir
} = require("./lib/paths");

const {
  scanPacksFolder,
  scanSinglePack
} = require("./lib/scanner");

const {
  createDefaultBackup,
  restoreDefaultBackup,
  getBackupInfo
} = require("./lib/backup");

const {
  installPack,
  validateAndRepairIcons
} = require("./lib/installer");

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1220,
    height: 820,
    minWidth: 1000,
    minHeight: 650,
    backgroundColor: "#111217",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, "..", "index.html"));

}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

ipcMain.handle("config:load", async () => {
  const config = await loadConfig();
  return {
    config,
    configPaths: getConfigPaths()
  };
});

ipcMain.handle("config:save", async (_event, config) => {
  await saveConfig(config);
  return {
    ok: true,
    config
  };
});

ipcMain.handle("dialog:select-folder", async (_event, title) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: title || "Select folder",
    properties: ["openDirectory"]
  });

  if (result.canceled || !result.filePaths.length) {
    return null;
  }

  return result.filePaths[0];
});

ipcMain.handle("paths:check", async (_event, config) => {
  const iconsPath = getIconsPath(config);
  const exists = await pathExists(iconsPath);

  return {
    iconsPath,
    exists
  };
});

ipcMain.handle("packs:scan", async (_event, packFolders) => {
  const folders = Array.isArray(packFolders)
    ? packFolders.filter(Boolean)
    : [packFolders].filter(Boolean);

  const combined = {
    folders,
    packs: [],
    totalPacks: 0,
    validPacks: 0,
    errors: []
  };

  for (const folder of folders) {
    const result = await scanPacksFolder(folder);

    if (result.error) {
      combined.errors.push({
        folder,
        error: result.error
      });
      continue;
    }

    const packsWithSource = result.packs.map((pack) => ({
      ...pack,
      sourceFolder: folder
    }));

    combined.packs.push(...packsWithSource);
    combined.totalPacks += result.totalPacks;
    combined.validPacks += result.validPacks;
  }

  combined.packs.sort((a, b) => {
    const byName = a.name.localeCompare(b.name);
    if (byName !== 0) return byName;
    return String(a.sourceFolder || "").localeCompare(String(b.sourceFolder || ""));
  });

  return combined;
});

ipcMain.handle("pack:scan", async (_event, packPath) => {
  return await scanSinglePack(packPath);
});

ipcMain.handle("backup:info", async (_event, config) => {
  return await getBackupInfo(config);
});

ipcMain.handle("backup:create", async (_event, config) => {
  return await createDefaultBackup(config);
});

ipcMain.handle("backup:restore", async (_event, config) => {
  return await restoreDefaultBackup(config);
});

ipcMain.handle("install:pack", async (_event, payload) => {
  return await installPack(payload);
});

ipcMain.handle("icons:repair", async (_event, config) => {
  return await validateAndRepairIcons(config);
});

ipcMain.handle("folder:open", async (_event, folderPath) => {
  if (!folderPath) return { ok: false, message: "No folder path provided." };

  await ensureDir(folderPath);
  await shell.openPath(folderPath);

  return { ok: true };
});