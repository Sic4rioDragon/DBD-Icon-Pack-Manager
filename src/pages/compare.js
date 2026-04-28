const api = window.dbdIconManager;

const state = {
  config: null,
  compareScan: null,
  selectedCompareItem: null,
  preparedCompare: null,
  openCompareCategories: {},
  selectedEntries: new Set()
};

const els = {
  saveCompareConfigBtn: document.getElementById("saveCompareConfigBtn"),
  compareFolderInput: document.getElementById("compareFolderInput"),
  browseCompareFolderBtn: document.getElementById("browseCompareFolderBtn"),
  openCompareFolderBtn: document.getElementById("openCompareFolderBtn"),
  compareScanBtn: document.getElementById("compareScanBtn"),
  compareClearBtn: document.getElementById("compareClearBtn"),
  compareStatus: document.getElementById("compareStatus"),
  comparePackFoldersList: document.getElementById("comparePackFoldersList"),
  compareCountBadge: document.getElementById("compareCountBadge"),
  compareItemsList: document.getElementById("compareItemsList"),
  compareSelectedTitle: document.getElementById("compareSelectedTitle"),
  compareSelectedSubtitle: document.getElementById("compareSelectedSubtitle"),
  comparePreviewGrid: document.getElementById("comparePreviewGrid"),
  bulkCompareBar: document.getElementById("bulkCompareBar"),
  bulkSelectedCount: document.getElementById("bulkSelectedCount"),
  bulkDeleteBtn: document.getElementById("bulkDeleteBtn"),
  bulkKeepBtn: document.getElementById("bulkKeepBtn"),
  bulkClearBtn: document.getElementById("bulkClearBtn")
};

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setStatus(message, type = "") {
  els.compareStatus.textContent = message;
  els.compareStatus.classList.remove("good", "bad");

  if (type) {
    els.compareStatus.classList.add(type);
  }
}

function getPackFolders() {
  if (!Array.isArray(state.config.packFolders)) {
    state.config.packFolders = state.config.packsFolder
      ? [state.config.packsFolder]
      : [];
  }

  return state.config.packFolders;
}

function readConfigFromUi() {
  state.config.compareFolder = els.compareFolderInput.value.trim();
  return state.config;
}

function renderConfig() {
  els.compareFolderInput.value = state.config.compareFolder || "";
  renderPackFolders();
}

function renderPackFolders() {
  const folders = getPackFolders();

  els.comparePackFoldersList.innerHTML = "";

  if (!folders.length) {
    els.comparePackFoldersList.innerHTML = `
      <div class="folder-empty">No pack folders added yet.</div>
    `;
    return;
  }

  folders.forEach((folder) => {
    const row = document.createElement("div");
    row.className = "folder-row";

    row.innerHTML = `
      <div class="folder-path" title="${escapeHtml(folder)}">${escapeHtml(folder)}</div>
      <button class="btn small secondary" data-open-folder>Open</button>
    `;

    row.querySelector("[data-open-folder]").addEventListener("click", () => {
      api.openFolder(folder);
    });

    els.comparePackFoldersList.appendChild(row);
  });
}

function categoryDisplayName(category) {
  const names = {
    Actions: "Actions",
    CharPortraits: "Character Portraits",
    Emblems: "Emblems",
    Favors: "Offerings / Favors",
    HelpLoading: "Help Loading",
    ItemAddons: "Item Add-ons",
    Items: "Items",
    Perks: "Perks",
    Powers: "Powers",
    StatusEffects: "Status Effects"
  };

  return names[category] || category;
}

function prettyFileName(fileName) {
  return String(fileName || "")
    .replace(/\.png$/i, "")
    .replace(/_Portrait$/i, "")
    .replace(/^T_UI_/i, "")
    .replace(/^icon[A-Za-z]+_/i, "")
    .replace(/^icons[A-Za-z]+_/i, "");
}

function samePath(a, b) {
  return String(a || "").replaceAll("/", "\\").toLowerCase() ===
    String(b || "").replaceAll("/", "\\").toLowerCase();
}

