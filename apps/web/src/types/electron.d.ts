interface ElectronAPI {
  platform: string
}

declare interface Window {
  electronAPI?: ElectronAPI
}
