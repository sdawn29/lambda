import { cn } from "@/shared/lib/utils"
import type { DiffLine, HighlightMap, ThemeStyle } from "./types"
import { getLineTokens, renderTokens } from "./highlight"

interface DiffRowProps {
  line: DiffLine
  diffIndex: number
  map: HighlightMap
  themeStyle: ThemeStyle
}

export function DiffRow({ line, diffIndex, map, themeStyle }: DiffRowProps) {
  const tokens = getLineTokens(line, diffIndex, map)

  return (
    <div
      className={cn(
        "flex leading-5",
        line.kind === "added" && "bg-green-500/8 hover:bg-green-500/12",
        line.kind === "removed" && "bg-red-500/8 hover:bg-red-500/12"
      )}
    >
      <span
        className={cn(
          "w-4 shrink-0 text-center select-none",
          line.kind === "added" && "text-green-500",
          line.kind === "removed" && "text-red-500",
          (line.kind === "context" || line.kind === "skipped") && "text-muted-foreground/30"
        )}
      >
        {line.kind === "added" ? "+" : line.kind === "removed" ? "−" : ""}
      </span>

      <span
        className={cn(
          "w-8 shrink-0 border-r pr-2 text-right select-none",
          line.kind === "added" && "border-green-500/20 text-green-400/50",
          line.kind === "removed" && "border-red-500/20 text-red-400/50",
          (line.kind === "context" || line.kind === "skipped") &&
            "border-border/40 text-muted-foreground/40"
        )}
      >
        {line.lineNum}
      </span>

      <span
        className={cn(
          "flex-1 pl-3 whitespace-pre",
          line.kind === "skipped" && "text-muted-foreground/40 italic"
        )}
      >
        {line.kind === "skipped" ? "⋯" : renderTokens(tokens, themeStyle)}
      </span>
    </div>
  )
}