function getCompareFolder() {
  const typedFolder = els.compareFolderInput.value.trim();
  const firstPackFolder = getPackFolders()[0];

  if (typedFolder) {
    const isPackRoot = getPackFolders().some((folder) => samePath(folder, typedFolder));

    if (isPackRoot) {
      return `${typedFolder}\\compare`;
    }

    return typedFolder;
  }

  return firstPackFolder ? `${firstPackFolder}\\compare` : "";
}

async function saveConfig() {
  readConfigFromUi();

  const typedFolder = els.compareFolderInput.value.trim();
  const isPackRoot = getPackFolders().some((folder) => samePath(folder, typedFolder));

  if (typedFolder && isPackRoot) {
    state.config.compareFolder = `${typedFolder}\\compare`;
    els.compareFolderInput.value = state.config.compareFolder;
    setStatus("Compare folder was changed to a safe compare subfolder.", "good");
  }

  await api.saveConfig(state.config);
  setStatus("Config saved.", "good");
}

async function chooseCompareFolder() {
  const folder = await api.selectFolder("Select compare output folder");
  if (!folder) return;

  els.compareFolderInput.value = folder;
  readConfigFromUi();
}

async function scanCompareItems() {
  readConfigFromUi();

  const folders = getPackFolders();

  if (!folders.length) {
    setStatus("Add at least one pack folder first.", "bad");
    return;
  }

  els.compareScanBtn.disabled = true;
  setStatus("Scanning comparable icons...");

  try {
    await api.clearCompareCache(state.config);
    
    const result = await api.scanCompareItems(state.config);

    state.compareScan = result;
    state.selectedCompareItem = null;
    state.preparedCompare = null;

    renderCompareItems();
    renderComparePreview();

    setStatus(
      `Found ${result.itemCount} comparable item(s) across ${result.rootCount} pack folder(s).\nCompare folder:\n${result.compareFolder}`,
      result.itemCount ? "good" : ""
    );
  } catch (error) {
    setStatus(error.message || "Compare scan failed.", "bad");
  } finally {
    els.compareScanBtn.disabled = false;
  }
}

function renderCompareItems() {
  els.compareItemsList.innerHTML = "";

  if (!state.compareScan || !state.compareScan.itemCount) {
    els.compareCountBadge.textContent = "0 items";
    els.compareItemsList.innerHTML = `<div class="empty">No matching icons found yet.</div>`;
    return;
  }

  els.compareCountBadge.textContent = `${state.compareScan.itemCount} items`;

  for (const [category, items] of Object.entries(state.compareScan.categories || {})) {
    const group = document.createElement("div");
    group.className = "compare-category-group";

    const header = document.createElement("button");
    header.className = "compare-category-header";

    const isOpen = state.openCompareCategories?.[category] !== false;

    header.innerHTML = `
      <span>${isOpen ? "▾" : "▸"} ${escapeHtml(categoryDisplayName(category))}</span>
      <small>${items.length} item(s)</small>
    `;

    header.addEventListener("click", () => {
      if (!state.openCompareCategories) {
        state.openCompareCategories = {};
      }

      state.openCompareCategories[category] = !isOpen;
      renderCompareItems();
    });

    group.appendChild(header);

    if (isOpen) {
      const list = document.createElement("div");
      list.className = "compare-item-buttons";

      for (const item of items) {
        const button = document.createElement("button");
        button.className = "compare-item-btn";

        if (
          state.selectedCompareItem &&
          state.selectedCompareItem.category === item.category &&
          state.selectedCompareItem.fileName === item.fileName
        ) {
          button.classList.add("active");
        }

        button.innerHTML = `
          <span>${escapeHtml(prettyFileName(item.fileName))}</span>
          <small>${item.count} versions</small>
        `;

        button.addEventListener("click", () => prepareCompareItem(item));
        list.appendChild(button);
      }

      group.appendChild(list);
    }

    els.compareItemsList.appendChild(group);
  }
}

async function prepareCompareItem(item) {
  readConfigFromUi();

  state.selectedCompareItem = item;
  state.preparedCompare = null;
  state.selectedEntries.clear();
  renderBulkBar();

  renderCompareItems();
  renderComparePreview(true);

  try {
    const result = await api.prepareCompareItem({
      config: state.config,
      category: item.category,
      fileName: item.fileName
    });

    state.preparedCompare = result;
    renderComparePreview();
  } catch (error) {
    els.comparePreviewGrid.innerHTML = `
      <div class="empty">${escapeHtml(error.message || "Could not prepare compare files.")}</div>
    `;
  }
}

