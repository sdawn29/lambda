import { useAppSettings } from "@/features/settings/queries"
import { APP_SETTINGS_KEYS } from "./storage-keys"

export function useShowThinkingSetting(): boolean {
  const { data: settings } = useAppSettings()
  return settings?.[APP_SETTINGS_KEYS.SHOW_THINKING] !== "0"
}

export const DEFAULT_THINKING_PHRASES = [
  "Thinking...",
  "Sketching the plan...",
  "Checking the details...",
  "Pulling the pieces together...",
  "Polishing the answer...",
]

export function useThinkingPhrases(): string[] {
  const { data: settings } = useAppSettings()
  const raw = settings?.[APP_SETTINGS_KEYS.THINKING_PHRASES]
  if (!raw) return DEFAULT_THINKING_PHRASES
  const parsed = raw
    .split("\n")
    .map((p) => p.trim())
    .filter(Boolean)
  return parsed.length > 0 ? parsed : DEFAULT_THINKING_PHRASES
}
