import { contextBridge, ipcRenderer } from "electron";

type SelectFolderOptions = {
  canCreateFolder?: boolean;
};

contextBridge.exposeInMainWorld("electronAPI", {
  platform: process.platform,
  selectFolder: (options?: SelectFolderOptions) =>
    ipcRenderer.invoke("select-folder", options),
  getServerPort: () => ipcRenderer.invoke("get-server-port"),
  openPath: (path: string) => ipcRenderer.invoke("open-path", path),
  openExternal: (url: string) => ipcRenderer.invoke("open-external", url),
  getFullscreen: () => ipcRenderer.invoke("get-fullscreen"),
  onFullscreenChange: (callback: (isFullscreen: boolean) => void) => {
    const handler = (_: unknown, isFullscreen: boolean) =>
      callback(isFullscreen);
    ipcRenderer.on("fullscreen-changed", handler);
    return () => ipcRenderer.removeListener("fullscreen-changed", handler);
  },
});
