import { useMutation } from "@tanstack/react-query"
import { sendPrompt } from "@/api/sessions"

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
