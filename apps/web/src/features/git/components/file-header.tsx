// ─── File Header ───────────────────────────────────────────────────────────────

import { useCallback } from "react"
import { Code2, ExternalLink, Eye, Globe } from "lucide-react"
import { Icon } from "@iconify/react"
import { getIconName } from "@/shared/ui/file-icon"
import { openFileWithApp, openExternal } from "@/features/electron/api"
import { Button } from "@/shared/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip"

interface FileHeaderProps {
  pathParts: string[]
  filePath: string
  openWithAppId?: string | null
  isMarkdown?: boolean
  markdownPreview?: boolean
  onToggleMarkdownPreview?: () => void
  isHtml?: boolean
  isPdf?: boolean
}

export function FileHeader({
  pathParts,
  filePath,
  openWithAppId,
  isMarkdown,
  markdownPreview,
  onToggleMarkdownPreview,
  isHtml,
  isPdf,
}: FileHeaderProps) {
  const fileName = pathParts[pathParts.length - 1] ?? ""

  const handleOpenClick = useCallback(() => {
    openFileWithApp(filePath, openWithAppId ?? undefined)
  }, [filePath, openWithAppId])

  const handleOpenInBrowser = useCallback(async () => {
    await openExternal(`file://${filePath}`)
  }, [filePath])

  return (
    <div className="flex h-8 min-w-0 items-center gap-1 px-2">
      {/* File icon + breadcrumb */}
      <div className="scrollbar-none flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto">
        <Icon
          icon={`catppuccin:${getIconName(fileName)}`}
          className="size-3.5 shrink-0 opacity-80"
          aria-hidden
        />
        {pathParts.map((part, i) => (
          <span key={i} className="flex shrink-0 items-center">
            {i > 0 && (
              <span className="mx-0.5 select-none text-muted-foreground/40">
                ›
              </span>
            )}
            <span
              className={
                i === pathParts.length - 1
                  ? "text-xs font-medium text-foreground"
                  : "text-xs text-muted-foreground/50"
              }
            >
              {part}
            </span>
          </span>
        ))}
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-0.5">
        {isMarkdown && onToggleMarkdownPreview && (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant={markdownPreview ? "secondary" : "ghost"}
                  size="icon-sm"
                  onClick={onToggleMarkdownPreview}
                  className="text-muted-foreground/70 hover:text-foreground"
                >
                  {markdownPreview ? <Code2 /> : <Eye />}
                  <span className="sr-only">
                    {markdownPreview ? "Show raw source" : "Preview markdown"}
                  </span>
                </Button>
              }
            />
            <TooltipContent>
              {markdownPreview ? "Show raw source" : "Preview markdown"}
            </TooltipContent>
          </Tooltip>
        )}

        {(isHtml || isPdf) && (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleOpenInBrowser}
                  className="text-muted-foreground/70 hover:text-foreground"
                >
                  <Globe />
                  <span className="sr-only">
                    {isHtml ? "Open in browser" : "Open in PDF viewer"}
                  </span>
                </Button>
              }
            />
            <TooltipContent>
              {isHtml ? "Open in browser" : "Open in PDF viewer"}
            </TooltipContent>
          </Tooltip>
        )}

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleOpenClick}
                className="text-muted-foreground/70 hover:text-foreground"
              >
                <ExternalLink />
                <span className="sr-only">Open in editor</span>
              </Button>
            }
          />
          <TooltipContent>Open in editor</TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}
