import { useState, useRef } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Loader2Icon, SparklesIcon } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui/popover"
import { Button } from "@/shared/ui/button"
import type { ContextUsage } from "../api"
import { compactSession } from "../api"
import { chatKeys } from "../queries"

interface ContextChartProps {
  contextUsage: ContextUsage | null | undefined
  sessionId?: string
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

export function ContextChart({ contextUsage, sessionId }: ContextChartProps) {
  const queryClient = useQueryClient()
  const [isCompacting, setIsCompacting] = useState(false)
  const [compactError, setCompactError] = useState<string | null>(null)
  // Hold the last valid (non-null-tokens) snapshot so we never flash "?"
  const lastValidRef = useRef<ContextUsage | null>(null)

  if (contextUsage && contextUsage.tokens != null) {
    lastValidRef.current = contextUsage
  }

  const display = lastValidRef.current ?? contextUsage
  if (!display) return null

  const pct =
    display.percent ??
    (display.tokens != null
      ? (display.tokens / display.contextWindow) * 100
      : null)

  const size = 16
  const strokeWidth = 2
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const fill = pct != null ? Math.min(pct, 100) / 100 : 0
  const dashOffset = circumference * (1 - fill)

  const ringColor =
    fill >= 0.9
      ? "stroke-destructive"
      : fill >= 0.75
        ? "stroke-yellow-500 dark:stroke-yellow-400"
        : "stroke-muted-foreground/40"

  const usedLabel = display.tokens != null ? formatTokens(display.tokens) : "?"
  const totalLabel = formatTokens(display.contextWindow)
  const pctLabel = pct != null ? `${Math.round(pct)}%` : "?"

  async function handleCompact() {
    if (!sessionId || isCompacting) return
    setIsCompacting(true)
    setCompactError(null)
    try {
      await compactSession(sessionId)
      // Refetch so the ring updates; stale values stay visible until fresh data arrives
      void queryClient.invalidateQueries({
        queryKey: chatKeys.contextUsage(sessionId),
      })
    } catch (err) {
      setCompactError(err instanceof Error ? err.message : "Compaction failed")
    } finally {
      setIsCompacting(false)
    }
  }

  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            type="button"
            className="group flex cursor-pointer items-center rounded px-0.5 py-0.5 transition-colors hover:bg-muted/60"
            aria-label="Context window usage"
          >
            <svg
              width={size}
              height={size}
              viewBox={`0 0 ${size} ${size}`}
              className="shrink-0 -rotate-90"
            >
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                strokeWidth={strokeWidth}
                className="stroke-muted-foreground/15"
              />
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                className={`transition-all duration-500 ${ringColor}`}
              />
            </svg>
            {pct != null && (
              <span className="max-w-0 overflow-hidden text-[10px] leading-none text-muted-foreground tabular-nums transition-all duration-200 ease-out group-hover:max-w-[3ch] group-hover:pl-1">
                {Math.round(pct)}%
              </span>
            )}
          </button>
        }
      />
      <PopoverContent side="top" align="end" className="w-56 p-3">
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <span className="text-xs font-medium text-popover-foreground">
            Context window
          </span>
          <span
            className={`text-xs font-semibold tabular-nums ${
              fill >= 0.9
                ? "text-destructive"
                : fill >= 0.75
                  ? "text-yellow-500 dark:text-yellow-400"
                  : "text-foreground"
            }`}
          >
            {pctLabel}
          </span>
        </div>

        {/* Bar track */}
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              fill >= 0.9
                ? "bg-destructive"
                : fill >= 0.75
                  ? "bg-yellow-500 dark:bg-yellow-400"
                  : "bg-primary"
            }`}
            style={{ width: `${Math.min(fill * 100, 100)}%` }}
          />
        </div>

        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-[10px] tabular-nums text-muted-foreground">
            {usedLabel}/{totalLabel} tokens
          </span>
          {sessionId && (
            <Button
              size="sm"
              variant="secondary"
              onClick={handleCompact}
              disabled={isCompacting}
              className="h-5 gap-1 px-1.5 text-[10px]"
            >
              {isCompacting ? (
                <Loader2Icon className="h-2.5 w-2.5 animate-spin" />
              ) : (
                <SparklesIcon className="h-2.5 w-2.5" />
              )}
              Compact
            </Button>
          )}
        </div>
        {compactError && (
          <p className="mt-1 text-[10px] text-destructive">{compactError}</p>
        )}
      </PopoverContent>
    </Popover>
  )
}
