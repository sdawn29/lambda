import { createRootRoute, Outlet, useParams, useRouter } from "@tanstack/react-router"
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react"
import type { PanelImperativeHandle } from "react-resizable-panels"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { AppSidebar } from "@/features/workspace"
import { TitleBar } from "@/features/layout"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/shared/ui/resizable"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/shared/ui/sidebar"
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/shared/ui/tooltip"
import { WorkspaceProvider, useWorkspace } from "@/features/workspace"
import { useTerminal } from "@/features/terminal"
import { useDiffPanel } from "@/features/git"
import { useFileTree } from "@/features/file-tree/store"
import {
  MainTabBar,
  FileContentView,
  TabsEmptyState,
  useMainTabs,
} from "@/features/main-tabs"

import { usePrefetchThreadsMessages } from "@/features/chat/hooks"
import {
  ServerUnavailable,
  useElectronServerStatus,
  useElectronUpdateStatus,
  useElectronPlatform,
  useElectronFullscreen,
  useInstallUpdate,
} from "@/features/electron"
import { SettingsModal, ConfigureProviderModal } from "@/features/settings"
import { CommandPalette } from "@/features/command-palette"
import { ErrorBoundary } from "@/shared/components/error-boundary"
import { SplashScreen } from "@/shared/components/splash-screen"
import { Toaster } from "@/shared/ui/sonner"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import { useShortcutBinding } from "@/shared/components/keyboard-shortcuts-provider"
import { SHORTCUT_ACTIONS } from "@/shared/lib/keyboard-shortcuts"
import { ShortcutKbd } from "@/shared/ui/kbd"

const TerminalPanel = lazy(() =>
  import("@/features/terminal").then((module) => ({
    default: module.TerminalPanel,
  }))
)

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

function NavigationControls() {
  const { data: platform } = useElectronPlatform()
  const { data: isFullscreen = false } = useElectronFullscreen()
  const isMac = platform === "darwin"

  const router = useRouter()
  const canGoBack = router.history.canGoBack()
  const { subscribe, getSnapshot } = useMemo(() => {
    let count = 0
    return {
      subscribe: (notify: () => void) =>
        router.history.subscribe(({ action }) => {
          if (action.type === "PUSH" || action.type === "REPLACE") count = 0
          else if (action.type === "BACK") count++
          else if (action.type === "FORWARD") count = Math.max(0, count - 1)
          notify()
        }),
      getSnapshot: () => count > 0,
    }
  }, [router.history])
  const canGoForward = useSyncExternalStore(subscribe, getSnapshot, () => false)

  const sidebarBinding = useShortcutBinding(SHORTCUT_ACTIONS.TOGGLE_SIDEBAR)
  const backBinding = useShortcutBinding(SHORTCUT_ACTIONS.NAVIGATE_BACK)
  const forwardBinding = useShortcutBinding(SHORTCUT_ACTIONS.NAVIGATE_FORWARD)

  return (
    <div
      className={cn(
        "fixed top-0 z-50 flex h-11 items-center gap-0.5 pr-2",
        isMac && !isFullscreen ? "pl-20" : "pl-2"
      )}
      style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
    >
      <Tooltip>
        <TooltipTrigger
          render={
            <SidebarTrigger className="size-7 text-muted-foreground/70 hover:text-foreground" />
          }
        />
        <TooltipContent>
          Toggle sidebar <ShortcutKbd binding={sidebarBinding} className="ml-1" />
        </TooltipContent>
      </Tooltip>
      <div className="mx-1 h-3.5 w-px shrink-0 bg-border" />
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => router.history.back()}
              disabled={!canGoBack}
              className="size-6 text-muted-foreground/60 hover:text-foreground disabled:opacity-25"
            >
              <ChevronLeft className="size-3.5" />
              <span className="sr-only">Go back</span>
            </Button>
          }
        />
        <TooltipContent>
          Go back <ShortcutKbd binding={backBinding} className="ml-1" />
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => router.history.forward()}
              disabled={!canGoForward}
              className="size-6 text-muted-foreground/60 hover:text-foreground disabled:opacity-25"
            >
              <ChevronRight className="size-3.5" />
              <span className="sr-only">Go forward</span>
            </Button>
          }
        />
        <TooltipContent>
          Go forward <ShortcutKbd binding={forwardBinding} className="ml-1" />
        </TooltipContent>
      </Tooltip>
    </div>
  )
}

