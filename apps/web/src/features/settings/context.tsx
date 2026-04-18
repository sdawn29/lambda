import React, { createContext, useContext, useState } from "react"

interface SettingsModalContextValue {
  open: boolean
  openSettings: () => void
  closeSettings: () => void
}

const SettingsModalContext = createContext<SettingsModalContextValue | null>(null)

export function SettingsModalProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <SettingsModalContext.Provider
      value={{
        open,
        openSettings: () => setOpen(true),
        closeSettings: () => setOpen(false),
      }}
    >
      {children}
    </SettingsModalContext.Provider>
  )
}

export function useSettingsModal() {
  const ctx = useContext(SettingsModalContext)
  if (!ctx) throw new Error("useSettingsModal must be used within SettingsModalProvider")
  return ctx
}
