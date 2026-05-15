import { memo, useState, useMemo, useCallback, useEffect, useRef } from "react"
import { GitCompare, ChevronDown, ChevronRight, Sparkles, Undo2, Loader2 } from "lucide-react"
import { useLastTurnChanges, useRevertLastTurn, useGitFileDiff, DiffView, DiffStat, parseDiffCounts } from "@/features/git"
import { useDiffPanel } from "@/features/git"
import { useGitRevertFile } from "@/features/git/mutations"
import { Button } from "@/shared/ui/button"
import { type ChangedFile, parseStatusLine } from "@/features/git/components/status-badge"
import { Icon } from "@iconify/react"
import { getIconName } from "@/shared/ui/file-icon"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/shared/ui/alert-dialog"
import { cn } from "@/shared/lib/utils"


const ChangedFileItem = memo(function ChangedFileItem({
  file,
  sessionId,
  onRevert,
}: {
  file: ChangedFile
  sessionId: string
  onRevert?: (file: ChangedFile) => Promise<void>
}) {
  const [expanded, setExpanded] = useState(false)
  const [reverting, setReverting] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (expanded) {
      cardRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" })
    }
  }, [expanded])

  const { data: diff, isLoading: diffLoading } = useGitFileDiff(
    sessionId,
    file.filePath,
    file.raw,
    true
  )
  const counts = diff != null ? parseDiffCounts(diff) : null

  const pathParts = file.filePath.split("/")
  const fileName = pathParts[pathParts.length - 1] ?? file.filePath
  const dirPath = pathParts.length > 1 ? pathParts.slice(0, -1).join("/") + "/" : null
  const handleRevert = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation()
      if (reverting || !onRevert) return
      setReverting(true)
      try {
        await onRevert(file)
      } finally {
        setReverting(false)
      }
    },
    [reverting, onRevert, file]
  )

  return (
    <div ref={cardRef} className={cn(
      "overflow-hidden rounded-lg border bg-background/50 transition-colors",
      expanded ? "border-border/50" : "border-border/30 hover:border-border/50 hover:bg-background/80"
    )}>
      {/* Row */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded((v) => !v)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setExpanded((v) => !v) } }}
        className="group flex cursor-pointer items-center gap-2.5 px-3 py-2"
      >
        <Icon
          icon={`catppuccin:${getIconName(fileName)}`}
          className="size-3.5 shrink-0 opacity-70"
          aria-hidden
        />
        <span className="flex min-w-0 flex-1 items-baseline gap-1.5 overflow-hidden">
          <span className="shrink-0 font-mono text-[11.5px] font-medium text-foreground/80">
            {fileName}
          </span>
          {dirPath && (
            <span className="truncate font-mono text-[10px] text-muted-foreground/35">
              {dirPath}
            </span>
          )}
          {counts != null && (counts.added > 0 || counts.removed > 0) && (
            <DiffStat added={counts.added} removed={counts.removed} />
          )}
        </span>
        {!file.isUntracked && onRevert && (
          <button
            type="button"
            onClick={handleRevert}
            disabled={reverting}
            aria-label="Revert file"
            className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground/40 opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 disabled:pointer-events-none disabled:opacity-30"
          >
            {reverting ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Undo2 className="h-3 w-3" />
            )}
          </button>
        )}
        <ChevronRight className={cn(
          "h-3 w-3 shrink-0 text-muted-foreground/30 transition-transform duration-150",
          expanded && "rotate-90"
        )} />
      </div>

      {/* Diff */}
      {expanded && (
        <div className="border-t border-border/30 px-2 pb-2 pt-1">
          {diffLoading ? (
            <div className="flex items-center gap-2 rounded-lg border border-border/30 bg-muted/10 px-3 py-3 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Loading diff…
            </div>
          ) : diff != null ? (
            <DiffView diff={diff} filePath={file.filePath} mode="inline" maxHeight="16rem" className="border-border/30" />
          ) : null}
        </div>
      )}
    </div>
  )
})

interface FileChangesCardProps {
  sessionId: string
}

export const FileChangesCard = memo(function FileChangesCard({
  sessionId,
}: FileChangesCardProps) {
  const { data: rawChanges } = useLastTurnChanges(sessionId)
  const { open: openDiffPanel } = useDiffPanel()
  const revertLastTurn = useRevertLastTurn(sessionId)
  const revertFile = useGitRevertFile(sessionId)

  const [expanded, setExpanded] = useState(true)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const files: ChangedFile[] = useMemo(() => {
    if (!rawChanges) return []
    return rawChanges
      .split("\n")
      .map((l: string) => l.trimEnd())
      .filter(Boolean)
      .map(parseStatusLine)
  }, [rawChanges])

  const hasChanges = files.length > 0

  const handleRevertFile = useCallback(
    async (file: ChangedFile) => {
      await revertFile.mutateAsync({ filePath: file.filePath, raw: file.raw })
    },
    [revertFile]
  )

  const handleConfirmRevert = () => {
    revertLastTurn.mutate()
    setConfirmOpen(false)
  }

  if (!hasChanges) {
    return null
  }

  return (
    <>
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
            <div
              className="flex items-center gap-1.5"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                size="sm"
                variant="ghost"
                onClick={openDiffPanel}
                className="h-7 gap-1.5 rounded-lg border border-border/50 bg-background/60 px-2.5 text-[11px] font-medium text-muted-foreground shadow-xs hover:border-border hover:bg-background hover:text-foreground"
              >
                <GitCompare className="h-3 w-3" />
                Diff
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => setConfirmOpen(true)}
                disabled={revertLastTurn.isPending}
                className="h-7 gap-1.5 rounded-lg border border-border/50 bg-background/60 px-2.5 text-[11px] font-medium text-muted-foreground shadow-xs hover:border-destructive/30 hover:bg-destructive/5 hover:text-destructive disabled:opacity-50"
              >
                {revertLastTurn.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Undo2 className="h-3 w-3" />
                )}
                Revert
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
            <div className="flex flex-col gap-1.5 p-2">
              {files.map((file, index) => (
                <ChangedFileItem
                  key={`${file.filePath}-${index}`}
                  file={file}
                  sessionId={sessionId}
                  onRevert={handleRevertFile}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Revert turn confirmation */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10">
              <Undo2 className="text-destructive" />
            </AlertDialogMedia>
            <AlertDialogTitle>Revert this turn?</AlertDialogTitle>
            <AlertDialogDescription>
              All {files.length} file{files.length !== 1 ? "s" : ""} changed in
              this turn will be reverted to their previous state. This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleConfirmRevert}
            >
              Revert turn
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
})
