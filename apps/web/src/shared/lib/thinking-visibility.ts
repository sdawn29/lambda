import { useSyncExternalStore } from "react"

import {
  SHOW_THINKING_CHANGED_EVENT,
  SHOW_THINKING_LEGACY_STORAGE_KEYS,
  SHOW_THINKING_STORAGE_KEY,
  readStorageValue,
  removeStorageValue,
  writeStorageValue,
} from "./storage-keys"

const DEFAULT_SHOW_THINKING = true

export function getShowThinkingSetting(): boolean {
  if (typeof window === "undefined") return DEFAULT_SHOW_THINKING
  return (
    readStorageValue(
      SHOW_THINKING_STORAGE_KEY,
      SHOW_THINKING_LEGACY_STORAGE_KEYS
    ) !== "0"
  )
}

export function setShowThinkingSetting(nextValue: boolean) {
  if (nextValue) {
    removeStorageValue(
      SHOW_THINKING_STORAGE_KEY,
      SHOW_THINKING_LEGACY_STORAGE_KEYS
    )
  } else {
    writeStorageValue(
      SHOW_THINKING_STORAGE_KEY,
      "0",
      SHOW_THINKING_LEGACY_STORAGE_KEYS
    )
  }

  window.dispatchEvent(new Event(SHOW_THINKING_CHANGED_EVENT))
}

function subscribe(onStoreChange: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.storageArea !== localStorage) return
    if (event.key === null) return
    if (
      event.key !== SHOW_THINKING_STORAGE_KEY &&
      !SHOW_THINKING_LEGACY_STORAGE_KEYS.some(
        (legacyKey) => legacyKey === event.key
      )
    ) {
      return
    }
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
