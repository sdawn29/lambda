const ASSISTANT_MESSAGE_CONTENT_KIND = "lamda:assistant-message/v1"
const LEGACY_ASSISTANT_MESSAGE_CONTENT_KIND = "lambda:assistant-message/v1"

type StoredAssistantMessageContentKind =
  | typeof ASSISTANT_MESSAGE_CONTENT_KIND
  | typeof LEGACY_ASSISTANT_MESSAGE_CONTENT_KIND

interface StoredAssistantMessageContent {
  type: StoredAssistantMessageContentKind
  content: string
  thinking?: string
}

function isStoredAssistantMessageContent(
  value: unknown
): value is StoredAssistantMessageContent {
  if (typeof value !== "object" || value === null) return false

  const candidate = value as Record<string, unknown>
  return (
    (candidate.type === ASSISTANT_MESSAGE_CONTENT_KIND ||
      candidate.type === LEGACY_ASSISTANT_MESSAGE_CONTENT_KIND) &&
    typeof candidate.content === "string" &&
    (candidate.thinking === undefined || typeof candidate.thinking === "string")
  )
}

export interface UserMessage {
  role: "user"
  content: string
}

export interface AssistantMessage {
  role: "assistant"
  content: string
  thinking: string
}

export type TextMessage = UserMessage | AssistantMessage

export interface ToolMessage {
  role: "tool"
  toolCallId: string
  toolName: string
  args: unknown
  status: "running" | "done" | "error"
  result?: unknown
}

export type Message = TextMessage | ToolMessage

export function createAssistantMessage(
  value: Partial<Pick<AssistantMessage, "content" | "thinking">> = {}
): AssistantMessage {
  return {
    role: "assistant",
    content: value.content ?? "",
    thinking: value.thinking ?? "",
  }
}

export function parseAssistantMessageContent(
  content: string
): Pick<AssistantMessage, "content" | "thinking"> {
  try {
    const parsed = JSON.parse(content) as unknown
    if (isStoredAssistantMessageContent(parsed)) {
      return {
        content: parsed.content,
        thinking: parsed.thinking ?? "",
      }
    }
  } catch {
    return {
      content,
      thinking: "",
    }
  }

  return {
    content,
    thinking: "",
  }
}

export interface StoredMessageDto {
  id: string
  threadId: string
  role: "user" | "assistant" | "tool"
  content: string
  createdAt: number
}
