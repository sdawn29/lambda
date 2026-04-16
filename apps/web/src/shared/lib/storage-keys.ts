export const APP_SETTINGS_KEYS = {
  ACTIVE_THREAD_ID: "active_thread_id",
  COMMIT_MESSAGE_PROMPT: "commit_message_prompt",
  SHOW_THINKING: "show_thinking",
  THEME: "theme",
} as const

export type AppSettingKey = (typeof APP_SETTINGS_KEYS)[keyof typeof APP_SETTINGS_KEYS]
