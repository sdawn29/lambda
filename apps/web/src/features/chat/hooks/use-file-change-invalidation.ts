/**
 * File-change invalidation is now handled inside useChatStream via the
 * onToolExecutionEnd callback passed to useSessionStream.  This module is
 * kept as an empty shell so any remaining import sites compile without error
 * while the migration is completed.
 *
 * @deprecated Remove this file once all callers have been updated.
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useFileChangeInvalidation(_sessionId: string | null): void {
  // no-op: logic lives in use-chat-stream → useSessionStream → onToolExecutionEnd
}
