import { memo } from "react"
import { FileAccordionItem } from "./file-accordion-item"
import { type ChangedFile } from "./status-badge"
import { type DiffMode } from "./diff-view"
import { SectionCard } from "./section-card"

export const FilesSection = memo(function FilesSection({
  label,
  files,
  sessionId,
  mode,
  onStageToggle,
  onRevert,
  onStageHunk,
  onUnstageHunk,
  emptyText,
}: {
  label: string
  files: ChangedFile[]
  sessionId: string
  mode: DiffMode
  onStageToggle: (file: ChangedFile) => Promise<void>
  onRevert: (file: ChangedFile) => Promise<void>
  onStageHunk?: (hunkPatch: string) => void
  onUnstageHunk?: (hunkPatch: string) => void
  emptyText?: string
}) {
  return (
    <SectionCard label={label} count={files.length} className="last:mb-1.5">
      {files.length === 0 && emptyText && (
        <p className="px-4 py-2.5 text-xs text-muted-foreground/40">{emptyText}</p>
      )}
      {files.map((file, i) => (
        <FileAccordionItem
          key={i}
          file={file}
          sessionId={sessionId}
          mode={mode}
          onStageToggle={onStageToggle}
          onRevert={onRevert}
          onStageHunk={onStageHunk}
          onUnstageHunk={onUnstageHunk}
        />
      ))}
    </SectionCard>
  )
})
