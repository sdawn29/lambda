import { createFileRoute, Navigate } from "@tanstack/react-router"

import { WorkspaceEmptyState } from "@/features/workspace"
import { useWorkspace } from "@/features/workspace"
import {
  ACTIVE_THREAD_LEGACY_STORAGE_KEYS,
  ACTIVE_THREAD_STORAGE_KEY,
  readStorageValue,
} from "@/shared/lib/storage-keys"

export const Route = createFileRoute("/")({
  component: Index,
})

function Index() {
  const { workspaces, isLoading } = useWorkspace()

  if (isLoading) return null

  if (workspaces.length === 0) return <WorkspaceEmptyState />

  const allThreads = workspaces.flatMap((w) => w.threads)
  const savedThId = readStorageValue(
    ACTIVE_THREAD_STORAGE_KEY,
    ACTIVE_THREAD_LEGACY_STORAGE_KEYS
  )
  const thread = allThreads.find((t) => t.id === savedThId) ?? allThreads[0]

  if (thread) {
    return (
      <Navigate to="/workspace/$threadId" params={{ threadId: thread.id }} />
    )
  }

  return <WorkspaceEmptyState />
}
