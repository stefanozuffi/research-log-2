const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");

let store;
let mainWindow;

async function initStore() {
  const { default: Store } = await import("electron-store");
  store = new Store({
    name: "research-log-data",
    defaults: {},
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 960,
    height: 720,
    minWidth: 640,
    minHeight: 500,
    titleBarStyle: "hiddenInset",
    backgroundColor: "#0d1117",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, "..", "public", "index.html"));
}

// Storage IPC handlers
ipcMain.handle("store:get", (_event, key) => {
  const value = store.get(key, null);
  return value ? { key, value } : null;
});

ipcMain.handle("store:set", (_event, key, value) => {
  store.set(key, value);
  return { key, value };
});

ipcMain.handle("store:delete", (_event, key) => {
  store.delete(key);
  return { key, deleted: true };
});

ipcMain.handle("store:list", (_event, prefix) => {
  const allKeys = Object.keys(store.store);
  const filtered = prefix ? allKeys.filter((k) => k.startsWith(prefix)) : allKeys;
  return { keys: filtered };
});

app.whenReady().then(async () => {
  await initStore();
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
