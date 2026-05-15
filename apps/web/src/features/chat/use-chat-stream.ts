/**
 * Chat stream hook — connects the WebSocket stream to UI state.
 *
 * Responsibilities:
 * - Opens a WebSocket for the session and dispatches events to callbacks
 * - Manages isLoading, isCompacting, pendingError as local state
 * - Provides startUserPrompt() which optimistically adds the user message
 *
 * The isLoading state is scoped to the current sessionId. When sessionId
 * changes (thread switch), the previous session's loading is cleared by the
 * new session's WebSocket opening (which calls onIsLoadingChange(true) via
 * onMessageStart). No explicit session change handling is needed here.
 */
import { useCallback, useEffect, useState, useRef } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { useSessionStream } from "./hooks/use-session-stream"
import { useVisibleMessages } from "./hooks/use-visible-messages"
import { messagesQueryKey } from "./queries"
import { dismissSessionError } from "./api"
import { createErrorMessage } from "./types"
import type { ErrorMessage, Message } from "./types"
import { useSetThreadStatus } from "./thread-status-store"
import { gitStatusKey, gitKeys } from "@/features/git/queries"

const FILE_MODIFYING_TOOLS = new Set([
  "write", "edit", "create", "delete", "replace", "move", "copy",
  "writefile", "write_file", "editfile", "edit_file", "createfile", "create_file",
  "bash", "shell",
])

function isFileModifyingTool(toolName: string): boolean {
  if (FILE_MODIFYING_TOOLS.has(toolName.toLowerCase())) return true
  const lower = toolName.toLowerCase()
  return lower.includes("write") || lower.includes("edit") ||
    lower.includes("create") || lower.includes("delete") ||
    lower.includes("mkdir") || lower.includes("move") ||
    lower.includes("copy") || lower.includes("bash") ||
    lower.includes("shell")
}

interface UseChatStreamOptions {
  sessionId: string
  threadId: string
  initialIsStopped: boolean
}

interface UseChatStreamResult {
  visibleMessages: Message[]
  hasConversationHistory: boolean
  hasLoadedMessages: boolean
  isLoading: boolean
  isStopped: boolean
  isCompacting: boolean
  compactionReason: "manual" | "threshold" | "overflow" | null
  startUserPrompt: (text: string, thinkingLevel?: string) => void
  markStopped: () => void
  markSendFailed: () => void
  dismissError: (id: string) => void
}

