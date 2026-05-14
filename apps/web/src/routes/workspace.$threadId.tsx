import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { lazy, Suspense, useEffect, useMemo, useRef } from "react"

import { ChatView, useSetActiveThreadId } from "@/features/chat"
import { useWorkspace, useWorkspaces } from "@/features/workspace"
import { useDiffPanel } from "@/features/git"
import { useFileTree } from "@/features/file-tree"
import { useMainTabs, MainTabBar } from "@/features/main-tabs"
import { useUpdateAppSetting } from "@/features/settings/mutations"
import { useUpdateThreadLastAccessed } from "@/features/workspace/mutations"
import { APP_SETTINGS_KEYS } from "@/shared/lib/storage-keys"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/shared/ui/resizable"
import { Skeleton } from "@/shared/ui/skeleton"

const DiffPanel = lazy(() =>
  import("@/features/git").then((module) => ({
    default: module.DiffPanel,
  }))
)

const FileTree = lazy(() =>
  import("@/features/file-tree").then((module) => ({
    default: module.FileTree,
  }))
)

export const Route = createFileRoute("/workspace/$threadId")({
  component: WorkspaceThreadRoute,
})

function WorkspaceThreadRoute() {
  const { threadId } = Route.useParams()
  const { workspaces, isLoading } = useWorkspace()
  const { isFetching } = useWorkspaces()
  const navigate = useNavigate()
  const {
    isOpen: diffOpen,
    isFullscreen: diffFullscreen,
    setCurrentWorkspace,
  } = useDiffPanel()
  const { isOpen: fileTreeOpen } = useFileTree()
  const { mutate: updateSetting } = useUpdateAppSetting()
  const { mutate: updateLastAccessed } = useUpdateThreadLastAccessed()
  const setActiveThreadId = useSetActiveThreadId()
  const { addThreadTab, updateThreadTitle } = useMainTabs()

  // Set active thread when viewing this thread
  useEffect(() => {
    setActiveThreadId(threadId)
    return () => {
      // Clear active thread when navigating away
      setActiveThreadId(null)
    }
  }, [threadId, setActiveThreadId])

  // Find current workspace
  const foundWorkspace = useMemo(
    () => workspaces.find((ws) => ws.threads.some((t) => t.id === threadId)),
    [workspaces, threadId]
  )
  const foundThread = useMemo(
    () => foundWorkspace?.threads.find((t) => t.id === threadId),
    [foundWorkspace, threadId]
  )

  // Keep a stable sessionId for DiffPanel that only changes when the workspace
  // changes, not when the user switches threads within the same workspace.
  // Git data (status, diffs, stash) is workspace-level, not thread-level.
  const prevWorkspaceIdRef = useRef<string | undefined>(undefined)
  const diffPanelSessionIdRef = useRef<string | null>(null)
  const currentWorkspaceId = foundWorkspace?.id
  if (currentWorkspaceId !== prevWorkspaceIdRef.current) {
    prevWorkspaceIdRef.current = currentWorkspaceId
    diffPanelSessionIdRef.current = foundThread?.sessionId ?? null
  }
  const diffPanelSessionId = diffPanelSessionIdRef.current

  // Set workspace path in diff panel context for breadcrumb navigation
  const currentPathRef = useRef<string | null>(null)
  useEffect(() => {
    const newPath = foundWorkspace?.path ?? null
    if (newPath !== currentPathRef.current) {
      currentPathRef.current = newPath
      setCurrentWorkspace(newPath ?? "")
    }
    return () => {
      currentPathRef.current = null
    }
  }, [foundWorkspace?.path, setCurrentWorkspace])

  useEffect(() => {
    updateSetting({
      key: APP_SETTINGS_KEYS.ACTIVE_THREAD_ID,
      value: threadId,
    })
    updateLastAccessed(threadId)
  }, [threadId, updateSetting, updateLastAccessed])

  // Register thread tab when this route mounts (handles initial URL load)
  useEffect(() => {
    if (foundThread) {
      addThreadTab(foundThread.id, foundThread.title)
    }
  }, [foundThread, addThreadTab])

  // Keep tab title in sync when thread is renamed
  useEffect(() => {
    if (foundThread) {
      updateThreadTitle(foundThread.id, foundThread.title)
    }
  }, [foundThread, updateThreadTitle])

  useEffect(() => {
    if (!isLoading && !isFetching && !foundThread) {
      navigate({ to: "/" })
    }
  }, [isLoading, isFetching, foundThread, navigate])

  const isContentReady =
    !!foundWorkspace && !!foundThread && !!foundThread.sessionId

  if (diffFullscreen && isContentReady) {
    return (
      <div className="flex h-full border-t">
        <div className="flex min-w-0 flex-1">
          <Suspense fallback={<div className="h-full flex-1 bg-muted/10" />}>
            <DiffPanel
              sessionId={diffPanelSessionId ?? foundThread.sessionId!}
              openWithAppId={foundWorkspace.openWithAppId}
            />
          </Suspense>
        </div>
        {fileTreeOpen && (
          <div className="h-full w-56 shrink-0 border-l border-sidebar-border">
            <Suspense fallback={<div className="h-full w-full bg-background" />}>
              <FileTree
                workspaceId={foundWorkspace.id}
                workspacePath={foundWorkspace.path}
              />
            </Suspense>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex h-full border-t">
      <ResizablePanelGroup orientation="horizontal" className="flex-1">
        <ResizablePanel defaultSize={diffOpen ? "50" : "100"} minSize="50">
          <div className="flex h-full flex-col">
            <MainTabBar />
            <div className="min-h-0 flex-1 overflow-hidden">
              {isContentReady ? (
                <ChatView
                  sessionId={foundThread.sessionId!}
                  workspaceId={foundWorkspace.id}
                  threadId={foundThread.id}
                  initialModelId={foundThread.modelId}
                  initialIsStopped={foundThread.isStopped}
                />
              ) : (
                <ChatViewSkeleton />
              )}
            </div>
          </div>
        </ResizablePanel>
        {diffOpen && isContentReady && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize="45" minSize="40">
              <Suspense
                fallback={
                  <div className="h-full border-l border-border/60 bg-muted/10" />
                }
              >
                <DiffPanel
                  sessionId={diffPanelSessionId ?? foundThread.sessionId!}
                  openWithAppId={foundWorkspace.openWithAppId}
                />
              </Suspense>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>

      {fileTreeOpen && isContentReady && (
        <div className="h-full w-56 shrink-0 border-l border-sidebar-border">
          <Suspense fallback={<div className="h-full w-full bg-background" />}>
            <FileTree
              workspaceId={foundWorkspace.id}
              workspacePath={foundWorkspace.path}
            />
          </Suspense>
        </div>
      )}
    </div>
  )
}

function ChatViewSkeleton() {
  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      <div className="flex w-full flex-1 flex-col overflow-hidden pt-6 pb-4">
        <div className="mx-auto w-full max-w-3xl space-y-6 px-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="space-y-2 pl-8">
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
            <Skeleton className="h-4 w-3/6" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </div>
      </div>
      <div className="mx-auto w-full max-w-3xl shrink-0 px-6 py-2">
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    </div>
  )
}
