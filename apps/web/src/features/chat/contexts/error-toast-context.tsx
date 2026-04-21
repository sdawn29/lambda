"use client"

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  type ReactNode,
} from "react"
import { toast } from "sonner"
import { type ErrorMessage } from "@/features/chat"

interface ErrorToastEntry {
  id: string
  toastId: string | number
}

interface ErrorToastContextValue {
  showApiError: (error: ErrorMessage) => void
  dismissApiError: (id: string) => void
}

const ErrorToastContext = createContext<ErrorToastContextValue | null>(null)

export function ErrorToastProvider({ children }: { children: ReactNode }) {
  // Track active error toasts by error ID to avoid duplicates
  const activeToastsRef = useRef<Map<string, string>>(new Map())

  const showApiError = useCallback((error: ErrorMessage) => {
    const existingToastId = activeToastsRef.current.get(error.id)

    if (existingToastId) {
      // Update existing toast
      toast.error(error.title, {
        id: existingToastId,
        description: error.message,
        duration: 8000,
      })
      return
    }

    const canRetry = error.action?.type === "retry"
    const toastId = toast.error(error.title, {
      description: error.message,
      duration: 8000,
      action:
        canRetry && error.action?.type === "retry"
          ? {
              label: "Retry",
              onClick: () => {
                // Dispatch a retry event that the chat view can listen to
                window.dispatchEvent(
                  new CustomEvent("chat-retry", {
                    detail: { prompt: error.action?.prompt },
                  })
                )
              },
            }
          : undefined,
    })

    activeToastsRef.current.set(error.id, String(toastId))
  }, [])

  const dismissApiError = useCallback((id: string) => {
    const toastId = activeToastsRef.current.get(id)
    if (toastId) {
      toast.dismiss(toastId)
      activeToastsRef.current.delete(id)
    }
  }, [])

  return (
    <ErrorToastContext.Provider value={{ showApiError, dismissApiError }}>
      {children}
    </ErrorToastContext.Provider>
  )
}

export function useErrorToast() {
  const context = useContext(ErrorToastContext)
  if (!context) {
    throw new Error("useErrorToast must be used within ErrorToastProvider")
  }
  return context
}
