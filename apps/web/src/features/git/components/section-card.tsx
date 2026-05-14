import { memo, useState, type ReactNode } from "react"
import { ChevronRight, Loader2 } from "lucide-react"
import { Badge } from "@/shared/ui/badge"
import { cn } from "@/shared/lib/utils"

interface SectionCardProps {
  label: string
  count?: number
  isLoading?: boolean
  children?: ReactNode
  className?: string
}

export const SectionCard = memo(function SectionCard({
  label,
  count,
  isLoading,
  children,
  className,
}: SectionCardProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className={cn("mx-2 mt-1.5 overflow-hidden rounded-lg border border-border/50", className)}>
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="flex h-7 w-full items-center gap-1.5 bg-muted/30 px-2.5 transition-colors hover:bg-muted/50"
      >
        <ChevronRight
          className={cn(
            "h-3 w-3 shrink-0 text-muted-foreground/40 transition-transform duration-150",
            !collapsed && "rotate-90"
          )}
        />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
          {label}
        </span>
        {isLoading && (
          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground/40" />
        )}
        {!isLoading && count != null && count > 0 && (
          <Badge
            variant="secondary"
            className="h-4 min-w-4 rounded-full px-1 text-[10px] tabular-nums"
          >
            {count}
          </Badge>
        )}
      </button>

      {!collapsed && (
        <div className="animate-in duration-150 fade-in-0 slide-in-from-top-1">
          {children}
        </div>
      )}
    </div>
  )
})
