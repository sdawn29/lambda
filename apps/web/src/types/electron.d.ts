interface ElectronAPI {
  platform: string
  selectFolder: () => Promise<string | null>
}

declare interface Window {
  electronAPI?: ElectronAPI
}
