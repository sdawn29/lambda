import { LayoutDashboard } from "lucide-react"

export function TabsEmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <LayoutDashboard className="size-6 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-medium">No open tabs</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Select a thread from the sidebar or open a file to get started.
        </p>
      </div>
    </div>
  )
}
