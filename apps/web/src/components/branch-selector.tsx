import * as React from "react"
import { Popover } from "@base-ui/react/popover"
import { GitBranchIcon, CheckIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface BranchSelectorProps {
  branch: string | null
  branches: string[]
  onBranchSelect?: (branch: string) => void
}

export function BranchSelector({
  branch,
  branches,
  onBranchSelect,
}: BranchSelectorProps) {
  const [query, setQuery] = React.useState("")
  const inputRef = React.useRef<HTMLInputElement>(null)

  const filtered = React.useMemo(
    () =>
      query.trim()
        ? branches.filter((b) =>
            b.toLowerCase().includes(query.toLowerCase())
          )
        : branches,
    [branches, query]
  )

  function handleSelect(b: string) {
    onBranchSelect?.(b)
  }

  return (
    <Popover.Root
      onOpenChange={(open) => {
        if (open) {
          setQuery("")
          setTimeout(() => inputRef.current?.focus(), 0)
        }
      }}
    >
      <Popover.Trigger
        className={cn(
          "flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted-foreground transition-colors",
          "hover:bg-muted hover:text-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
        )}
      >
        <GitBranchIcon className="size-3 shrink-0" />
        <span className="max-w-32 truncate">{branch ?? "no branch"}</span>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Positioner side="top" align="start" sideOffset={6}>
          <Popover.Popup
            className={cn(
              "z-50 w-56 overflow-hidden rounded-lg border border-border/50 bg-popover/80 shadow-md",
              "backdrop-blur-2xl backdrop-saturate-150",
              "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
              "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
              "origin-(--transform-origin)"
            )}
          >
            <div className="border-b border-border/30 px-2 py-1.5">
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search branch…"
                className="w-full bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground"
              />
            </div>

            <div className="max-h-48 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <p className="px-2 py-3 text-center text-xs text-muted-foreground">
                  No branches found
                </p>
              ) : (
                filtered.map((b) => (
                  <Popover.Close
                    key={b}
                    onClick={() => handleSelect(b)}
                    className={cn(
                      "flex w-full cursor-default items-center gap-2 px-2 py-1.5 text-xs",
                      "rounded-sm hover:bg-foreground/10 focus-visible:bg-foreground/10 focus-visible:outline-none",
                      b === branch && "font-medium text-foreground"
                    )}
                  >
                    <CheckIcon
                      className={cn(
                        "size-3 shrink-0",
                        b === branch ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="truncate">{b}</span>
                  </Popover.Close>
                ))
              )}
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}
