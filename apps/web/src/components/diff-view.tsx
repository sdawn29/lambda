import { useMemo } from "react"
import { cn } from "@/lib/utils"

type DiffLineKind = "added" | "removed" | "context" | "skipped"

interface DiffLine {
  kind: DiffLineKind
  lineNum: string
  content: string
}

// ── Format detection ───────────────────────────────────────────────────────────
// SDK lines look like "+3 content" — digit(s) immediately after the sign.

function isSdkFormat(diff: string): boolean {
  const first = diff.split("\n").find(Boolean) ?? ""
  return /^[+\- ]\d+ /.test(first)
}

// ── SDK format parser ──────────────────────────────────────────────────────────
// Format: "+N content", "-N content", " N content", " N ..."

function parseSdkDiff(diff: string): DiffLine[] {
  return diff
    .split("\n")
    .filter(Boolean)
    .map((raw): DiffLine => {
      const prefix = raw[0]
      const rest = raw.slice(1)
      const spaceIdx = rest.indexOf(" ")
      const lineNum = spaceIdx === -1 ? rest : rest.slice(0, spaceIdx)
      const content = spaceIdx === -1 ? "" : rest.slice(spaceIdx + 1)
      const isSkipped = prefix === " " && content === "..."
      const kind: DiffLineKind =
        prefix === "+" ? "added"
        : prefix === "-" ? "removed"
        : isSkipped ? "skipped"
        : "context"
      return { kind, lineNum, content }
    })
}

// ── Unified diff parser ────────────────────────────────────────────────────────
// Skips meta lines (diff/index/---/+++), parses @@ for line numbers, tracks
// old/new line counters for every added/removed/context line.

function parseUnifiedDiff(diff: string): DiffLine[] {
  const result: DiffLine[] = []
  let oldLine = 0
  let newLine = 0

  for (const raw of diff.split("\n")) {
    // Skip file-level meta entirely
    if (
      raw.startsWith("diff ") ||
      raw.startsWith("index ") ||
      raw.startsWith("--- ") ||
      raw.startsWith("+++ ")
    ) {
      continue
    }

    // Hunk header — extract starting line numbers, emit a separator
    if (raw.startsWith("@@")) {
      const m = raw.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/)
      if (m) {
        oldLine = parseInt(m[1], 10)
        newLine = parseInt(m[2], 10)
      }
      result.push({ kind: "skipped", lineNum: "", content: "" })
      continue
    }

    if (raw.startsWith("+")) {
      result.push({ kind: "added", lineNum: String(newLine++), content: raw.slice(1) })
    } else if (raw.startsWith("-")) {
      result.push({ kind: "removed", lineNum: String(oldLine++), content: raw.slice(1) })
    } else if (raw.startsWith(" ") || raw === "") {
      result.push({ kind: "context", lineNum: String(oldLine), content: raw.slice(1) })
      oldLine++
      newLine++
    }
  }

  return result
}

// ── Row ────────────────────────────────────────────────────────────────────────

function DiffRow({ line }: { line: DiffLine }) {
  return (
    <div
      className={cn(
        "flex leading-5",
        line.kind === "added" && "bg-green-500/8 hover:bg-green-500/12",
        line.kind === "removed" && "bg-red-500/8 hover:bg-red-500/12",
      )}
    >
      {/* Sign */}
      <span
        className={cn(
          "w-4 shrink-0 select-none text-center",
          line.kind === "added" && "text-green-500",
          line.kind === "removed" && "text-red-500",
          (line.kind === "context" || line.kind === "skipped") && "text-muted-foreground/30",
        )}
      >
        {line.kind === "added" ? "+" : line.kind === "removed" ? "−" : ""}
      </span>

      {/* Line number */}
      <span
        className={cn(
          "w-8 shrink-0 select-none border-r pr-2 text-right",
          line.kind === "added" && "border-green-500/20 text-green-400/50",
          line.kind === "removed" && "border-red-500/20 text-red-400/50",
          (line.kind === "context" || line.kind === "skipped") &&
            "border-border/40 text-muted-foreground/40",
        )}
      >
        {line.lineNum}
      </span>

      {/* Content */}
      <span
        className={cn(
          "flex-1 whitespace-pre pl-3",
          line.kind === "added" && "text-green-700 dark:text-green-400",
          line.kind === "removed" && "text-red-700 dark:text-red-400",
          line.kind === "context" && "text-foreground/60",
          line.kind === "skipped" && "italic text-muted-foreground/40",
        )}
      >
        {line.kind === "skipped" ? "⋯" : line.content || " "}
      </span>
    </div>
  )
}

// ── Public component ───────────────────────────────────────────────────────────

interface DiffViewProps {
  diff: string
  className?: string
}

export function DiffView({ diff, className }: DiffViewProps) {
  const lines = useMemo(() => {
    return isSdkFormat(diff) ? parseSdkDiff(diff) : parseUnifiedDiff(diff)
  }, [diff])

  const added = lines.filter((l) => l.kind === "added").length
  const removed = lines.filter((l) => l.kind === "removed").length

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-border/60 font-mono text-xs",
        className,
      )}
    >
      <div className="max-h-80 overflow-auto">
        {lines.map((line, i) => (
          <DiffRow key={i} line={line} />
        ))}
      </div>

      {(added > 0 || removed > 0) && (
        <div className="flex items-center gap-3 border-t border-border/60 bg-muted/20 px-3 py-1.5 font-sans text-xs text-muted-foreground">
          {removed > 0 && <span className="text-red-500">−{removed} removed</span>}
          {added > 0 && <span className="text-green-600 dark:text-green-400">+{added} added</span>}
        </div>
      )}
    </div>
  )
}