export function useChatStream({
  sessionId,
  threadId,
  initialIsStopped,
}: UseChatStreamOptions): UseChatStreamResult {
  const setThreadStatus = useSetThreadStatus()
  const queryClient = useQueryClient()
  const [isStopped, setIsStopped] = useState(initialIsStopped)
  const [isCompacting, setIsCompacting] = useState(false)
  const [compactionReason, setCompactionReason] = useState<"manual" | "threshold" | "overflow" | null>(null)
  const [pendingError, setPendingError] = useState<ReturnType<typeof createErrorMessage> | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Track whether a live message_start fired in this session. Only errors that
  // follow a live stream should mark the thread as "error" — replayed agent_end
  // events from a previous run must not re-raise the red dot on refresh or
  // when switching back to this thread.
  const hadLiveLoadingRef = useRef(false)

  // Reset state during render when the session changes ("adjusting state while
  // rendering" — React batches these setters and does one synchronous re-render).
  const [localSessionId, setLocalSessionId] = useState(sessionId)
  if (localSessionId !== sessionId) {
    setLocalSessionId(sessionId)
    setIsLoading(false)
    setIsStopped(initialIsStopped)
    setIsCompacting(false)
    setCompactionReason(null)
    setPendingError(null)
  }

  // Reset the ref flag on session change. An effect that only mutates a ref
  // (no setState) does not cause cascading renders and is safe in React 19.
  useEffect(() => {
    hadLiveLoadingRef.current = false
  }, [sessionId])

  const { messages } = useVisibleMessages({ sessionId, pendingError })

  const handleIsLoadingChange = useCallback((loading: boolean) => {
    if (loading) hadLiveLoadingRef.current = true
    setIsLoading(loading)
  }, [])

  const handleError = useCallback(() => {
    if (hadLiveLoadingRef.current) {
      setThreadStatus(threadId, "error")
    }
  }, [setThreadStatus, threadId])

  const handleToolExecutionEnd = useCallback((toolName: string) => {
    void queryClient.invalidateQueries({ queryKey: gitKeys.session(sessionId) })
    void queryClient.invalidateQueries({ queryKey: ["file-tree"] })
    if (isFileModifyingTool(toolName)) {
      void queryClient.refetchQueries({ queryKey: gitStatusKey(sessionId) })
      void queryClient.refetchQueries({ queryKey: ["file-tree"] })
    }
  }, [queryClient, sessionId])

  const handleCompactionEnd = useCallback((success: boolean) => {
    if (success) {
      toast.success("Context compacted", {
        description: "Conversation history was summarized to free up the context window.",
        duration: 3000,
      })
    }
  }, [])

  // Connect to WebSocket stream
  const { lastPromptRef, pendingThinkingLevelRef } = useSessionStream({
    sessionId,
    onIsLoadingChange: handleIsLoadingChange,
    onIsCompactingChange: setIsCompacting,
    onCompactionReasonChange: setCompactionReason,
    onCompactionEnd: handleCompactionEnd,
    onPendingErrorChange: setPendingError,
    onError: handleError,
    onToolExecutionEnd: handleToolExecutionEnd,
  })

  const hasLoadedMessages = messages.length > 0 || isLoading

  const startUserPrompt = useCallback(
    (text: string, thinkingLevel?: string) => {
      setIsStopped(false)
      setIsLoading(true)
      lastPromptRef.current = { text, thinkingLevel }
      pendingThinkingLevelRef.current = thinkingLevel ?? null

      const userMessage: Message = { role: "user", content: text }
      queryClient.setQueryData<Message[]>(messagesQueryKey(sessionId), (prev) => {
        const current = prev ?? []
        const lastMsg = current[current.length - 1]
        // Avoid duplicate if the same message was sent twice quickly
        if (
          current.length > 0 &&
          lastMsg.role === "user" &&
          (lastMsg as Message & { content?: string }).content === text
        ) {
          return current
        }
        return [...current, userMessage]
      })
    },
    [queryClient, sessionId, lastPromptRef, pendingThinkingLevelRef]
  )

  const markStopped = useCallback(() => setIsStopped(true), [])

  const markSendFailed = useCallback(() => {
    setIsLoading(false)
    setPendingError(
      createErrorMessage("Send failed", "Failed to send message. Please try again.", {
        retryable: true,
        action: lastPromptRef.current
          ? { type: "retry", prompt: lastPromptRef.current.text }
          : { type: "dismiss" },
      })
    )
  }, [lastPromptRef])

  const dismissError = useCallback(
    (id: string) => {
      queryClient.setQueryData<Message[]>(messagesQueryKey(sessionId), (prev) =>
        (prev ?? []).filter(
          (m): boolean => !(m.role === "error" && (m as ErrorMessage).id === id)
        )
      )
      setPendingError((prev) => (prev?.id === id ? null : prev))
      // Tell the server to drop error events from its replay buffer so they
      // don't reappear when the WebSocket reconnects after a page refresh.
      dismissSessionError(sessionId).catch(() => { /* best-effort */ })
    },
    [queryClient, sessionId]
  )

  return {
    visibleMessages: messages,
    hasConversationHistory: messages.length > 0,
    hasLoadedMessages,
    isLoading,
    isStopped,
    isCompacting,
    compactionReason,
    startUserPrompt,
    markStopped,
    markSendFailed,
    dismissError,
  }
}
