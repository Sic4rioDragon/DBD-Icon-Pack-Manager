const api = window.dbdIconManager;

const state = {
  config: null,
  packs: [],
  selectedPack: null
};

const els = {
  saveConfigBtn: document.getElementById("saveConfigBtn"),
  scanPacksBtn: document.getElementById("scanPacksBtn"),
  checkPathsBtn: document.getElementById("checkPathsBtn"),

  steamPathInput: document.getElementById("steamPathInput"),
  epicPathInput: document.getElementById("epicPathInput"),
  customPathInput: document.getElementById("customPathInput"),
  packFoldersList: document.getElementById("packFoldersList"),
  newPackFolderInput: document.getElementById("newPackFolderInput"),
  addPackFolderBtn: document.getElementById("addPackFolderBtn"),
  backupFolderInput: document.getElementById("backupFolderInput"),
  installModeSelect: document.getElementById("installModeSelect"),

  browseSteamBtn: document.getElementById("browseSteamBtn"),
  browseEpicBtn: document.getElementById("browseEpicBtn"),
  browseCustomBtn: document.getElementById("browseCustomBtn"),
  browsePacksBtn: document.getElementById("browsePacksBtn"),
  browseBackupBtn: document.getElementById("browseBackupBtn"),
  openPacksFolderBtn: document.getElementById("openPacksFolderBtn"),

  createBackupBtn: document.getElementById("createBackupBtn"),
  restoreBackupBtn: document.getElementById("restoreBackupBtn"),
  repairIconsBtn: document.getElementById("repairIconsBtn"),

  iconsPathStatus: document.getElementById("iconsPathStatus"),
  backupStatus: document.getElementById("backupStatus"),

  packsList: document.getElementById("packsList"),
  packsCountBadge: document.getElementById("packsCountBadge"),

  selectedPackTitle: document.getElementById("selectedPackTitle"),
  selectedPackSubtitle: document.getElementById("selectedPackSubtitle"),
  categoriesList: document.getElementById("categoriesList"),
  selectAllCategoriesBtn: document.getElementById("selectAllCategoriesBtn"),
  selectNoCategoriesBtn: document.getElementById("selectNoCategoriesBtn"),
  installPreview: document.getElementById("installPreview"),
  installPackBtn: document.getElementById("installPackBtn"),
  actionLog: document.getElementById("actionLog")
};

function log(message) {
  const time = new Date().toLocaleTimeString();
  els.actionLog.textContent = `[${time}] ${message}\n\n${els.actionLog.textContent}`;
}

function setStatus(element, message, type = "") {
  element.textContent = message;
  element.classList.remove("good", "bad");

  if (type) {
    element.classList.add(type);
  }
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getSelectedPlatform() {
  const selected = document.querySelector("input[name='platform']:checked");
  return selected ? selected.value : "steam";
}

function setSelectedPlatform(value) {
  const input = document.querySelector(`input[name='platform'][value='${value}']`);
  if (input) input.checked = true;
}

function getPackFoldersFromState() {
  if (!Array.isArray(state.config.packFolders)) {
    state.config.packFolders = [];
  }

  return state.config.packFolders;
}

function getSelectedCategories() {
  return Array.from(els.categoriesList.querySelectorAll("input[type='checkbox']"))
    .filter((input) => input.checked)
    .map((input) => input.dataset.category);
}

function readConfigFromUi() {
  state.config.platform = getSelectedPlatform();
  state.config.gamePaths.steam = els.steamPathInput.value.trim();
  state.config.gamePaths.epic = els.epicPathInput.value.trim();
  state.config.gamePaths.custom = els.customPathInput.value.trim();
  state.config.packFolders = getPackFoldersFromState();
  state.config.backupFolder = els.backupFolderInput.value.trim();
  state.config.installMode = els.installModeSelect.value;
  state.config.selectedCategories = getSelectedCategories();

  delete state.config.packsFolder;

  return state.config;
}

function renderConfig() {
  const config = state.config;

  setSelectedPlatform(config.platform || "steam");

  els.steamPathInput.value = config.gamePaths?.steam || "";
  els.epicPathInput.value = config.gamePaths?.epic || "";
  els.customPathInput.value = config.gamePaths?.custom || "";
  els.backupFolderInput.value = config.backupFolder || "";
  els.installModeSelect.value = config.installMode || "clean";

  if (!Array.isArray(config.packFolders)) {
    config.packFolders = config.packsFolder ? [config.packsFolder] : [];
  }

  renderPackFolders();
}

function renderPackFolders() {
  const folders = getPackFoldersFromState();

  els.packFoldersList.innerHTML = "";

  if (!folders.length) {
    els.packFoldersList.innerHTML = `<div class="folder-empty">No pack folders added yet.</div>`;
    return;
  }

  folders.forEach((folder, index) => {
    const row = document.createElement("div");
    row.className = "folder-row";
    row.innerHTML = `
      <div class="folder-path" title="${escapeHtml(folder)}">${escapeHtml(folder)}</div>
      <button class="btn small secondary" data-open-folder="${index}">Open</button>
      <button class="btn small danger" data-remove-folder="${index}">Remove</button>
    `;

    els.packFoldersList.appendChild(row);
  });

  els.packFoldersList.querySelectorAll("[data-open-folder]").forEach((button) => {
    button.addEventListener("click", () => {
      const folder = getPackFoldersFromState()[Number(button.dataset.openFolder)];
      api.openFolder(folder);
    });
  });

  els.packFoldersList.querySelectorAll("[data-remove-folder]").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.removeFolder);
      getPackFoldersFromState().splice(index, 1);
      renderPackFolders();
      log("Removed pack folder.");
    });
  });
}

