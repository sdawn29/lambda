const APP_STORAGE_NAMESPACE = "lamda"
const LEGACY_APP_STORAGE_NAMESPACE = "lambda"
const APP_CODE_STORAGE_NAMESPACE = "lamda-code"
const LEGACY_APP_CODE_STORAGE_NAMESPACE = "lambda-code"

export const COMMIT_PROMPT_STORAGE_KEY = `${APP_STORAGE_NAMESPACE}:commit-message-prompt`
export const LEGACY_COMMIT_PROMPT_STORAGE_KEY = `${LEGACY_APP_STORAGE_NAMESPACE}:commit-message-prompt`
export const COMMIT_PROMPT_LEGACY_STORAGE_KEYS = [
  LEGACY_COMMIT_PROMPT_STORAGE_KEY,
] as const

export const SHOW_THINKING_STORAGE_KEY = `${APP_STORAGE_NAMESPACE}:show-thinking`
export const LEGACY_SHOW_THINKING_STORAGE_KEY = `${LEGACY_APP_STORAGE_NAMESPACE}:show-thinking`
export const SHOW_THINKING_LEGACY_STORAGE_KEYS = [
  LEGACY_SHOW_THINKING_STORAGE_KEY,
] as const
export const SHOW_THINKING_CHANGED_EVENT = `${APP_STORAGE_NAMESPACE}:show-thinking-changed`

export const OPEN_WITH_STORAGE_KEY = `${APP_STORAGE_NAMESPACE}:open-with:v1`
export const LEGACY_OPEN_WITH_STORAGE_KEY = `${LEGACY_APP_STORAGE_NAMESPACE}:open-with:v1`
export const OPEN_WITH_LEGACY_STORAGE_KEYS = [
  LEGACY_OPEN_WITH_STORAGE_KEY,
] as const

export const ACTIVE_THREAD_STORAGE_KEY = `${APP_CODE_STORAGE_NAMESPACE}:activeThreadId`
export const LEGACY_ACTIVE_THREAD_STORAGE_KEY = `${LEGACY_APP_CODE_STORAGE_NAMESPACE}:activeThreadId`
export const ACTIVE_THREAD_LEGACY_STORAGE_KEYS = [
  LEGACY_ACTIVE_THREAD_STORAGE_KEY,
] as const

export function getThreadModelStorageKey(threadId: string) {
  return `${APP_CODE_STORAGE_NAMESPACE}:threadModel:${threadId}`
}

export function getLegacyThreadModelStorageKey(threadId: string) {
  return `${LEGACY_APP_CODE_STORAGE_NAMESPACE}:threadModel:${threadId}`
}

export function getStoppedStorageKey(threadId: string) {
  return `${APP_CODE_STORAGE_NAMESPACE}:stopped:${threadId}`
}

export function getLegacyStoppedStorageKey(threadId: string) {
  return `${LEGACY_APP_CODE_STORAGE_NAMESPACE}:stopped:${threadId}`
}

export function readStorageValue(
  primaryKey: string,
  legacyKeys: readonly string[] = []
) {
  if (typeof window === "undefined") return null

  const currentValue = localStorage.getItem(primaryKey)
  if (currentValue !== null) return currentValue

  for (const legacyKey of legacyKeys) {
    const legacyValue = localStorage.getItem(legacyKey)
    if (legacyValue !== null) return legacyValue
  }

  return null
}

export function writeStorageValue(
  primaryKey: string,
  value: string,
  legacyKeys: readonly string[] = []
) {
  if (typeof window === "undefined") return

  localStorage.setItem(primaryKey, value)
  for (const legacyKey of legacyKeys) {
    if (legacyKey !== primaryKey) {
      localStorage.removeItem(legacyKey)
    }
  }
}

export function removeStorageValue(
  primaryKey: string,
  legacyKeys: readonly string[] = []
) {
  if (typeof window === "undefined") return

  localStorage.removeItem(primaryKey)
  for (const legacyKey of legacyKeys) {
    if (legacyKey !== primaryKey) {
      localStorage.removeItem(legacyKey)
    }
  }
}
