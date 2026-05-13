import { useMemo, useRef, useState, useSyncExternalStore } from "react"
import {
  ChevronLeft,
  ChevronRight,
  TerminalSquare,
  MoreHorizontal,
  Pencil,
  Search,
  Trash2,
  FileDiff,
  FolderTree,
  Server,
} from "lucide-react"
import { Icon } from "@iconify/react"
import {
  useRouter,
  useParams,
  useNavigate,
  useLocation,
} from "@tanstack/react-router"
import { Button } from "@/shared/ui/button"
import { Toggle } from "@/shared/ui/toggle"
import { SidebarTrigger, useSidebar } from "@/shared/ui/sidebar"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/shared/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu"
import { useWorkspace } from "@/features/workspace"
import { useTerminalForWorkspace } from "@/features/terminal"
import { useDiffPanel } from "@/features/git"
import { useFileTree } from "@/features/file-tree"
import { useElectronFullscreen, useElectronPlatform } from "@/features/electron"
import { CommitDialog } from "@/features/git"
import { useGitDiffStat } from "@/features/git/queries"
import { OpenWithButton } from "./open-with-button"
import {
  useShortcutHandler,
  useShortcutBinding,
} from "@/shared/components/keyboard-shortcuts-provider"
import { SHORTCUT_ACTIONS } from "@/shared/lib/keyboard-shortcuts"
import { ShortcutKbd } from "@/shared/ui/kbd"
import { McpDialog, useMcpServerStatus } from "@/features/mcp"
import { useCommandPalette } from "@/features/command-palette"
import { useMainTabs } from "@/features/main-tabs"
import { getIconName } from "@/shared/ui/file-icon"
import { cn } from "@/shared/lib/utils"