function addPackFolder(folderPath) {
  const folder = String(folderPath || "").trim();

  if (!folder) {
    log("No pack folder entered.");
    return;
  }

  const folders = getPackFoldersFromState();
  const alreadyExists = folders.some((existing) => existing.toLowerCase() === folder.toLowerCase());

  if (alreadyExists) {
    log("That pack folder is already added.");
    return;
  }

  folders.push(folder);
  els.newPackFolderInput.value = "";
  renderPackFolders();
  log(`Added pack folder:\n${folder}`);
}

async function chooseFolder(input, title) {
  const folder = await api.selectFolder(title);
  if (!folder) return;

  input.value = folder;
  readConfigFromUi();
}

function categoryDisplayName(category) {
  const names = {
    CharPortraits: "Character Portraits",
    Emblems: "Emblems",
    Favors: "Offerings / Favors",
    ItemAddons: "Item Add-ons",
    Items: "Items",
    Perks: "Perks",
    Powers: "Powers",
    StatusEffects: "Status Effects"
  };

  return names[category] || category;
}

function renderPacks() {
  els.packsList.innerHTML = "";
  els.packsCountBadge.textContent = `${state.packs.length} packs`;

  if (!state.packs.length) {
    els.packsList.innerHTML = `<div class="empty">No packs found.</div>`;
    return;
  }

  for (const pack of state.packs) {
    const button = document.createElement("button");
    button.className = "pack-item";

    if (state.selectedPack && state.selectedPack.path === pack.path) {
      button.classList.add("active");
    }

    const categories = Object.keys(pack.categories || {});
    const validText = pack.valid ? "valid" : "no supported folders found";

    button.innerHTML = `
      <div class="pack-item-title">${escapeHtml(pack.name)}</div>
      <div class="pack-item-meta">
        ${pack.totalFiles} files • ${categories.length} folders • ${validText}
        ${pack.sourceFolder ? `<br>${escapeHtml(pack.sourceFolder)}` : ""}
      </div>
    `;

    button.addEventListener("click", () => {
      state.selectedPack = pack;
      renderPacks();
      renderSelectedPack();
    });

    els.packsList.appendChild(button);
  }
}

