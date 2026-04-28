const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("dbdIconManager", {
  loadConfig: () => ipcRenderer.invoke("config:load"),
  saveConfig: (config) => ipcRenderer.invoke("config:save", config),

  selectFolder: (title) => ipcRenderer.invoke("dialog:select-folder", title),
  checkPaths: (config) => ipcRenderer.invoke("paths:check", config),

  scanPacks: (packFolders) => ipcRenderer.invoke("packs:scan", packFolders),
  scanPack: (packPath) => ipcRenderer.invoke("pack:scan", packPath),

  getBackupInfo: (config) => ipcRenderer.invoke("backup:info", config),
  createBackup: (config) => ipcRenderer.invoke("backup:create", config),
  restoreBackup: (config) => ipcRenderer.invoke("backup:restore", config),

  installPack: (payload) => ipcRenderer.invoke("install:pack", payload),
  repairIcons: (config) => ipcRenderer.invoke("icons:repair", config),

  scanCompareItems: (config) => ipcRenderer.invoke("compare:scan", config),
  prepareCompareItem: (payload) => ipcRenderer.invoke("compare:prepare", payload),
  deleteCompareEntry: (payload) => ipcRenderer.invoke("compare:delete-entry", payload),
  keepCompareEntry: (payload) => ipcRenderer.invoke("compare:keep-entry", payload),
  clearCompareCache: (config) => ipcRenderer.invoke("compare:clear-cache", config),

  listBuilderPacks: (config) => ipcRenderer.invoke("builder:list-packs", config),
  createBuilderPack: (payload) => ipcRenderer.invoke("builder:create-pack", payload),
  addIconToPack: (payload) => ipcRenderer.invoke("builder:add-icon", payload),

  openFolder: (folderPath) => ipcRenderer.invoke("folder:open", folderPath),
  showFile: (filePath) => ipcRenderer.invoke("file:show", filePath),
});
