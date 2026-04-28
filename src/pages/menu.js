const api = window.dbdIconManager;

const els = {
  openInstallBtn: document.getElementById("openInstallBtn"),
  openCompareBtn: document.getElementById("openCompareBtn"),
  startupPageSelect: document.getElementById("startupPageSelect"),
  showMenuOnStartupInput: document.getElementById("showMenuOnStartupInput"),
  saveMenuSettingsBtn: document.getElementById("saveMenuSettingsBtn"),
  menuStatus: document.getElementById("menuStatus"),
  openBuilderBtn: document.getElementById("openBuilderBtn"),
};

let config = null;

function setStatus(message) {
  els.menuStatus.textContent = message;
}

function goTo(page) {
  if (page === "builder") {
    window.location.href = "./pages/builder.html";
    return;
  }

  if (page === "compare") {
    window.location.href = "./pages/compare.html";
    return;
  }

  if (page === "install") {
    window.location.href = "./pages/install.html";
    return;
  }

  window.location.href = "./index.html";
}

async function saveSettings() {
  config.startupPage = els.startupPageSelect.value;
  config.showMenuOnStartup = els.showMenuOnStartupInput.checked;

  await api.saveConfig(config);
  setStatus("Startup settings saved.");
}

async function init() {
  const result = await api.loadConfig();
  config = result.config;

  if (!config.startupPage) {
    config.startupPage = "menu";
  }

  if (typeof config.showMenuOnStartup !== "boolean") {
    config.showMenuOnStartup = true;
  }

  const url = new URL(window.location.href);
  const forcedMenu = url.searchParams.get("menu") === "1";

  if (!forcedMenu && !config.showMenuOnStartup && config.startupPage !== "menu") {
    goTo(config.startupPage);
    return;
  }

  els.startupPageSelect.value = config.startupPage;
  els.showMenuOnStartupInput.checked = config.showMenuOnStartup;

  els.openInstallBtn.addEventListener("click", () => goTo("install"));
  els.openCompareBtn.addEventListener("click", () => goTo("compare"));
  els.openBuilderBtn.addEventListener("click", () => goTo("builder"));
  els.saveMenuSettingsBtn.addEventListener("click", saveSettings);

  setStatus("Ready.");
}

init();