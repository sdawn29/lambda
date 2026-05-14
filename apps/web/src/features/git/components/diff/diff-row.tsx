import { cn } from "@/shared/lib/utils"
import type { CharRange, DiffHunk, DiffLine, HighlightMap, ThemeStyle } from "./types"
import { getLineTokens, renderTokens } from "./highlight"
import { renderWithWordDiff } from "./word-diff"

interface DiffRowProps {
  line: DiffLine
  diffIndex: number
  map: HighlightMap
  themeStyle: ThemeStyle
  wordDiffRanges?: CharRange[]
  hunk?: DiffHunk
  onStageHunk?: (hunkPatch: string) => void
  onUnstageHunk?: (hunkPatch: string) => void
  isStaged?: boolean
}

export function DiffRow({
  line,
  diffIndex,
  map,
  themeStyle,
  wordDiffRanges,
  hunk,
  onStageHunk,
  onUnstageHunk,
  isStaged,
}: DiffRowProps) {
  const tokens = getLineTokens(line, diffIndex, map)
  const isAdded = line.kind === "added"
  const isRemoved = line.kind === "removed"
  const isNeutral = line.kind === "context" || line.kind === "skipped"

  return (
    <div
      className={cn(
        "group/diff-row flex min-w-full leading-5",
        isAdded && "bg-green-500/8 hover:bg-green-500/12",
        isRemoved && "bg-red-500/8 hover:bg-red-500/12"
      )}
    >
      <div
        className={cn(
          "sticky left-0 z-10 flex shrink-0",
          isAdded &&
            "bg-green-50 group-hover/diff-row:bg-green-100 dark:bg-green-950 dark:group-hover/diff-row:bg-green-900",
          isRemoved &&
            "bg-red-50 group-hover/diff-row:bg-red-100 dark:bg-red-950 dark:group-hover/diff-row:bg-red-900",
          isNeutral && "bg-background"
        )}
      >
        <span
          className={cn(
            "w-4 shrink-0 text-center select-none",
            isAdded && "text-green-500",
            isRemoved && "text-red-500",
            isNeutral && "text-muted-foreground/30"
          )}
        >
          {isAdded ? "+" : isRemoved ? "−" : ""}
        </span>

        <span
          className={cn(
            "w-8 shrink-0 border-r pr-2 text-right select-none",
            isAdded && "border-green-500/20 text-green-400/50",
            isRemoved && "border-red-500/20 text-red-400/50",
            isNeutral && "border-border/40 text-muted-foreground/40"
          )}
        >
          {line.lineNum}
        </span>
      </div>

      {line.kind === "skipped" && hunk && (onStageHunk || onUnstageHunk) ? (
        <span className="flex min-w-full items-center justify-between pl-3 pr-2">
          <span className="text-muted-foreground/40 italic text-[10px]">
            {hunk.header}
          </span>
          <button
            type="button"
            onClick={() =>
              isStaged
                ? onUnstageHunk?.(hunk.rawPatch)
                : onStageHunk?.(hunk.rawPatch)
            }
            className="ml-2 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {isStaged ? "Unstage hunk" : "Stage hunk"}
          </button>
        </span>
      ) : (
      <span
        className={cn(
          "w-max shrink-0 pl-3 whitespace-pre",
          line.kind === "skipped" && "text-muted-foreground/40 italic"
        )}
      >
        {line.kind === "skipped" ? (
          "⋯"
        ) : wordDiffRanges && wordDiffRanges.length > 0 ? (
          renderWithWordDiff(line.content, wordDiffRanges, isAdded).map((part, i) =>
            part.highlighted ? (
              <span
                key={i}
                className={cn(
                  "rounded-sm",
                  isAdded
                    ? "bg-green-500/30 dark:bg-green-400/25"
                    : "bg-red-500/30 dark:bg-red-400/25"
                )}
              >
                {part.text}
              </span>
            ) : (
              <span key={i}>{part.text}</span>
            )
          )
        ) : (
          renderTokens(tokens, themeStyle)
        )}
      </span>
      )}
    </div>
  )
}
