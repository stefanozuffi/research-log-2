const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("storage", {
  get: (key) => ipcRenderer.invoke("store:get", key),
  set: (key, value) => ipcRenderer.invoke("store:set", key, value),
  delete: (key) => ipcRenderer.invoke("store:delete", key),
  list: (prefix) => ipcRenderer.invoke("store:list", prefix),
});

contextBridge.exposeInMainWorld("shell", {
  openExternal: (url) => ipcRenderer.invoke("shell:openExternal", url),
});
