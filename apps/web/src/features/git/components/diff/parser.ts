import type { DiffHunk, DiffLine, DiffLineKind } from "./types"

function isSdkFormat(diff: string): boolean {
  const first = diff.split("\n").find(Boolean) ?? ""
  return /^[+\- ]\d+ /.test(first)
}

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
        prefix === "+"
          ? "added"
          : prefix === "-"
            ? "removed"
            : isSkipped
              ? "skipped"
              : "context"
      return { kind, lineNum, content }
    })
}

function parseUnifiedDiff(diff: string): DiffLine[] {
  const result: DiffLine[] = []
  let oldLine = 0
  let newLine = 0

  for (const raw of diff.split("\n")) {
    if (
      raw.startsWith("diff ") ||
      raw.startsWith("index ") ||
      raw.startsWith("--- ") ||
      raw.startsWith("+++ ")
    ) {
      continue
    }

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

export function parseDiff(diff: string): DiffLine[] {
  return isSdkFormat(diff) ? parseSdkDiff(diff) : parseUnifiedDiff(diff)
}

/**
 * Parses a unified diff into hunks, each carrying a self-contained `rawPatch`
 * suitable for `git apply --cached` (file headers + hunk header + hunk lines).
 * Returns an empty array for SDK-format diffs (not supported for hunk staging).
 */
export function parseHunks(diff: string): DiffHunk[] {
  if (isSdkFormat(diff)) return []

  const rawLines = diff.split("\n")
  const hunks: DiffHunk[] = []

  // Collect file header lines (diff --git, index, ---, +++)
  const fileHeaders: string[] = []
  let lineIdx = 0
  while (lineIdx < rawLines.length) {
    const raw = rawLines[lineIdx]
    if (
      raw.startsWith("diff ") ||
      raw.startsWith("index ") ||
      raw.startsWith("--- ") ||
      raw.startsWith("+++ ")
    ) {
      fileHeaders.push(raw)
      lineIdx++
    } else {
      break
    }
  }
  const fileHeaderStr = fileHeaders.join("\n")

  // Walk DiffLine[] in parallel to track startIndex
  let diffLineIndex = 0

  while (lineIdx < rawLines.length) {
    const raw = rawLines[lineIdx]

    if (!raw.startsWith("@@")) {
      lineIdx++
      // Non-hunk, non-header lines (e.g. "\ No newline at end of file")
      continue
    }

    const hunkHeader = raw
    const hunkRawLines: string[] = [raw]
    const hunkStartIndex = diffLineIndex

    // The @@ line maps to one "skipped" DiffLine
    diffLineIndex++
    lineIdx++

    while (lineIdx < rawLines.length) {
      const hunkLine = rawLines[lineIdx]
      if (hunkLine.startsWith("@@")) break
      if (
        hunkLine.startsWith("diff ") ||
        hunkLine.startsWith("index ") ||
        hunkLine.startsWith("--- ") ||
        hunkLine.startsWith("+++ ")
      ) {
        break
      }
      hunkRawLines.push(hunkLine)
      // Each non-empty content line corresponds to one DiffLine
      if (
        hunkLine.startsWith("+") ||
        hunkLine.startsWith("-") ||
        hunkLine.startsWith(" ") ||
        hunkLine === ""
      ) {
        diffLineIndex++
      }
      lineIdx++
    }

    const rawPatch =
      fileHeaderStr +
      "\n" +
      hunkRawLines.join("\n") +
      "\n"

    hunks.push({
      header: hunkHeader,
      rawPatch,
      startIndex: hunkStartIndex,
      lineCount: diffLineIndex - hunkStartIndex,
    })
  }

  return hunks
}
