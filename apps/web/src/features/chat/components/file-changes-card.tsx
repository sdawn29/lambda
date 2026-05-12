import { memo, useState, useMemo } from "react"
import { GitCompare, ChevronDown, ChevronRight } from "lucide-react"
import { useLastTurnChanges } from "@/features/git"
import { useDiffPanel } from "@/features/git/context"
import { useMainTabs } from "@/features/main-tabs"
import { Button } from "@/shared/ui/button"
import { type ChangedFile, parseStatusLine } from "@/features/git/components/status-badge"
import { FileRow } from "@/features/git/components/file-list-item"

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

  const handleOpenDiff = () => {
    openDiffPanel()
    addTab({ title: "Source Control", type: "source-control" })
  }

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
      <div className="overflow-hidden rounded-lg border border-border/50 bg-muted/20">
        {/* Card Header */}
        <div
          className="flex w-full cursor-pointer items-center gap-3 border-b border-border/30 px-4 py-2.5 text-left transition-colors hover:bg-muted/30"
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
          <GitCompare className="h-4 w-4 shrink-0 text-muted-foreground/70" />

          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="text-sm font-medium text-foreground/80">
              {files.length} file{files.length !== 1 ? "s" : ""} changed this turn
            </span>
          </div>

          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <Button
              size="sm"
              variant="outline"
              onClick={handleOpenDiff}
              className="h-7 gap-1.5 text-xs border-border/60"
            >
              <GitCompare className="h-3.5 w-3.5" />
              Open Diff
            </Button>

            <span className="flex h-7 w-7 items-center justify-center text-muted-foreground/60">
              {expanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </span>
          </div>
        </div>

        {/* File List */}
        {expanded && (
          <div className="max-h-64 overflow-y-auto">
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
