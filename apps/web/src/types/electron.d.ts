interface ElectronAPI {
  platform: string
  selectFolder: () => Promise<string | null>
  getServerPort: () => Promise<number>
}

declare interface Window {
  electronAPI?: ElectronAPI
}
