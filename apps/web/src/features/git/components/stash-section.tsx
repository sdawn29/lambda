import { memo, useCallback, useMemo, useState } from "react"
import { ChevronRight, Loader2 } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Badge } from "@/shared/ui/badge"
import { StashEntryRow, parseStashList } from "./stash-entry-row"
import { useGitStashList } from "../queries"
import { cn } from "@/shared/lib/utils"
import { useGitStashMutations } from "../mutations"

export const StashSection = memo(function StashSection({
  sessionId,
}: {
  sessionId: string
}) {
  const [collapsed, setCollapsed] = useState(false)

  const { data: stashRaw, isLoading } = useGitStashList(sessionId)
  const { apply, pop, drop } = useGitStashMutations(sessionId)

  const stashes = useMemo(() => parseStashList(stashRaw ?? ""), [stashRaw])

  const handleApply = useCallback(
    (ref: string) => apply.mutateAsync(ref),
    [apply]
  )
  const handlePop = useCallback((ref: string) => pop.mutateAsync(ref), [pop])
  const handleDrop = useCallback((ref: string) => drop.mutateAsync(ref), [drop])

  return (
    <div className="shrink-0 border-b border-border/40">
      <Button
        variant="ghost"
        onClick={() => setCollapsed((v) => !v)}
        className="flex h-auto w-full items-center justify-start gap-2 rounded-none px-3 py-1.5"
      >
        <ChevronRight
          className={cn(
            "h-3 w-3 shrink-0 text-muted-foreground/40 transition-transform duration-150",
            !collapsed && "rotate-90"
          )}
        />
        <span className="text-[10px] font-semibold tracking-wide text-muted-foreground/60 uppercase">
          Stashes
        </span>
        {isLoading && (
          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground/40" />
        )}
        {!isLoading && stashes.length > 0 && (
          <Badge variant="secondary" className="h-4 min-w-4 rounded-full px-1 text-[10px]">
            {stashes.length}
          </Badge>
        )}
      </Button>

      {!collapsed && (
        <div className="animate-in duration-150 fade-in-0 slide-in-from-top-1">
          {!isLoading && stashes.length === 0 && (
            <p className="px-4 py-2.5 text-xs text-muted-foreground/40">
              No stashes
            </p>
          )}
          {stashes.map((s) => (
            <StashEntryRow
              key={s.ref}
              entry={s}
              onApply={handleApply}
              onPop={handlePop}
              onDrop={handleDrop}
            />
          ))}
        </div>
      )}
    </div>
  )
})