function renderSelectedPack() {
  const pack = state.selectedPack;

  els.categoriesList.innerHTML = "";

  if (!pack) {
    els.selectedPackTitle.textContent = "No pack selected";
    els.selectedPackSubtitle.textContent = "Select a pack from the list.";
    els.installPackBtn.disabled = true;
    els.categoriesList.innerHTML = `<div class="empty">No categories loaded.</div>`;
    updateInstallPreview();
    return;
  }

  els.selectedPackTitle.textContent = pack.name;
  els.selectedPackSubtitle.textContent = `${pack.totalFiles} files found in this pack.`;
  els.installPackBtn.disabled = !pack.valid;

  const categories = Object.entries(pack.categories || {});

  if (!categories.length) {
    els.categoriesList.innerHTML = `<div class="empty">This pack has no supported folders.</div>`;
    updateInstallPreview();
    return;
  }

  for (const [category, info] of categories) {
    const row = document.createElement("label");
    row.className = "category-item";

    const checked = state.config.selectedCategories?.includes(category) !== false;

    row.innerHTML = `
      <input type="checkbox" data-category="${escapeHtml(category)}" ${checked ? "checked" : ""} />
      <div>
        <div class="category-name">${escapeHtml(categoryDisplayName(category))}</div>
        <div class="category-meta">${escapeHtml(info.originalFolderName)} folder</div>
      </div>
      <strong>${info.fileCount}</strong>
    `;

    els.categoriesList.appendChild(row);
  }

  els.categoriesList.querySelectorAll("input[type='checkbox']").forEach((input) => {
    input.addEventListener("change", updateInstallPreview);
  });

  updateInstallPreview();
}

function updateInstallPreview() {
  if (!state.selectedPack) {
    els.installPreview.textContent = "Install preview will show here after you select a pack.";
    return;
  }

  const selectedCategories = getSelectedCategories();
  const categories = state.selectedPack.categories || {};

  if (!selectedCategories.length) {
    els.installPreview.textContent = "Install preview: no folders selected.";
    return;
  }

  const selectedFiles = selectedCategories.reduce((total, category) => {
    return total + (categories[category]?.fileCount || 0);
  }, 0);

  const mode = els.installModeSelect.value === "clean"
    ? "clean install, backup restored first"
    : "merge install, only selected files overwritten";

  const folderNames = selectedCategories.map(categoryDisplayName).join(", ");

  els.installPreview.textContent = `Install preview:\n${selectedFiles} files from ${selectedCategories.length} folder(s).\nMode: ${mode}.\nFolders: ${folderNames}`;
}

function setAllCategoryCheckboxes(checked) {
  const inputs = els.categoriesList.querySelectorAll("input[type='checkbox']");

  for (const input of inputs) {
    input.checked = checked;
  }

  updateInstallPreview();
}

async function checkPaths() {
  readConfigFromUi();

  const result = await api.checkPaths(state.config);

  if (result.exists) {
    setStatus(els.iconsPathStatus, `Found icons folder:\n${result.iconsPath}`, "good");
  } else {
    setStatus(els.iconsPathStatus, `Icons folder not found:\n${result.iconsPath}`, "bad");
  }

  const backup = await api.getBackupInfo(state.config);

  if (backup.exists) {
    setStatus(els.backupStatus, `Backup found:\n${backup.backupFolder}\n${backup.fileCount} files`, "good");
  } else {
    setStatus(els.backupStatus, `No backup found yet:\n${backup.backupFolder}`, "bad");
  }
}

async function scanPacks() {
  readConfigFromUi();

  const folders = getPackFoldersFromState();

  if (!folders.length) {
    log("Add at least one packs folder first.");
    return;
  }

  log(`Scanning ${folders.length} pack folder(s)...`);

  const result = await api.scanPacks(folders);

  state.packs = result.packs || [];
  state.selectedPack = null;

  renderPacks();
  renderSelectedPack();

  if (result.errors && result.errors.length) {
    const errors = result.errors
      .map((item) => `- ${item.folder}: ${item.error}`)
      .join("\n");

    log(`Some folders could not be scanned:\n${errors}`);
  }

  log(`Found ${result.validPacks}/${result.totalPacks} valid packs.`);
}

async function saveConfig() {
  readConfigFromUi();

  const result = await api.saveConfig(state.config);

  if (result.ok) {
    state.config = result.config;
    log("Config saved to config.local.json.");
  }
}

async function createBackup() {
  readConfigFromUi();

  const result = await api.createBackup(state.config);

  if (result.ok) {
    setStatus(els.backupStatus, `${result.message}\n${result.backupFolder}\n${result.fileCount} files`, "good");
  } else {
    setStatus(els.backupStatus, result.message, "bad");
  }

  log(result.message);
}

