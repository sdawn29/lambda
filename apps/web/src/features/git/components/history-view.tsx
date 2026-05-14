import { memo, useCallback, useState } from "react"
import { ChevronRight, GitCommit, Loader2 } from "lucide-react"
import { Icon } from "@iconify/react"
import { getIconName } from "@/shared/ui/file-icon"
import { cn } from "@/shared/lib/utils"
import { useGitLog, useGitShowFiles, useGitShowFileDiff } from "../queries"
import type { CommitFile, LogEntry } from "../api"
import { DiffView } from "./diff-view"
import { StatusBadge } from "./status-badge"
import { DiffStat, parseDiffCounts } from "./diff-stat"
import { LoadingSpinner } from "@/shared/ui/loading-spinner"

function formatRelativeDate(isoDate: string): string {
  const date = new Date(isoDate)
  if (isNaN(date.getTime())) return isoDate
  const diff = Date.now() - date.getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}

function commitFileToChangedFile(f: CommitFile) {
  return {
    raw: f.status + " ",
    filePath: f.path,
    isStaged: false,
    isUntracked: false,
  }
}

function CommitFileItem({
  sessionId,
  sha,
  file,
}: {
  sessionId: string
  sha: string
  file: CommitFile
}) {
  const [expanded, setExpanded] = useState(false)
  const { data: diff, isLoading } = useGitShowFileDiff(sessionId, sha, file.path, expanded)

  const counts = diff != null ? parseDiffCounts(diff) : null
  const changedFile = commitFileToChangedFile(file)

  const pathParts = file.path.split("/")
  const fileName = pathParts[pathParts.length - 1] ?? file.path
  const dirPath = pathParts.length > 1 ? pathParts.slice(0, -1).join("/") + "/" : null

  const handleClick = useCallback(() => {
    setExpanded((v) => !v)
  }, [])

  return (
    <div className="mx-1.5 my-1 overflow-hidden rounded-md border border-border/40">
      <div className="flex w-full items-center transition-colors hover:bg-muted/30">
        <button
          onClick={handleClick}
          className="flex min-w-0 flex-1 items-center gap-2 py-2 pl-2.5 pr-1 text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring"
        >
          <ChevronRight
            className={cn(
              "size-3 shrink-0 text-muted-foreground/40 transition-transform duration-150",
              expanded && "rotate-90"
            )}
          />
          <StatusBadge file={changedFile} />
          <Icon
            icon={`catppuccin:${getIconName(fileName)}`}
            className="size-3 shrink-0"
            aria-hidden
          />
          <span className="flex min-w-0 flex-1 items-baseline gap-1.5 overflow-hidden pr-2">
            <span className="shrink-0 font-mono text-xs font-medium text-foreground/85">
              {fileName}
            </span>
            {dirPath && (
              <span className="truncate font-mono text-[10px] text-muted-foreground/40">
                {dirPath}
              </span>
            )}
            {counts != null && (counts.added > 0 || counts.removed > 0) && (
              <DiffStat added={counts.added} removed={counts.removed} />
            )}
          </span>
        </button>
      </div>

      {expanded && (
        <div className="animate-in border-t border-border/20 bg-muted/10 px-3 pb-3 duration-150 fade-in-0 slide-in-from-top-1">
          {isLoading ? (
            <div className="flex items-center gap-2 py-3 text-xs text-muted-foreground">
              <LoadingSpinner size="sm" />
              Loading diff…
            </div>
          ) : diff ? (
            <DiffView
              diff={diff}
              filePath={file.path}
              mode="inline"
              className="mt-2 rounded-md border-border/50"
            />
          ) : null}
        </div>
      )}
    </div>
  )
}

function CommitRow({
  entry,
  sessionId,
}: {
  entry: LogEntry
  sessionId: string
}) {
  const [expanded, setExpanded] = useState(false)
  const { data: files, isLoading } = useGitShowFiles(sessionId, entry.sha, expanded)

  return (
    <div className="border-b border-border/40 last:border-0">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring"
      >
        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted">
          <GitCommit className="h-3 w-3 text-muted-foreground/60" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-foreground">
            {entry.subject || "(no message)"}
          </p>
          <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground/60">
            <span className="font-mono">{entry.shortSha}</span>
            <span>·</span>
            <span>{entry.author}</span>
            <span>·</span>
            <span>{formatRelativeDate(entry.date)}</span>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="pb-2">
          {isLoading ? (
            <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
              <Loader2 className="size-3 animate-spin" />
              Loading…
            </div>
          ) : files && files.length > 0 ? (
            <div>
              {files.map((f) => (
                <CommitFileItem
                  key={f.path}
                  sessionId={sessionId}
                  sha={entry.sha}
                  file={f}
                />
              ))}
            </div>
          ) : (
            <p className="px-3 py-2 text-[11px] text-muted-foreground/60">
              No files changed
            </p>
          )}
        </div>
      )}
    </div>
  )
}

interface HistoryViewProps {
  sessionId: string
}

export const HistoryView = memo(function HistoryView({
  sessionId,
}: HistoryViewProps) {
  const { data: entries = [], isLoading } = useGitLog(sessionId)

  if (isLoading) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <div className="flex items-center gap-2 text-xs text-muted-foreground/50">
          <Loader2 className="size-3 animate-spin" />
          Loading history…
        </div>
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-4 py-12 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
          <GitCommit className="h-5 w-5 text-muted-foreground/40" />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground/60">No commits yet</p>
          <p className="text-[10px] text-muted-foreground/40">
            Commits will appear here once you start committing
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("min-h-0 flex-1 overflow-y-auto")}>
      {entries.map((entry) => (
        <CommitRow
          key={entry.sha}
          entry={entry}
          sessionId={sessionId}
        />
      ))}
    </div>
  )
})
