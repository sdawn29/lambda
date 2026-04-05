import { createFileRoute } from "@tanstack/react-router"

import { ChatView } from "@/components/chat-view"
import { useWorkspace } from "@/hooks/workspace-context"

export const Route = createFileRoute("/")({
  component: Index,
})

function Index() {
  const { activeWorkspace, activeThread } = useWorkspace()

  if (!activeWorkspace || !activeThread) return null

  return (
    <ChatView
      key={activeThread.id}
      sessionId={activeThread.sessionId}
      workspaceName={activeWorkspace.name}
      workspaceId={activeWorkspace.id}
      threadId={activeThread.id}
    />
  )
}