function getEntryKey(entry) {
  return entry.originalPath;
}

function isEntrySelected(entry) {
  return state.selectedEntries.has(getEntryKey(entry));
}

function toggleEntrySelected(entry) {
  const key = getEntryKey(entry);

  if (state.selectedEntries.has(key)) {
    state.selectedEntries.delete(key);
  } else {
    state.selectedEntries.add(key);
  }

  renderBulkBar();
  renderComparePreview();
}

function clearSelectedEntries() {
  state.selectedEntries.clear();
  renderBulkBar();
  renderComparePreview();
}

function getSelectedPreparedEntries() {
  if (!state.preparedCompare) return [];

  return state.preparedCompare.entries.filter((entry) => {
    return state.selectedEntries.has(getEntryKey(entry));
  });
}

function renderBulkBar() {
  const count = state.selectedEntries.size;

  els.bulkSelectedCount.textContent = `Selected: ${count}`;
  els.bulkCompareBar.classList.toggle("hidden", count === 0);
}

function renderComparePreview(loading = false) {
  els.comparePreviewGrid.innerHTML = "";

  if (loading) {
    els.compareSelectedTitle.textContent = state.selectedCompareItem.fileName;
    els.compareSelectedSubtitle.textContent = "Copying files into the compare folder...";
    els.comparePreviewGrid.innerHTML = `<div class="empty">Preparing preview...</div>`;
    return;
  }

  if (!state.preparedCompare || !state.preparedCompare.entries.length) {
    els.compareSelectedTitle.textContent = "No icon selected";
    els.compareSelectedSubtitle.textContent = "Pick an icon from the list.";
    els.comparePreviewGrid.innerHTML = `<div class="empty">Nothing selected yet.</div>`;
    renderBulkBar();
    return;
  }

  els.compareSelectedTitle.textContent = state.preparedCompare.fileName;
  els.compareSelectedSubtitle.textContent = `${state.preparedCompare.entries.length} version(s) copied for comparison.`;

  for (const entry of state.preparedCompare.entries) {
    const selected = isEntrySelected(entry);
    const imageUrl = `${entry.copiedUrl}${entry.copiedUrl.includes("?") ? "&" : "?"}view=${Date.now()}`;

    const card = document.createElement("div");
    card.className = `compare-image-card${selected ? " selected" : ""}`;

    card.innerHTML = `
      <div class="compare-image-wrap">
        <img src="${imageUrl}" alt="${escapeHtml(entry.label)}" />
      </div>
      <div class="compare-image-info">
        <strong>${escapeHtml(entry.label)}</strong>
        <span>${escapeHtml(entry.packName)}</span>
        <small>${escapeHtml(entry.overFolder)}</small>
      </div>
      <div class="button-row compare-card-actions">
        <button type="button" class="btn small danger" data-delete-entry>Delete</button>
        <button type="button" class="btn small secondary" data-select-entry>${selected ? "Unselect" : "Select"}</button>
        <button type="button" class="btn small secondary" data-keep-entry>Keep</button>
        <button type="button" class="btn small secondary" data-show-entry>Show</button>
      </div>
    `;

    card.querySelector("[data-delete-entry]").addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      deleteCompareEntry(entry);
    });

    card.querySelector("[data-select-entry]").addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggleEntrySelected(entry);
    });

    card.querySelector("[data-keep-entry]").addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      keepCompareEntry(entry);
    });

    card.querySelector("[data-show-entry]").addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      api.showFile(entry.originalPath);
    });

    els.comparePreviewGrid.appendChild(card);
  }

  renderBulkBar();
}

async function deleteSelectedEntries() {
  const entries = getSelectedPreparedEntries();

  if (!entries.length) {
    setStatus("No selected icons to delete.", "bad");
    return;
  }

  const confirmed = confirm(
    `Move ${entries.length} selected icon(s) to trash?`
  );

  if (!confirmed) return;

  let moved = 0;

  const itemFolder = state.preparedCompare?.itemFolder || "";

  for (const entry of entries) {
    removePreparedEntry(entry);
  }

  await new Promise((resolve) => setTimeout(resolve, 200));

  for (const entry of entries) {
    const result = await api.deleteCompareEntry({
      originalPath: entry.originalPath,
      copiedPath: entry.copiedPath,
      categoryPath: entry.categoryPath,
      compareItemFolder: itemFolder
    });

    if (result && result.ok) {
      moved += 1;
    }
  }

  setStatus(`Moved ${moved} selected icon(s) to trash.`, "good");
}

