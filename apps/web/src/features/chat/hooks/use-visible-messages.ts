import { useMessages } from "../queries"

export interface UseVisibleMessagesOptions {
  sessionId: string
}

/**
 * Returns persisted messages from TanStack Query for the given session.
 *
 * Error handling strategy:
 * - Session-level errors (from onAgentEnd with stopReason=error) are stored
 *   in the query cache and included in persistedMessages after re-fetch
 * - Compaction dividers come from the DB (persisted via insertCompactionBlock
 *   on the server) and are included in persistedMessages after re-fetch
 * - Pending errors are now surfaced via useChatStream.pendingError and rendered
 *   as a ChatErrorAlert banner above the input — not injected into this list
 */
export function useVisibleMessages({ sessionId }: UseVisibleMessagesOptions) {
  const { data: persistedMessages = [], isLoading, isFetching, dataUpdatedAt } = useMessages(sessionId)

  // Loading state: true only when truly loading (no data and fetching)
  // Once we have data from localStorage, show it immediately
  // isFetching indicates background sync with server
  const isLoadingMessages = isLoading || (!persistedMessages.length && isFetching)

  return {
    messages: persistedMessages,
    isLoading: isLoadingMessages,
    isFetching,
    dataUpdatedAt,
  }
}