async function restoreBackup() {
  readConfigFromUi();

  const confirmed = confirm("This will revert your DBD icons folder back to the saved default backup.\n\nContinue?");
  if (!confirmed) return;

  const result = await api.restoreBackup(state.config);
  log(result.message);

  await checkPaths();
}

async function repairIcons() {
  readConfigFromUi();

  const result = await api.repairIcons(state.config);
  log(result.message);
}

async function installSelectedPack() {
  if (!state.selectedPack) return;

  readConfigFromUi();

  const selectedCategories = getSelectedCategories();

  if (!selectedCategories.length) {
    log("No folders selected.");
    return;
  }

  const selectedFiles = selectedCategories.reduce((total, category) => {
    return total + (state.selectedPack.categories?.[category]?.fileCount || 0);
  }, 0);

  const confirmed = confirm(
    `Install "${state.selectedPack.name}"?\n\n${selectedFiles} files from:\n${selectedCategories
      .map(categoryDisplayName)
      .join(", ")}`
  );

  if (!confirmed) return;

  els.installPackBtn.disabled = true;
  log(`Installing ${state.selectedPack.name}...`);

  try {
    const result = await api.installPack({
      config: state.config,
      packPath: state.selectedPack.path,
      selectedCategories
    });

    if (result.ok) {
      log(`Installation done.\n\n${formatInstallResult(result)}`);
    } else {
      log(formatInstallResult(result));
    }
  } finally {
    els.installPackBtn.disabled = false;
    updateInstallPreview();
  }
}

function formatInstallResult(result) {
  if (!result.ok) {
    return result.message || "Install failed.";
  }

  const categories = (result.installedCategories || [])
    .map((item) => `- ${categoryDisplayName(item.category)}: ${item.copiedFiles} files`)
    .join("\n");

  const repair = result.repair
    ? `\n\nMissing icon repair:\n${result.repair.message}`
    : "";

  return `${result.message}\n\n${categories}${repair}`;
}

function bindEvents() {
  els.saveConfigBtn.addEventListener("click", saveConfig);
  els.scanPacksBtn.addEventListener("click", scanPacks);
  els.checkPathsBtn.addEventListener("click", checkPaths);

  els.browseSteamBtn.addEventListener("click", () => {
    chooseFolder(els.steamPathInput, "Select Steam Dead by Daylight folder");
  });

  els.browseEpicBtn.addEventListener("click", () => {
    chooseFolder(els.epicPathInput, "Select Epic Games Dead by Daylight folder");
  });

  els.browseCustomBtn.addEventListener("click", () => {
    chooseFolder(els.customPathInput, "Select custom Dead by Daylight folder");
  });

  els.browsePacksBtn.addEventListener("click", async () => {
    const folder = await api.selectFolder("Select local icon packs folder");
    if (folder) els.newPackFolderInput.value = folder;
  });

  els.browseBackupBtn.addEventListener("click", () => {
    chooseFolder(els.backupFolderInput, "Select backup folder");
  });

  els.openPacksFolderBtn.addEventListener("click", () => {
    const folder = getPackFoldersFromState()[0];

    if (!folder) {
      log("No pack folder added yet.");
      return;
    }

    api.openFolder(folder);
  });

  els.addPackFolderBtn.addEventListener("click", () => {
    addPackFolder(els.newPackFolderInput.value);
  });

  els.createBackupBtn.addEventListener("click", createBackup);
  els.restoreBackupBtn.addEventListener("click", restoreBackup);
  els.repairIconsBtn.addEventListener("click", repairIcons);

  els.selectAllCategoriesBtn.addEventListener("click", () => setAllCategoryCheckboxes(true));
  els.selectNoCategoriesBtn.addEventListener("click", () => setAllCategoryCheckboxes(false));
  els.installModeSelect.addEventListener("change", updateInstallPreview);
  els.installPackBtn.addEventListener("click", installSelectedPack);
}

async function init() {
  bindEvents();

  const result = await api.loadConfig();
  state.config = result.config;

  renderConfig();
  renderSelectedPack();

  log(`Loaded config.\nLocal config: ${result.configPaths.localConfigPath}`);

  await checkPaths();

  if (Array.isArray(state.config.packFolders) && state.config.packFolders.length) {
    await scanPacks();
  }
}

init();
