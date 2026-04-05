import { createFileRoute, Navigate } from "@tanstack/react-router"

import { WorkspaceEmptyState } from "@/components/workspace-empty-state"
import { useWorkspace } from "@/hooks/workspace-context"

const LS_THREAD_KEY = "lambda-code:activeThreadId"

export const Route = createFileRoute("/")({
  component: Index,
})

function Index() {
  const { workspaces, isLoading } = useWorkspace()

  if (isLoading) return null

  if (workspaces.length === 0) return <WorkspaceEmptyState />

  const allThreads = workspaces.flatMap((w) => w.threads)
  const savedThId = localStorage.getItem(LS_THREAD_KEY)
  const thread = allThreads.find((t) => t.id === savedThId) ?? allThreads[0]

  if (thread) {
    return <Navigate to="/thread/$threadId" params={{ threadId: thread.id }} />
  }

  return <WorkspaceEmptyState />
}
