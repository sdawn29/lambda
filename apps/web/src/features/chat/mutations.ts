import { useMutation } from "@tanstack/react-query"
import { sendPrompt, generateTitle } from "./api"

// ── Send prompt ───────────────────────────────────────────────────────────────

interface SendPromptVars {
  text: string
  model?: { provider: string; modelId: string }
  thinkingLevel?: string
}

export function useSendPrompt(sessionId: string) {
  return useMutation({
    mutationFn: ({ text, model, thinkingLevel }: SendPromptVars) =>
      sendPrompt(sessionId, text, model, thinkingLevel),
  })
}

// ── Generate title ────────────────────────────────────────────────────────────

export function useGenerateTitle() {
  return useMutation({
    mutationFn: (message: string) => generateTitle(message),
  })
}
