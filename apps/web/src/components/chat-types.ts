export interface TextMessage {
  role: "user" | "assistant"
  content: string
}

export interface ToolMessage {
  role: "tool"
  toolCallId: string
  toolName: string
  args: unknown
  status: "running" | "done" | "error"
  result?: unknown
}

export type Message = TextMessage | ToolMessage
