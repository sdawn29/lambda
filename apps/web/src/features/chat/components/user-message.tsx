import { FileTextIcon, TerminalIcon } from "lucide-react"
import { Icon } from "@iconify/react"

import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip"
import { getIconName } from "@/shared/ui/file-icon"
import type { SlashCommand } from "../api"

const CHIP_BASE_CLASS =
  "mx-0.5 inline-flex items-center gap-1 rounded-md border border-border bg-background px-1.5 py-0.5 align-middle font-mono text-xs text-foreground/80 select-text"

const TOKEN_RE = /(@[^\s]+|\/[^\s]+)/g

function isFileMention(path: string): boolean {
  const basename = path.split("/").pop() ?? path
  // Dotfiles (.npmrc, .env, .gitignore) start with a dot — always a file
  if (basename.startsWith(".")) return true
  return basename.lastIndexOf(".") > 0
}

function FileChip({ filePath }: { filePath: string }) {
  const basename = filePath.split("/").pop() ?? filePath
  return (
    <span className={CHIP_BASE_CLASS}>
      <Icon
        icon={`catppuccin:${getIconName(basename)}`}
        className="size-3.5 shrink-0"
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
    <span className={CHIP_BASE_CLASS}>
      <Icon icon="catppuccin:folder" className="size-3.5 shrink-0" aria-hidden />
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
            <span className={CHIP_BASE_CLASS}>
              {command.source === "skill" ? (
                <TerminalIcon className="size-3 shrink-0" aria-hidden />
              ) : (
                <FileTextIcon className="size-3 shrink-0" aria-hidden />
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
