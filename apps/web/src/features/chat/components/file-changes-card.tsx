import { memo, useState, useMemo } from "react"
import { GitCompare, ChevronDown, ChevronRight, Sparkles } from "lucide-react"
import { useLastTurnChanges } from "@/features/git"
import { useDiffPanel } from "@/features/git"
import { useMainTabs } from "@/features/main-tabs"
import { Button } from "@/shared/ui/button"
import { type ChangedFile, parseStatusLine } from "@/features/git/components/status-badge"
import { FileRow } from "@/features/git/components/file-list-item"
import { cn } from "@/shared/lib/utils"

interface FileChangesCardProps {
  sessionId: string
}

export const FileChangesCard = memo(function FileChangesCard({
  sessionId,
}: FileChangesCardProps) {
  const { data: rawChanges } = useLastTurnChanges(sessionId)
  const { open: openDiffPanel, currentWorkspacePath } = useDiffPanel()
  const { addFileTab } = useMainTabs()
  const [expanded, setExpanded] = useState(true)

  const files: ChangedFile[] = useMemo(() => {
    if (!rawChanges) return []
    return rawChanges
      .split("\n")
      .map((l: string) => l.trimEnd())
      .filter(Boolean)
      .map(parseStatusLine)
  }, [rawChanges])

  const hasChanges = files.length > 0

  const handleOpenFileDiff = (filePath: string) => {
    const fullPath = currentWorkspacePath
      ? `${currentWorkspacePath}/${filePath}`
      : filePath
    const fileName = filePath.split("/").pop() || filePath
    addFileTab({ title: fileName, filePath: fullPath })
  }

  if (!hasChanges) {
    return null
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-3">
      <div className="overflow-hidden rounded-xl border border-border/40 bg-gradient-to-b from-muted/30 to-muted/10 shadow-sm">
        {/* Card Header */}
        <div
          className={cn(
            "flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/20",
            expanded && "border-b border-border/25"
          )}
          onClick={() => setExpanded(!expanded)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              setExpanded(!expanded)
            }
          }}
        >
          {/* Icon */}
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/8 ring-1 ring-primary/12">
            <Sparkles className="h-3.5 w-3.5 text-primary/60" />
          </div>

          {/* Label + count */}
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="text-[13px] font-medium text-foreground/75">
              Changes this turn
            </span>
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 px-1.5 font-mono text-[10px] font-semibold text-primary/70 ring-1 ring-primary/15">
              {files.length}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <Button
              size="sm"
              variant="ghost"
              onClick={openDiffPanel}
              className="h-7 gap-1.5 rounded-lg border border-border/50 bg-background/60 px-2.5 text-[11px] font-medium text-muted-foreground shadow-xs hover:border-border hover:bg-background hover:text-foreground"
            >
              <GitCompare className="h-3 w-3" />
              Diff
            </Button>

            <span className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground/40 transition-colors hover:text-muted-foreground/70">
              {expanded ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </span>
          </div>
        </div>

        {/* File List */}
        {expanded && (
          <div className="max-h-56 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {files.map((file, index) => (
              <FileRow
                key={`${file.filePath}-${index}`}
                file={file}
                sessionId={sessionId}
                onClick={handleOpenFileDiff}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
})