function MainContentArea() {
  const { activeTab, tabs, addFileTab } = useMainTabs()
  const { workspaces } = useWorkspace()
  const { threadId } = useParams({ strict: false }) as { threadId?: string }
  const { isOpen: diffOpen, isFullscreen: diffFullscreen } = useDiffPanel()
  const { isOpen: fileTreeOpen } = useFileTree()

  // Compute thread workspace info for panel state
  const threadWorkspace = workspaces.find((ws) =>
    ws.threads.some((t) => t.id === threadId)
  )
  const threadObj = threadWorkspace?.threads.find((t) => t.id === threadId)

  // Stable sessionId for DiffPanel: only resets when the workspace changes,
  // not when the user switches threads within the same workspace.
  const [prevThreadWorkspaceId, setPrevThreadWorkspaceId] = useState<string | undefined>(
    threadWorkspace?.id
  )
  const [diffPanelSessionId, setDiffPanelSessionId] = useState<string | null>(
    threadObj?.sessionId ?? null
  )
  if (threadWorkspace?.id !== prevThreadWorkspaceId) {
    setPrevThreadWorkspaceId(threadWorkspace?.id)
    setDiffPanelSessionId(threadObj?.sessionId ?? null)
  }

  // Compute file tab workspace info
  const fileWorkspace =
    activeTab?.type === "file"
      ? workspaces.find((ws) => ws.path === activeTab.workspacePath)
      : undefined
  const fileTabSessionId =
    fileWorkspace?.threads.find((t) => t.sessionId)?.sessionId ?? null
  const fileOpenWithAppId =
    fileWorkspace?.openWithAppId ??
    (activeTab?.type === "file" ? activeTab.openWithAppId : null) ??
    null

  const fileWorkspacePath = activeTab?.type === "file" ? activeTab.workspacePath : undefined
  const onOpenFile = useCallback(
    (filePath: string, title: string) =>
      addFileTab({ filePath, title, workspacePath: fileWorkspacePath }),
    [addFileTab, fileWorkspacePath]
  )

  const isFileTab = activeTab?.type === "file"
  const isThreadTab = activeTab?.type === "thread" || (!activeTab && !!threadId)

  // Unified panel state derived from whichever tab type is active
  const sessionId = isFileTab ? fileTabSessionId : diffPanelSessionId
  const panelWorkspaceId = isFileTab ? fileWorkspace?.id : threadWorkspace?.id
  const panelWorkspacePath = isFileTab ? fileWorkspace?.path : threadWorkspace?.path
  const openWithAppId = isFileTab ? fileOpenWithAppId : (threadWorkspace?.openWithAppId ?? null)
  const isContentReady = isFileTab
    ? !!fileTabSessionId
    : (!!threadWorkspace && !!threadObj && !!threadObj.sessionId)

  // Show empty state only when no tabs AND no thread in the URL.
  if (tabs.length === 0 && !threadId) {
    return <TabsEmptyState />
  }

  const showFullscreen = diffFullscreen && isContentReady && !!sessionId

  // Fullscreen diff mode: DiffPanel takes the full content area.
  if (showFullscreen) {
    return (
      <div className="flex h-full overflow-hidden border-t">
        <div className="flex min-w-0 flex-1">
          <Suspense fallback={<div className="h-full flex-1 bg-muted/10" />}>
            <DiffPanel
              sessionId={sessionId!}
              openWithAppId={openWithAppId ?? undefined}
            />
          </Suspense>
        </div>
        {fileTreeOpen && panelWorkspaceId && panelWorkspacePath && (
          <div className="h-full w-56 shrink-0 border-l border-sidebar-border">
            <Suspense fallback={<div className="h-full w-full bg-background" />}>
              <FileTree
                workspaceId={panelWorkspaceId}
                workspacePath={panelWorkspacePath}
              />
            </Suspense>
          </div>
        )}
        {/* Keep thread route mounted so its effects (setActiveThreadId, etc.) continue running */}
        {isThreadTab && <Outlet />}
      </div>
    )
  }

  // Normal mode: single ResizablePanelGroup with shared DiffPanel and FileTree.
  return (
    <div className="flex h-full overflow-hidden">
      <ResizablePanelGroup
        orientation="horizontal"
        className="flex-1"
      >
        <ResizablePanel defaultSize={diffOpen ? "55" : "100"} minSize="40">
          <div className="flex h-full flex-col">
            <MainTabBar />
            <div className="min-h-0 flex-1 overflow-hidden">
              {activeTab?.type === "file" ? (
                <Suspense fallback={<div className="h-full flex-1 bg-muted/10" />}>
                  <FileContentView
                    filePath={activeTab.filePath}
                    workspacePath={activeTab.workspacePath}
                    openWithAppId={fileOpenWithAppId}
                    onOpenFile={onOpenFile}
                  />
                </Suspense>
              ) : (
                <Outlet />
              )}
            </div>
          </div>
        </ResizablePanel>
        {diffOpen && isContentReady && sessionId && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize="45" minSize="30">
              <Suspense
                fallback={
                  <div className="h-full border-l border-border/60 bg-muted/10" />
                }
              >
                <DiffPanel
                  sessionId={sessionId}
                  openWithAppId={openWithAppId ?? undefined}
                />
              </Suspense>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
      {fileTreeOpen && panelWorkspaceId && panelWorkspacePath && (
        <div className="h-full w-56 shrink-0 border-l border-sidebar-border">
          <Suspense fallback={<div className="h-full w-full bg-background" />}>
            <FileTree
              workspaceId={panelWorkspaceId}
              workspacePath={panelWorkspacePath}
            />
          </Suspense>
        </div>
      )}
    </div>
  )
}

function RootLayoutInner() {
  const { isLoading, workspaces } = useWorkspace()
  const { threadId: activeThreadId } = useParams({ strict: false }) as {
    threadId?: string
  }
  const { tabs } = useMainTabs()
  const { states: terminalStates } = useTerminal()
  const { isFullscreen: diffFullscreen } = useDiffPanel()

  const isEmptyState = tabs.length === 0 && !activeThreadId

  // Prefetch all thread messages in the background for instant thread switching
  usePrefetchThreadsMessages({ activeThreadId })

  const activeWorkspace = workspaces.find((ws) =>
    ws.threads.some((t) => t.id === activeThreadId)
  )

  const activeTerminalState = activeWorkspace
    ? (terminalStates[activeWorkspace.id] ?? null)
    : null
  // Show the terminal panel when it's open for the active workspace and diff is not fullscreen
  const activeTerminalOpen =
    !diffFullscreen && (activeTerminalState?.isOpen ?? false)

  // Keep panel mounted as long as any workspace has terminal tabs (preserves PTY processes)
  const anyWorkspaceHasTerminals = workspaces.some(
    (ws) => (terminalStates[ws.id]?.tabs.length ?? 0) > 0
  )

  const terminalPanelRef = useRef<PanelImperativeHandle>(null)

  // When there is no active workspace (e.g. home page), fall back to the first workspace
  // that has terminal tabs so TerminalPanel stays mounted and PTY processes stay alive.
  const terminalHost =
    activeWorkspace ?? workspaces.find((ws) => (terminalStates[ws.id]?.tabs.length ?? 0) > 0)

  // Programmatically expand/collapse the panel when the active workspace's terminal state changes.
  // Deferred via setTimeout so the panel has time to register its constraints with the group
  // before expand()/collapse() is called (calling them synchronously after mount throws).
  useEffect(() => {
    const panel = terminalPanelRef.current
    if (!panel) return
    const id = setTimeout(() => {
      if (activeTerminalOpen) {
        panel.expand()
      } else {
        panel.collapse()
      }
    }, 0)
    return () => clearTimeout(id)
  }, [activeTerminalOpen])

  if (isLoading) {
    return <SplashScreen />
  }

  return (
    <TooltipProvider>
      <SidebarProvider className="h-svh bg-sidebar">
        <NavigationControls />
        <AppSidebar />
        <SidebarInset className="relative z-20 min-w-0 overflow-hidden rounded-2xl border border-border shadow-sm">
          {!isEmptyState && <TitleBar />}
          <UpdateBanner />
          <ResizablePanelGroup
            orientation="vertical"
            className="flex-1 min-h-0"
          >
            <ResizablePanel className="min-h-0 overflow-hidden" minSize="20">
              <MainContentArea />
            </ResizablePanel>
            {anyWorkspaceHasTerminals && (
              <>
                <ResizableHandle
                  withHandle
                  className={cn(!activeTerminalOpen && "hidden")}
                />
                <ResizablePanel
                  panelRef={terminalPanelRef}
                  collapsible
                  collapsedSize={0}
                  defaultSize="33"
                  minSize="15"
                >
                  {terminalHost && (
                    <Suspense
                      fallback={
                        <div className="h-full border-t bg-background" />
                      }
                    >
                      <TerminalPanel
                        activeWorkspaceId={terminalHost.id}
                        cwd={terminalHost.path}
                      />
                    </Suspense>
                  )}
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
        </SidebarInset>
        <CommandPalette />
      </SidebarProvider>
    </TooltipProvider>
  )
}

function RootLayoutGate() {
  const { data: serverStatus } = useElectronServerStatus()

  if (!serverStatus || serverStatus.status === "starting") return <SplashScreen />
  if (serverStatus.status !== "ready") {
    return <ServerUnavailable status={serverStatus} />
  }

  return (
    <WorkspaceProvider>
      <RootLayoutInner />
      <SettingsModal />
      <ConfigureProviderModal />
    </WorkspaceProvider>
  )
}

function UpdateBanner() {
  const { data: status } = useElectronUpdateStatus()
  const installUpdate = useInstallUpdate()

  if (!status || status.phase === "idle" || status.phase === "checking") return null

  const message = (() => {
    switch (status.phase) {
      case "available":
        return `Version ${status.version} is available — open Settings → Updates to download.`
      case "downloading":
        return `Downloading update… ${Math.round(status.percent)}%`
      case "ready":
        return `Version ${status.version} is ready to install.`
      case "error":
        return null
    }
  })()

  if (!message) return null

  return (
    <div className="flex shrink-0 items-center justify-between gap-4 border-b bg-primary/10 px-4 py-1.5 text-xs">
      <span className="text-muted-foreground">{message}</span>
      {status.phase === "ready" && (
        <button
          type="button"
          onClick={() => installUpdate.mutate()}
          className="shrink-0 rounded border px-2 py-0.5 text-xs hover:bg-muted"
        >
          Restart & install
        </button>
      )}
    </div>
  )
}

function Root() {
  return (
    <ErrorBoundary>
      <RootLayoutGate />
      <Toaster position="top-center" closeButton />
    </ErrorBoundary>
  )
}

export const Route = createRootRoute({ component: Root })
