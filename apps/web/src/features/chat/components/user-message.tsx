import { FileIcon, FolderIcon } from "lucide-react"
import { getFileTypeColor } from "@/shared/lib/file-type-color"

// Splits message content on @mention tokens.
// File if the last segment has an extension (dot not at position 0), folder otherwise.
const MENTION_RE = /(@[^\s]+)/g

function isFileMention(path: string): boolean {
  const basename = path.split("/").pop() ?? path
  return basename.lastIndexOf(".") > 0
}

function FileChip({ filePath }: { filePath: string }) {
  const basename = filePath.split("/").pop() ?? filePath
  const color = getFileTypeColor(basename)
  return (
    <span className="mx-0.5 inline-flex items-center gap-1 rounded border border-primary/30 bg-primary/10 px-1 py-px font-mono text-[10px] font-medium text-foreground select-text">
      <FileIcon
        width={10}
        height={10}
        style={{ color, flexShrink: 0 }}
        aria-hidden
      />
      {basename}
    </span>
  )
}

function FolderChip({ folderPath }: { folderPath: string }) {
  const normalized = folderPath.replace(/\/+$/, "")
  const basename = normalized.split("/").pop() || normalized
  return (
    <span className="mx-0.5 inline-flex items-center gap-1 rounded border border-primary/30 bg-primary/10 px-1 py-px font-mono text-[10px] font-medium text-foreground select-text">
      <FolderIcon
        width={10}
        height={10}
        style={{ color: "#60a5fa", flexShrink: 0 }}
        aria-hidden
      />
      {basename}
    </span>
  )
}

export function UserMessageContent({ content }: { content: string }) {
  const parts = content.split(MENTION_RE)
  return (
    <>
      {parts.map((part, i) => {
        if (!part.startsWith("@")) return part
        const path = part.slice(1)
        return isFileMention(path) ? (
          <FileChip key={i} filePath={path} />
        ) : (
          <FolderChip key={i} folderPath={path} />
        )
      })}
    </>
  )
}