async function deleteCompareEntry(entry) {
  if (!entry) {
    setStatus("No icon selected to delete.", "bad");
    return;
  }

  const confirmed = confirm(
    `Move this icon to trash?\n\n${entry.label}\n${entry.originalPath}`
  );

  if (!confirmed) return;

  try {
    removePreparedEntry(entry);

    await new Promise((resolve) => setTimeout(resolve, 150));

    const result = await api.deleteCompareEntry({
      originalPath: entry.originalPath,
      copiedPath: entry.copiedPath,
      categoryPath: entry.categoryPath,
      compareItemFolder: state.preparedCompare?.itemFolder || ""
    });

    if (!result || !result.ok) {
      setStatus(result?.message || "Delete failed.", "bad");
      return;
    }

    setStatus(result.message || "Moved icon to trash.", "good");
  } catch (error) {
    setStatus(error.message || "Delete failed.", "bad");
  }
}

async function keepSelectedEntries() {
  const entries = getSelectedPreparedEntries();

  if (!entries.length) {
    setStatus("No selected icons to keep.", "bad");
    return;
  }

  let kept = 0;

  const itemFolder = state.preparedCompare?.itemFolder || "";

  for (const entry of entries) {
    removePreparedEntry(entry);
  }

  await new Promise((resolve) => setTimeout(resolve, 200));

  for (const entry of entries) {
    const result = await api.keepCompareEntry({
      copiedPath: entry.copiedPath,
      compareItemFolder: itemFolder
    });

    if (result && result.ok) {
      kept += 1;
    }
  }

  setStatus(`Kept ${kept} selected icon(s).`, "good");
}

async function keepCompareEntry(entry) {
  if (!entry) {
    setStatus("No icon selected to keep.", "bad");
    return;
  }

  try {
    removePreparedEntry(entry);

    await new Promise((resolve) => setTimeout(resolve, 150));

    const result = await api.keepCompareEntry({
      copiedPath: entry.copiedPath,
      compareItemFolder: state.preparedCompare?.itemFolder || ""
    });

    if (!result || !result.ok) {
      setStatus(result?.message || "Keep failed.", "bad");
      return;
    }

    setStatus(result.message || "Kept icon.", "good");
  } catch (error) {
    setStatus(error.message || "Keep failed.", "bad");
  }
}

function removePreparedEntry(entry) {
  if (!state.preparedCompare) return;

  state.selectedEntries.delete(getEntryKey(entry));

  state.preparedCompare.entries = state.preparedCompare.entries.filter((item) => {
    return item.originalPath !== entry.originalPath;
  });

  renderComparePreview();
}

function clearSelectedCompare() {
  state.selectedCompareItem = null;
  state.preparedCompare = null;
  renderCompareItems();
  renderComparePreview();
}

function bindEvents() {
  els.saveCompareConfigBtn.addEventListener("click", saveConfig);
  els.browseCompareFolderBtn.addEventListener("click", chooseCompareFolder);

  els.openCompareFolderBtn.addEventListener("click", () => {
    const folder = getCompareFolder();

    if (!folder) {
      setStatus("Add a pack folder first or set a compare folder.", "bad");
      return;
    }

    api.openFolder(folder);
  });

  els.compareScanBtn.addEventListener("click", scanCompareItems);
  els.compareClearBtn.addEventListener("click", clearSelectedCompare);
  els.bulkDeleteBtn.addEventListener("click", deleteSelectedEntries);
  els.bulkKeepBtn.addEventListener("click", keepSelectedEntries);
  els.bulkClearBtn.addEventListener("click", clearSelectedEntries);
}

async function init() {
  bindEvents();

  const result = await api.loadConfig();
  state.config = result.config;

  renderConfig();
  renderComparePreview();

  setStatus("Ready.");
}

init();