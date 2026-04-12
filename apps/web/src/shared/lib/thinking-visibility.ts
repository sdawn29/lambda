import { useSyncExternalStore } from "react"

import { SHOW_THINKING_STORAGE_KEY } from "./storage-keys"

const SHOW_THINKING_CHANGED_EVENT = "lambda:show-thinking-changed"
const DEFAULT_SHOW_THINKING = true

export function getShowThinkingSetting(): boolean {
  if (typeof window === "undefined") return DEFAULT_SHOW_THINKING
  return localStorage.getItem(SHOW_THINKING_STORAGE_KEY) !== "0"
}

export function setShowThinkingSetting(nextValue: boolean) {
  if (nextValue) {
    localStorage.removeItem(SHOW_THINKING_STORAGE_KEY)
  } else {
    localStorage.setItem(SHOW_THINKING_STORAGE_KEY, "0")
  }

  window.dispatchEvent(new Event(SHOW_THINKING_CHANGED_EVENT))
}

function subscribe(onStoreChange: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.storageArea !== localStorage) return
    if (event.key !== SHOW_THINKING_STORAGE_KEY) return
    onStoreChange()
  }

  window.addEventListener("storage", handleStorage)
  window.addEventListener(SHOW_THINKING_CHANGED_EVENT, onStoreChange)

  return () => {
    window.removeEventListener("storage", handleStorage)
    window.removeEventListener(SHOW_THINKING_CHANGED_EVENT, onStoreChange)
  }
}

export function useShowThinkingSetting() {
  return useSyncExternalStore(
    subscribe,
    getShowThinkingSetting,
    () => DEFAULT_SHOW_THINKING
  )
}
