const fs = require("fs/promises");
const path = require("path");

const ICONS_RELATIVE_PATH = path.join("DeadByDaylight", "Content", "UI", "Icons");

async function pathExists(targetPath) {
  if (!targetPath) return false;

  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function ensureDir(targetPath) {
  await fs.mkdir(targetPath, { recursive: true });
}

function getGameRoot(config) {
  const platform = config.platform || "steam";
  const paths = config.gamePaths || {};

  if (platform === "custom") return paths.custom || "";
  if (platform === "epic") return paths.epic || "";
  return paths.steam || "";
}

function getIconsPath(config) {
  const gameRoot = getGameRoot(config);

  if (!gameRoot) return "";

  return path.join(gameRoot, ICONS_RELATIVE_PATH);
}

function normalizeSlashes(value) {
  return String(value || "").replace(/\\/g, "/");
}

function isImageFile(fileName) {
  const lower = fileName.toLowerCase();
  return (
    lower.endsWith(".png") ||
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    lower.endsWith(".webp")
  );
}

async function copyFileSafe(sourcePath, destinationPath) {
  await ensureDir(path.dirname(destinationPath));
  await fs.copyFile(sourcePath, destinationPath);
}

async function removeDirContents(targetPath) {
  if (!(await pathExists(targetPath))) return;

  const entries = await fs.readdir(targetPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(targetPath, entry.name);
    await fs.rm(fullPath, { recursive: true, force: true });
  }
}

async function walkFiles(rootPath) {
  const files = [];

  async function walk(currentPath) {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
    }
  }

  if (await pathExists(rootPath)) {
    await walk(rootPath);
  }

  return files;
}

module.exports = {
  ICONS_RELATIVE_PATH,
  pathExists,
  ensureDir,
  getGameRoot,
  getIconsPath,
  normalizeSlashes,
  isImageFile,
  copyFileSafe,
  removeDirContents,
  walkFiles
};