import { Loader2Icon, SparklesIcon } from "lucide-react"

import { cn } from "@/shared/lib/utils"

type CompactionReason = "manual" | "threshold" | "overflow"

const REASON_COPY: Record<CompactionReason, { title: string; description: string }> = {
  manual: {
    title: "Compacting context",
    description: "Summarizing conversation history as requested",
  },
  threshold: {
    title: "Compacting context",
    description: "Summarizing conversation history to free up the context window",
  },
  overflow: {
    title: "Freeing context window",
    description: "Context limit reached — summarizing history to continue",
  },
}

interface CompactingIndicatorProps {
  className?: string
  reason?: CompactionReason | null
}

export function CompactingIndicator({ className, reason }: CompactingIndicatorProps) {
  const copy = reason ? REASON_COPY[reason] : REASON_COPY.threshold

  return (
    <div
      className={cn(
        "flex w-full animate-in self-start duration-200 fade-in-0",
        className
      )}
      aria-live="polite"
      aria-label={copy.title}
    >
      <div className="flex w-full items-start gap-2.5 rounded-lg border border-border/60 bg-card px-3 py-2.5 shadow-xs">
        <div className="mt-0.5 flex shrink-0 items-center justify-center rounded-md bg-primary/10 p-1.5">
          <SparklesIcon className="h-3.5 w-3.5 text-primary" />
        </div>

        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="animate-thinking-shimmer bg-linear-to-r from-muted-foreground/50 via-foreground to-muted-foreground/50 bg-size-[200%_100%] bg-clip-text text-xs font-medium text-transparent">
            {copy.title}
          </span>
          <span className="text-[10px] leading-relaxed text-muted-foreground">
            {copy.description}
          </span>
        </div>

        <Loader2Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground/50" />
      </div>
    </div>
  )
}
