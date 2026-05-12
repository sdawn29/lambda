import { useState, useCallback } from "react"
import { useNavigate, useParams } from "@tanstack/react-router"
import { MessageSquare, Plus, X } from "lucide-react"
import { Icon } from "@iconify/react"
import { getIconName } from "@/shared/ui/file-icon"
import { Button } from "@/shared/ui/button"
import { cn } from "@/shared/lib/utils"
import { useMainTabs, type MainTab } from "../context"
import { FileSearchModal } from "@/features/file-tree"
import { useWorkspace } from "@/features/workspace"

export function MainTabBar() {
  const { tabs, activeTabId, activeTab, closeTab, setActiveTab, addFileTab } = useMainTabs()
  const navigate = useNavigate()
  const { threadId: activeThreadId } = useParams({ strict: false }) as { threadId?: string }
  const { workspaces } = useWorkspace()
  const [fileSearchOpen, setFileSearchOpen] = useState(false)

  const activeWorkspace =
    activeTab?.type === "file" && activeTab.workspacePath
      ? workspaces.find((ws) => ws.path === activeTab.workspacePath)
      : workspaces.find((ws) => ws.threads.some((t) => t.id === activeThreadId))

  const handleFileSelect = useCallback(
    (relativePath: string) => {
      if (!activeWorkspace) return
      const fileName = relativePath.split(/[/\\]/).pop() || relativePath
      const filePath = `${activeWorkspace.path}/${relativePath}`
      addFileTab({ title: fileName, filePath, workspacePath: activeWorkspace.path })
    },
    [activeWorkspace, addFileTab]
  )

  const handleTabClick = (tab: MainTab) => {
    setActiveTab(tab.id)
    if (tab.type === "thread") {
      navigate({
        to: "/workspace/$threadId",
        params: { threadId: tab.threadId },
      })
    }
  }

  const handleCloseTab = (e: React.MouseEvent, tab: MainTab) => {
    e.stopPropagation()

    const isActive = tab.id === activeTabId
    if (isActive) {
      const tabIdx = tabs.findIndex((t) => t.id === tab.id)
      const remaining = tabs.filter((t) => t.id !== tab.id)

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

    closeTab(tab.id)
  }

  return (
    <>
      {activeWorkspace && (
        <FileSearchModal
          open={fileSearchOpen}
          onOpenChange={setFileSearchOpen}
          workspaceId={activeWorkspace.id}
          onSelect={handleFileSelect}
        />
      )}
      <div className="flex h-9 shrink-0 items-center border-b bg-muted/20 px-1 gap-0.5 overflow-x-auto scrollbar-none">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId
        return (
          <div
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => handleTabClick(tab)}
            className={cn(
              "group relative flex h-7 shrink-0 cursor-pointer items-center gap-1.5 rounded-md pl-2.5 pr-1.5 text-xs select-none transition-all duration-150",
              isActive
                ? "bg-background text-foreground shadow-sm ring-1 ring-border/60"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground/70"
            )}
          >
            {tab.type === "thread" ? (
              <MessageSquare className="size-3.5 shrink-0 opacity-60" />
            ) : (
              <Icon
                icon={`catppuccin:${getIconName(tab.title)}`}
                className="size-3.5 shrink-0"
                aria-hidden
              />
            )}
            <span className="max-w-32 truncate">{tab.title}</span>
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={`Close ${tab.title}`}
              onClick={(e) => handleCloseTab(e, tab)}
              className={cn(
                "ml-0.5 shrink-0",
                isActive
                  ? "opacity-60 hover:opacity-100"
                  : "opacity-0 group-hover:opacity-60 group-hover:hover:opacity-100"
              )}
            >
              <X className="h-2.5 w-2.5" />
            </Button>
          </div>
        )
      })}

      {activeWorkspace && (
        <button
          onClick={() => setFileSearchOpen(true)}
          className="flex h-7 items-center rounded-md px-2 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
          aria-label="Open file"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      )}
      </div>
    </>
  )
}
