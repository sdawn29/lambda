import { FileIcon, FileTextIcon, FolderIcon, TerminalIcon } from "lucide-react"

import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip"
import { badgeVariants } from "@/shared/ui/badge"
import { getFileTypeColor } from "@/shared/lib/file-type-color"
import { cn } from "@/shared/lib/utils"
import type { SlashCommand } from "../api"

const CHIP_BASE_CLASS = cn(
  badgeVariants({ variant: "secondary" }),
  "mx-0.5 gap-1 px-1.5 py-0.5 text-xs text-foreground select-text"
)

const TOKEN_RE = /(@[^\s]+|\/[^\s]+)/g

function isFileMention(path: string): boolean {
  const basename = path.split("/").pop() ?? path
  return basename.lastIndexOf(".") > 0
}

function FileChip({ filePath }: { filePath: string }) {
  const basename = filePath.split("/").pop() ?? filePath
  const color = getFileTypeColor(basename)
  return (
    <span
      className={cn(CHIP_BASE_CLASS, "border-primary/25 bg-primary/10 font-mono")}
    >
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
    <span
      className={cn(CHIP_BASE_CLASS, "border-primary/25 bg-primary/10 font-mono")}
    >
      <FolderIcon
        width={10}
        height={10}
        className="shrink-0 text-primary"
        aria-hidden
      />
      {basename}
    </span>
  )
}

function SlashCommandChip({ command }: { command: SlashCommand }) {
  const label = command.source === "skill" ? "Skill" : "Prompt"

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span className="inline-flex align-middle">
            <span
              className={cn(
                CHIP_BASE_CLASS,
                command.source === "skill"
                  ? "border-emerald-500/25 bg-emerald-500/10"
                  : "border-sky-500/25 bg-sky-500/10"
              )}
            >
              {command.source === "skill" ? (
                <TerminalIcon aria-hidden />
              ) : (
                <FileTextIcon aria-hidden />
              )}
              <span className="font-mono">/{command.name}</span>
            </span>
          </span>
        }
      />
      <TooltipContent className="max-w-sm flex-col items-start gap-1.5 text-left">
        <span className="text-[10px] font-semibold tracking-[0.14em] text-background/70 uppercase">
          {label}
        </span>
        <span className="font-mono text-[11px]">/{command.name}</span>
        {command.description ? (
          <span className="text-[11px] leading-relaxed text-background/85">
            {command.description}
          </span>
        ) : (
          <span className="text-[11px] leading-relaxed text-background/70">
            No description available.
          </span>
        )}
      </TooltipContent>
    </Tooltip>
  )
}

export function UserMessageContent({
  content,
  commandsByName,
}: {
  content: string
  commandsByName?: ReadonlyMap<string, SlashCommand>
}) {
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  let key = 0

  while ((match = TOKEN_RE.exec(content)) !== null) {
    const token = match[0]
    const start = match.index

    if (start > lastIndex) {
      parts.push(content.slice(lastIndex, start))
    }

    if (token.startsWith("@")) {
      const path = token.slice(1)
      parts.push(
        isFileMention(path) ? (
          <FileChip key={`token-${key++}`} filePath={path} />
        ) : (
          <FolderChip key={`token-${key++}`} folderPath={path} />
        )
      )
      lastIndex = start + token.length
      continue
    }

    const hasBoundary = start === 0 || /\s/.test(content[start - 1] ?? "")
    const command = hasBoundary
      ? commandsByName?.get(token.slice(1))
      : undefined

    parts.push(
      command ? (
        <SlashCommandChip key={`token-${key++}`} command={command} />
      ) : (
        token
      )
    )
    lastIndex = start + token.length
  }

  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex))
  }

  return <>{parts}</>
}
