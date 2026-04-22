import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useWorkspaces } from "@/features/workspace"
import { messagesQueryKey, storedToMessage } from "../queries"
import { listMessages } from "../api"
import type { Message } from "../types"

interface UsePrefetchThreadsMessagesOptions {
  /** Only prefetch when this thread is active (optional) */
  activeThreadId?: string | null
}

/**
 * Prefetches messages for all threads in the workspace context.
 * 
 * This hook should be used at the app root level to ensure all thread messages
 * are cached when the user views the sidebar, making thread switches instant.
 */
export function usePrefetchThreadsMessages({
  activeThreadId,
}: UsePrefetchThreadsMessagesOptions = {}) {
  const { data: workspaces = [] } = useWorkspaces()
  const queryClient = useQueryClient()

  useEffect(() => {
    for (const workspace of workspaces) {
      for (const thread of workspace.threads) {
        if (!thread.sessionId) continue

        // Skip if already cached with data
        const cachedData = queryClient.getQueryData<Message[]>(
          messagesQueryKey(thread.sessionId)
        )
        if (cachedData && cachedData.length > 0) {
          continue
        }

        // Start prefetch in background
        void queryClient.prefetchQuery({
          queryKey: messagesQueryKey(thread.sessionId),
          queryFn: async () => {
            const { messages: stored } = await listMessages(thread.sessionId!)
            return stored.map(storedToMessage)
          },
          staleTime: 30 * 60 * 1000,
        })
      }
    }
  }, [workspaces, queryClient, activeThreadId])
}