import {
  createContext,
  useCallback,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react"

import { openGlobalWebSocket } from "./api"

/**
 * Thread status aligned with PI SDK AgentState.isStreaming.
 *
 * - "streaming": agent is actively processing (isStreaming: true)
 * - "completed": was streaming, now done - shows green dot (turns to idle after 5s when viewing)
 * - "idle": agent has never streamed or has settled after completion
 */
export type ThreadStatus = "streaming" | "completed" | "idle"

interface ThreadStatusContextValue {
  getStatus: (threadId: string) => ThreadStatus
  setStatus: (threadId: string, status: ThreadStatus) => void
  setActiveThreadId: (threadId: string | null) => void
}

const ThreadStatusContext = createContext<ThreadStatusContextValue | null>(null)

// Track threads that have ever streamed (for completed state)
const STREAMED_THREADS_KEY = "lamda:streamed-threads"

// Time in ms before completed transitions to idle (when user is viewing the thread)
const COMPLETED_VIEW_TIMEOUT_MS = 5000

function getStreamedThreads(): Set<string> {
  try {
    const stored = localStorage.getItem(STREAMED_THREADS_KEY)
    return stored ? new Set(JSON.parse(stored)) : new Set()
  } catch {
    return new Set()
  }
}

function markThreadStreamed(threadId: string): void {
  try {
    const streamed = getStreamedThreads()
    streamed.add(threadId)
    localStorage.setItem(STREAMED_THREADS_KEY, JSON.stringify([...streamed]))
  } catch {
    // Silently fail - localStorage quota issues
  }
}

export function ThreadStatusProvider({ children }: { children: ReactNode }) {
  const [statuses, setStatuses] = useState<Record<string, ThreadStatus>>({})
  // Track timeouts for auto-transitioning completed -> idle
  const [timeouts, setTimeouts] = useState<Record<string, ReturnType<typeof setTimeout>>>({})
  // Track which thread is currently active (user is viewing)
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)

  const getStatus = useCallback(
    (threadId: string): ThreadStatus => statuses[threadId] ?? "idle",
    [statuses]
  )

  const setStatus = useCallback(
    (threadId: string, status: ThreadStatus) => {
      // Track which threads have ever streamed
      if (status === "streaming") {
        markThreadStreamed(threadId)
      }

      setStatuses((prev) => ({ ...prev, [threadId]: status }))
    },
    []
  )

  // When user views a completed thread, start 5 second timer to transition to idle
  useEffect(() => {
    if (!activeThreadId) return

    const threadId = activeThreadId
    const currentStatus = statuses[threadId]

    // If user is viewing a completed thread, start timer
    if (currentStatus === "completed" && !timeouts[threadId]) {
      const timeoutId = setTimeout(() => {
        setTimeouts((prev) => {
          const next = { ...prev }
          delete next[threadId]
          return next
        })
        setStatuses((prev) => {
          // Only transition if still completed
          if (prev[threadId] === "completed") {
            return { ...prev, [threadId]: "idle" }
          }
          return prev
        })
      }, COMPLETED_VIEW_TIMEOUT_MS)

      setTimeouts((prev) => ({ ...prev, [threadId]: timeoutId }))
    }
  }, [activeThreadId, statuses, timeouts])

  // Cleanup timeouts when thread is no longer completed or active
  useEffect(() => {
    return () => {
      for (const [threadId, timeoutId] of Object.entries(timeouts)) {
        if (statuses[threadId] !== "completed" || threadId !== activeThreadId) {
          clearTimeout(timeoutId)
          setTimeouts((prev) => {
            const next = { ...prev }
            delete next[threadId]
            return next
          })
        }
      }
    }
  }, [statuses, timeouts, activeThreadId])

  // Real-time updates from server via global WebSocket
  useEffect(() => {
    let active = true
    let ws: WebSocket | null = null

    openGlobalWebSocket()
      .then((socket) => {
        if (!socket || !active) {
          socket?.close()
          return
        }
        ws = socket

        ws.addEventListener("message", (e: MessageEvent) => {
          if (!active) return
          try {
            const data = JSON.parse(e.data as string) as {
              type: string
              threadId?: string
              status?: "streaming" | "idle"
            }

            if (
              data.type === "thread_status" &&
              data.threadId &&
              data.status
            ) {
              // When server says "idle", check if thread ever streamed
              // If so, show "completed" (green dot) instead of "idle" (transparent)
              if (data.status === "idle") {
                const streamed = getStreamedThreads()
                setStatus(
                  data.threadId,
                  streamed.has(data.threadId) ? "completed" : "idle"
                )
              } else {
                setStatus(data.threadId, data.status)
              }
            }
          } catch (error) {
            console.error("[thread-status]", error)
          }
        })

        ws.addEventListener("error", () => {})
      })
      .catch((error) => {
        if (active) {
          console.debug("[thread-status] WebSocket unavailable:", error)
        }
      })

    return () => {
      active = false
      ws?.close()
    }
  }, [setStatus])

  return (
    <ThreadStatusContext.Provider value={{ getStatus, setStatus, setActiveThreadId }}>
      {children}
    </ThreadStatusContext.Provider>
  )
}

export function useThreadStatus(threadId: string): ThreadStatus {
  const ctx = useContext(ThreadStatusContext)
  if (!ctx)
    throw new Error(
      "useThreadStatus must be used within ThreadStatusProvider"
    )
  return ctx.getStatus(threadId)
}

export function useSetThreadStatus() {
  const ctx = useContext(ThreadStatusContext)
  if (!ctx)
    throw new Error(
      "useSetThreadStatus must be used within ThreadStatusProvider"
    )
  return ctx.setStatus
}

export function useSetActiveThreadId() {
  const ctx = useContext(ThreadStatusContext)
  if (!ctx)
    throw new Error(
      "useSetActiveThreadId must be used within ThreadStatusProvider"
    )
  return ctx.setActiveThreadId
}
