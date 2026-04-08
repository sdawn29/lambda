interface ElectronAPI {
  platform: string
  selectFolder: () => Promise<string | null>
  getServerPort: () => Promise<number>
  openPath: (path: string) => Promise<void>
  openExternal: (url: string) => Promise<void>
}

declare interface Window {
  electronAPI?: ElectronAPI
}