export function TitleBar() {
  const router = useRouter()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const isSettings = pathname === "/settings"
  const { workspaces, setThreadTitle, deleteThread } = useWorkspace()
  const { toggleSidebar } = useSidebar()
  const { isOpen: diffOpen, toggle: toggleDiff } = useDiffPanel()
  const { isOpen: fileTreeOpen, toggle: toggleFileTree } = useFileTree()
  const { activeTab, tabs, closeTab } = useMainTabs()

  // URL-based thread/workspace — used for right-side session controls
  // (git, terminal, MCP stay tied to the navigated thread even when a file tab is shown)
  const { threadId } = useParams({ strict: false }) as { threadId?: string }
  const urlActiveThread = useMemo(
    () =>
      threadId
        ? workspaces.flatMap((w) => w.threads).find((t) => t.id === threadId)
        : undefined,
    [workspaces, threadId]
  )
  const urlActiveWorkspace = useMemo(
    () =>
      urlActiveThread
        ? workspaces.find((w) =>
            w.threads.some((t) => t.id === urlActiveThread.id)
          )
        : undefined,
    [workspaces, urlActiveThread]
  )

  // Active-tab-based context — used for center display and thread actions
  const activeTabThread = useMemo(() => {
    if (activeTab?.type !== "thread") return null
    return (
      workspaces
        .flatMap((w) => w.threads)
        .find((t) => t.id === activeTab.threadId) ?? null
    )
  }, [activeTab, workspaces])

  const activeTabWorkspace = useMemo(() => {
    if (!activeTabThread) return null
    return (
      workspaces.find((w) =>
        w.threads.some((t) => t.id === activeTabThread.id)
      ) ?? null
    )
  }, [activeTabThread, workspaces])

  const activeTabFile = activeTab?.type === "file" ? activeTab : null

  const fileWorkspace = useMemo(() => {
    if (!activeTabFile) return null
    return (
      workspaces.find((ws) => ws.path === activeTabFile.workspacePath) ?? null
    )
  }, [activeTabFile, workspaces])

  const fileRelativePath = !activeTabFile
    ? ""
    : !activeTabFile.workspacePath ||
        !activeTabFile.filePath.startsWith(activeTabFile.workspacePath)
      ? activeTabFile.filePath
      : activeTabFile.filePath
          .slice(activeTabFile.workspacePath.length)
          .replace(/^[/\\]+/, "")

  const { isOpen: terminalOpen, toggle: toggleTerminal } =
    useTerminalForWorkspace(
      urlActiveWorkspace?.id ?? "",
      urlActiveWorkspace?.path ?? ""
    )
  const activeSessionId = urlActiveThread?.sessionId ?? ""
  const { data: platform } = useElectronPlatform()
  const { data: isFullscreen = false } = useElectronFullscreen()
  const { data: diffStat } = useGitDiffStat(activeSessionId)
  const isMac = platform === "darwin"

  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState("")
  const renameInputRef = useRef<HTMLInputElement>(null)
  const [mcpDialogOpen, setMcpDialogOpen] = useState(false)
  const { data: mcpServerStatus } = useMcpServerStatus(
    urlActiveWorkspace?.id ?? ""
  )
  const mcpConnectedCount =
    mcpServerStatus?.filter((s) => s.connected).length ?? 0

  const startRename = () => {
    setRenameValue(activeTabThread?.title ?? "")
    setIsRenaming(true)
    setTimeout(() => renameInputRef.current?.select(), 0)
  }

  const commitRename = () => {
    if (activeTabWorkspace && activeTabThread && renameValue.trim()) {
      setThreadTitle(
        activeTabWorkspace.id,
        activeTabThread.id,
        renameValue.trim()
      )
    }
    setIsRenaming(false)
  }

  const handleDeleteThread = async () => {
    if (!activeTabWorkspace || !activeTabThread) return
    const tabId = `thread-${activeTabThread.id}`
    const tabIdx = tabs.findIndex((t) => t.id === tabId)
    const remaining = tabs.filter((t) => t.id !== tabId)

    await deleteThread(activeTabWorkspace.id, activeTabThread.id)
    closeTab(tabId)

    if (remaining.length === 0) {
      navigate({ to: "/" })
    } else {
      const next = remaining[Math.max(0, tabIdx - 1)]
      if (next.type === "thread") {
        navigate({
          to: "/workspace/$threadId",
          params: { threadId: next.threadId },
        })
      }
    }
  }

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

  const canGoBack = router.history.canGoBack()
  const canGoForward = useSyncExternalStore(subscribe, getSnapshot, () => false)

  useShortcutHandler(SHORTCUT_ACTIONS.TOGGLE_SIDEBAR, toggleSidebar)
  useShortcutHandler(
    SHORTCUT_ACTIONS.TOGGLE_DIFF_PANEL,
    isSettings ? null : toggleDiff
  )
  useShortcutHandler(
    SHORTCUT_ACTIONS.TOGGLE_TERMINAL,
    isSettings ? null : toggleTerminal
  )
  useShortcutHandler(
    SHORTCUT_ACTIONS.RENAME_THREAD,
    activeTabThread ? startRename : null
  )
  useShortcutHandler(
    SHORTCUT_ACTIONS.NAVIGATE_BACK,
    canGoBack ? () => router.history.back() : null
  )
  useShortcutHandler(
    SHORTCUT_ACTIONS.NAVIGATE_FORWARD,
    canGoForward ? () => router.history.forward() : null
  )
  useShortcutHandler(
    SHORTCUT_ACTIONS.TOGGLE_FILE_TREE,
    urlActiveWorkspace?.path ? toggleFileTree : null
  )

  const { openPalette } = useCommandPalette()
  const openCommandPaletteBinding = useShortcutBinding(SHORTCUT_ACTIONS.OPEN_COMMAND_PALETTE)

  const sidebarBinding = useShortcutBinding(SHORTCUT_ACTIONS.TOGGLE_SIDEBAR)
  const backBinding = useShortcutBinding(SHORTCUT_ACTIONS.NAVIGATE_BACK)
  const forwardBinding = useShortcutBinding(SHORTCUT_ACTIONS.NAVIGATE_FORWARD)
  const diffBinding = useShortcutBinding(SHORTCUT_ACTIONS.TOGGLE_DIFF_PANEL)
  const terminalBinding = useShortcutBinding(SHORTCUT_ACTIONS.TOGGLE_TERMINAL)
  const renameBinding = useShortcutBinding(SHORTCUT_ACTIONS.RENAME_THREAD)
  const fileTreeBinding = useShortcutBinding(SHORTCUT_ACTIONS.TOGGLE_FILE_TREE)

  return (
    <div
      className="sticky top-0 z-20 flex h-11 shrink-0 items-center border-b bg-background"
      style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
    >
      {/* Left — navigation cluster */}
      <div
        className={cn(
          "flex shrink-0 items-center gap-0.5 pr-2",
          isMac && !isFullscreen ? "pl-20" : "pl-1.5"
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
            Toggle sidebar{" "}
            <ShortcutKbd binding={sidebarBinding} className="ml-1" />
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

      {/* Breadcrumb — search + separator + context / primary */}
      <div
        className="flex min-w-0 flex-1 items-center gap-0 px-1"
        style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
      >
        <button
          type="button"
          onClick={openPalette}
          className="flex h-7 shrink-0 items-center gap-1.5 rounded-md border border-input bg-muted/20 px-2 text-xs text-muted-foreground transition-colors hover:bg-muted/40"
        >
          <Search className="h-3.5 w-3.5 shrink-0" />
          <span>Search</span>
          <ShortcutKbd binding={openCommandPaletteBinding} className="ml-0.5" />
        </button>
        <div className="mx-2 h-3.5 w-px shrink-0 bg-border" />
        {activeTab?.type === "thread" && activeTabThread ? (
          <div className="flex min-w-0 flex-1 items-center gap-1">
            {activeTabWorkspace && (
              <>
                <span className="shrink truncate text-[11px] font-medium text-muted-foreground/70">
                  {activeTabWorkspace.name}
                </span>
                <span className="mx-0.5 shrink-0 text-[11px] text-muted-foreground/40 select-none">
                  /
                </span>
              </>
            )}
            {isRenaming ? (
              <span className="inline-grid min-w-0 flex-1">
                <span
                  aria-hidden
                  className="invisible col-start-1 row-start-1 text-sm font-semibold whitespace-pre"
                >
                  {renameValue || " "}
                </span>
                <input
                  ref={renameInputRef}
                  autoFocus
                  size={1}
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitRename()
                    if (e.key === "Escape") setIsRenaming(false)
                  }}
                  className="col-start-1 row-start-1 w-full min-w-0 bg-transparent text-sm font-semibold outline-none"
                />
              </span>
            ) : (
              <span className="min-w-0 truncate text-sm font-semibold text-foreground">
                {activeTabThread.title}
              </span>
            )}
            <Tooltip>
              <DropdownMenu>
                <TooltipTrigger
                  render={
                    <DropdownMenuTrigger className="ml-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground/50 transition-colors hover:bg-accent hover:text-foreground focus:ring-0 focus-visible:outline-none">
                      <MoreHorizontal className="size-3.5" />
                      <span className="sr-only">Thread options</span>
                    </DropdownMenuTrigger>
                  }
                />
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={startRename}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Rename
                    <ShortcutKbd
                      binding={renameBinding}
                      className="ml-auto pl-2"
                    />
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={handleDeleteThread}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Thread
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <TooltipContent>Thread options</TooltipContent>
            </Tooltip>
          </div>
        ) : activeTab?.type === "file" && activeTabFile ? (
          <div className="flex min-w-0 flex-1 items-center gap-1">
            {fileWorkspace && (
              <>
                <span className="shrink truncate text-[11px] font-medium text-muted-foreground/70">
                  {fileWorkspace.name}
                </span>
                <span className="mx-0.5 shrink-0 text-[11px] text-muted-foreground/40 select-none">
                  /
                </span>
              </>
            )}
            <Icon
              icon={`catppuccin:${getIconName(activeTabFile.title)}`}
              className="size-3.5 shrink-0 opacity-70"
              aria-hidden
            />
            <span
              className="min-w-0 truncate text-sm font-semibold text-foreground"
              title={fileRelativePath}
            >
              {fileRelativePath || activeTabFile.title}
            </span>
          </div>
        ) : null}
      </div>

      {/* Right — session actions */}
      <div
        className="flex shrink-0 items-center gap-0.5 px-2"
        style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
      >
        <OpenWithButton
          workspaceId={urlActiveWorkspace?.id}
          workspacePath={urlActiveWorkspace?.path}
          openWithAppId={urlActiveWorkspace?.openWithAppId}
        />
        <CommitDialog sessionId={urlActiveThread?.sessionId ?? undefined} />

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="outline"
                size="icon"
                onClick={() => setMcpDialogOpen(true)}
                className="h-7 w-auto gap-1.5 px-2"
              >
                <Server className="size-3.5 shrink-0" />
                {mcpConnectedCount > 0 && (
                  <span className="flex items-center gap-1 text-[11px] font-medium tabular-nums">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" />
                    {mcpConnectedCount}
                  </span>
                )}
                <span className="sr-only">MCP servers</span>
              </Button>
            }
          />
          <TooltipContent>MCP servers</TooltipContent>
        </Tooltip>

        <div className="mx-1 h-3.5 w-px shrink-0 bg-border" />

        {/* Panel toggles — segmented control; active buttons lift above the tray */}
        <div className="flex items-center gap-0.5 rounded-lg border border-border/60 bg-muted/30 p-0.5">
          <Tooltip>
            <TooltipTrigger
              render={
                <Toggle
                  pressed={terminalOpen}
                  onPressedChange={() => toggleTerminal()}
                  className="size-7 text-muted-foreground hover:bg-muted/60 hover:text-foreground aria-pressed:bg-background aria-pressed:text-foreground aria-pressed:shadow-sm"
                >
                  <TerminalSquare className="size-4" />
                  <span className="sr-only">Toggle terminal</span>
                </Toggle>
              }
            />
            <TooltipContent>
              Toggle terminal{" "}
              <ShortcutKbd binding={terminalBinding} className="ml-1" />
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              render={
                <Toggle
                  pressed={diffOpen}
                  onPressedChange={() => toggleDiff()}
                  disabled={!urlActiveWorkspace?.path}
                  className="h-7 gap-1.5 px-1.5 text-muted-foreground hover:bg-muted/60 hover:text-foreground disabled:opacity-30 aria-pressed:bg-background aria-pressed:text-foreground aria-pressed:shadow-sm"
                >
                  <FileDiff className="size-4 shrink-0" />
                  {diffStat &&
                    (diffStat.additions > 0 || diffStat.deletions > 0) && (
                      <span className="flex animate-in items-center gap-1 font-mono text-[11px] leading-none duration-200 fade-in-0 zoom-in-90">
                        <span className="text-green-500">
                          +{diffStat.additions}
                        </span>
                        <span className="text-red-500">
                          -{diffStat.deletions}
                        </span>
                      </span>
                    )}
                  <span className="sr-only">Toggle diff panel</span>
                </Toggle>
              }
            />
            <TooltipContent>
              Toggle diff panel{" "}
              <ShortcutKbd binding={diffBinding} className="ml-1" />
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              render={
                <Toggle
                  pressed={fileTreeOpen}
                  onPressedChange={() => toggleFileTree()}
                  disabled={!urlActiveWorkspace?.path}
                  className="size-7 text-muted-foreground hover:bg-muted/60 hover:text-foreground disabled:opacity-30 aria-pressed:bg-background aria-pressed:text-foreground aria-pressed:shadow-sm"
                >
                  <FolderTree className="size-4" />
                  <span className="sr-only">Toggle file tree</span>
                </Toggle>
              }
            />
            <TooltipContent>
              Toggle file tree{" "}
              <ShortcutKbd binding={fileTreeBinding} className="ml-1" />
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      <McpDialog
        open={mcpDialogOpen}
        onOpenChange={setMcpDialogOpen}
        workspaceId={urlActiveWorkspace?.id}
      />
    </div>
  )
}
