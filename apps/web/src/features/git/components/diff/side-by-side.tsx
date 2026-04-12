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
    return <div className="h-5 min-w-full" />
  }

  const { line, diffIndex } = entry
  const isSkipped = line.kind === "skipped"
  const isAdded = line.kind === "added"
  const isRemoved = line.kind === "removed"
  const isNeutral = line.kind === "context" || isSkipped
  const tokens = getLineTokens(line, diffIndex, map)

  return (
    <div
      className={cn(
        "flex min-w-full leading-5",
        isAdded && "bg-green-500/8",
        isRemoved && "bg-red-500/8"
      )}
    >
      <span
        className={cn(
          "sticky left-0 z-10 w-8 shrink-0 border-r pr-2 text-right text-xs select-none",
          isAdded && "border-green-500/20 text-green-400/50",
          isRemoved && "border-red-500/20 text-red-400/50",
          isNeutral && "border-border/40 text-muted-foreground/40",
          isAdded && "bg-green-50 dark:bg-green-950",
          isRemoved && "bg-red-50 dark:bg-red-950",
          isNeutral && "bg-background"
        )}
      >
        {isSkipped ? "" : line.lineNum}
      </span>
      <span
        className={cn(
          "w-max shrink-0 pl-2 whitespace-pre",
          isSkipped && "text-muted-foreground/40 italic"
        )}
      >
        {isSkipped ? "⋯" : renderTokens(tokens, themeStyle)}
      </span>
    </div>
  )
}

function SideBySideColumn({
  entries,
  map,
  themeStyle,
}: {
  entries: Array<{ line: DiffLine; diffIndex: number } | null>
  map: HighlightMap
  themeStyle: ThemeStyle
}) {
  return (
    <div className="min-w-0 overflow-x-auto">
      <div className="w-max min-w-full">
        {entries.map((entry, index) => (
          <SideBySideCell
            key={index}
            entry={entry}
            map={map}
            themeStyle={themeStyle}
          />
        ))}
      </div>
    </div>
  )
}

export function SideBySideView({
  rows,
  map,
  themeStyle,
}: {
  rows: SideBySideRow[]
  map: HighlightMap
  themeStyle: ThemeStyle
}) {
  return (
    <div className="grid min-w-0 grid-cols-2 divide-x divide-border/30">
      <SideBySideColumn
        entries={rows.map((row) => row.left)}
        map={map}
        themeStyle={themeStyle}
      />
      <SideBySideColumn
        entries={rows.map((row) => row.right)}
        map={map}
        themeStyle={themeStyle}
      />
    </div>
  )
}
