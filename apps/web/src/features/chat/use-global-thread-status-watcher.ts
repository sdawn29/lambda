import { useEffect, useRef } from "react"
import { openGlobalEventSource } from "./api"
import { useSetThreadStatus } from "./thread-status-context"

export function useGlobalThreadStatusWatcher(activeThreadId?: string) {
  const setStatus = useSetThreadStatus()
  const activeThreadIdRef = useRef(activeThreadId)
  activeThreadIdRef.current = activeThreadId

  useEffect(() => {
    let active = true
    let es: EventSource | null = null

    openGlobalEventSource().then((eventSource) => {
      if (!active) {
        eventSource.close()
        return
      }
      es = eventSource

      es.addEventListener("thread_status", (e: MessageEvent) => {
        if (!active) return
        try {
          const { threadId, status } = JSON.parse(e.data) as {
            threadId: string
            status: "running" | "idle"
          }
          if (status === "idle" && threadId !== activeThreadIdRef.current) {
            setStatus(threadId, "completed")
          } else {
            setStatus(threadId, status)
          }
        } catch (error) {
          console.error("[thread-status]", error)
        }
      })
    })

    return () => {
      active = false
      es?.close()
    }
  }, [setStatus])
}
