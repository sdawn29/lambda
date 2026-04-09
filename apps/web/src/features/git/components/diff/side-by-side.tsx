import { cn } from "@/shared/lib/utils"
import type { DiffLine, HighlightMap, ThemeStyle } from "./types"
import { getLineTokens, renderTokens } from "./highlight"

export interface SideBySideRow {
  left: { line: DiffLine; diffIndex: number } | null
  right: { line: DiffLine; diffIndex: number } | null
}

export function buildSideBySideRows(lines: DiffLine[]): SideBySideRow[] {
  const rows: SideBySideRow[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (line.kind === "context" || line.kind === "skipped") {
      rows.push({ left: { line, diffIndex: i }, right: { line, diffIndex: i } })
      i++
      continue
    }

    const removed: { line: DiffLine; diffIndex: number }[] = []
    const added: { line: DiffLine; diffIndex: number }[] = []

    while (i < lines.length && lines[i].kind === "removed") {
      removed.push({ line: lines[i], diffIndex: i })
      i++
    }
    while (i < lines.length && lines[i].kind === "added") {
      added.push({ line: lines[i], diffIndex: i })
      i++
    }

    const maxLen = Math.max(removed.length, added.length)
    for (let j = 0; j < maxLen; j++) {
      rows.push({ left: removed[j] ?? null, right: added[j] ?? null })
    }
  }

  return rows
}

function SideBySideCell({
  entry,
  map,
  themeStyle,
}: {
  entry: { line: DiffLine; diffIndex: number } | null
  map: HighlightMap
  themeStyle: ThemeStyle
}) {
  if (!entry) {
    return <div className="flex min-w-0 flex-1 leading-5" />
  }

  const { line, diffIndex } = entry
  const isSkipped = line.kind === "skipped"
  const isAdded = line.kind === "added"
  const isRemoved = line.kind === "removed"
  const tokens = getLineTokens(line, diffIndex, map)

  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 leading-5",
        isAdded && "bg-green-500/8",
        isRemoved && "bg-red-500/8"
      )}
    >
      <span
        className={cn(
          "w-8 shrink-0 border-r pr-2 text-right text-xs select-none",
          isAdded && "border-green-500/20 text-green-400/50",
          isRemoved && "border-red-500/20 text-red-400/50",
          (line.kind === "context" || isSkipped) && "border-border/40 text-muted-foreground/40"
        )}
      >
        {isSkipped ? "" : line.lineNum}
      </span>
      <span
        className={cn(
          "flex-1 truncate pl-2 whitespace-pre",
          isSkipped && "text-muted-foreground/40 italic"
        )}
      >
        {isSkipped ? "⋯" : renderTokens(tokens, themeStyle)}
      </span>
    </div>
  )
}

export function SideBySideRowView({
  row,
  map,
  themeStyle,
}: {
  row: SideBySideRow
  map: HighlightMap
  themeStyle: ThemeStyle
}) {
  return (
    <div className="flex divide-x divide-border/30 leading-5">
      <SideBySideCell entry={row.left} map={map} themeStyle={themeStyle} />
      <SideBySideCell entry={row.right} map={map} themeStyle={themeStyle} />
    </div>
  )
}
