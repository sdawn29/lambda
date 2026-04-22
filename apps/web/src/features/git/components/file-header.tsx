// ─── File Header ───────────────────────────────────────────────────────────────

import { useCallback } from "react"
import { ExternalLink } from "lucide-react"
import { openFileWithApp } from "@/features/electron/api"
import { Button } from "@/shared/ui/button"

interface FileHeaderProps {
  pathParts: string[]
  filePath: string
  openWithAppId?: string | null
}

export function FileHeader({ pathParts, filePath, openWithAppId }: FileHeaderProps) {
  const handleOpenClick = useCallback(() => {
    // Open with the selected editor (or default if none selected)
    openFileWithApp(filePath, openWithAppId ?? undefined)
  }, [filePath, openWithAppId])

  return (
    <div className="scrollbar-none flex min-w-0 items-center gap-2 px-2 py-1 text-xs">
      <div className="flex min-w-0 flex-1 items-center overflow-x-auto">
        {pathParts.map((part, i) => (
          <span key={i} className="flex shrink-0 items-center">
            {i > 0 && <span className="mx-1 text-muted-foreground/50">›</span>}
            <span
              className={
                i === pathParts.length - 1
                  ? "font-medium text-foreground"
                  : "text-muted-foreground"
              }
            >
              {part}
            </span>
          </span>
        ))}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={handleOpenClick}
        className="h-6 gap-1 text-[10px]"
        title="Open in editor"
      >
        <ExternalLink data-icon="inline-start" />
        Open
      </Button>
    </div>
  )
}
