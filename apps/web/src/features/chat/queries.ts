import { useQuery } from "@tanstack/react-query"
import { listMessages, fetchModels, listWorkspaceFiles } from "./api"
import type { StoredMessageDto, Message } from "./types"

const chatRootKey = ["chat"] as const
const chatSessionKey = (sessionId: string) =>
  [...chatRootKey, "session", sessionId] as const

export const chatKeys = {
  all: chatRootKey,
  session: chatSessionKey,
  messages: (sessionId: string) =>
    [...chatSessionKey(sessionId), "messages"] as const,
  models: [...chatRootKey, "models"] as const,
  workspaceFiles: (sessionId: string) =>
    [...chatSessionKey(sessionId), "workspace-files"] as const,
}

// ── Messages ──────────────────────────────────────────────────────────────────

function storedToMessage(m: StoredMessageDto): Message {
  if (m.role === "tool") {
    const data = JSON.parse(m.content) as {
      toolCallId: string
      toolName: string
      args: unknown
      result: unknown
      status: "running" | "done" | "error"
    }
    return {
      role: "tool",
      toolCallId: data.toolCallId,
      toolName: data.toolName,
      args: data.args,
      result: data.result,
      status: data.status,
    }
  }
  return { role: m.role as "user" | "assistant", content: m.content }
}

export const messagesQueryKey = (sessionId: string) =>
  chatKeys.messages(sessionId)

export function useMessages(sessionId: string) {
  return useQuery({
    queryKey: messagesQueryKey(sessionId),
    queryFn: async () => {
      const { messages: stored } = await listMessages(sessionId)
      return stored.map(storedToMessage)
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!sessionId,
  })
}

// ── Models ────────────────────────────────────────────────────────────────────

export const modelsQueryKey = chatKeys.models

export function useModels() {
  return useQuery({
    queryKey: modelsQueryKey,
    queryFn: ({ signal }) => fetchModels(signal),
    staleTime: 5 * 60 * 1000,
    retry: false,
  })
}

// ── Workspace files ───────────────────────────────────────────────────────────

export const workspaceFilesQueryKey = (sessionId: string) =>
  chatKeys.workspaceFiles(sessionId)

export function useWorkspaceFiles(sessionId: string | undefined) {
  return useQuery({
    queryKey: sessionId ? workspaceFilesQueryKey(sessionId) : chatKeys.all,
    queryFn: () => listWorkspaceFiles(sessionId!),
    enabled: !!sessionId,
    staleTime: 30_000,
    select: (data) => data,
  })
}
