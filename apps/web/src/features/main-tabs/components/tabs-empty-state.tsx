import { MessageSquarePlus, Search, FolderPlus } from "lucide-react"
import { ShortcutKbd } from "@/shared/ui/kbd"
import { useKeyboardShortcuts } from "@/shared/components/keyboard-shortcuts-provider"
import { SHORTCUT_LABELS } from "@/shared/lib/keyboard-shortcuts"

const HINTS = [
  { action: "new_thread", icon: MessageSquarePlus } as const,
  { action: "open_command_palette", icon: Search } as const,
  { action: "new_workspace", icon: FolderPlus } as const,
]

export function TabsEmptyState() {
  const { shortcuts } = useKeyboardShortcuts()

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
      <div>
        <p className="text-sm font-medium">No open tabs</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Select a thread from the sidebar or use a shortcut to get started.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        {HINTS.map(({ action, icon: Icon }) => (
          <div key={action} className="flex items-center gap-3 text-xs text-muted-foreground">
            <Icon className="size-3.5 shrink-0" />
            <span className="w-36 text-left">{SHORTCUT_LABELS[action]}</span>
            <ShortcutKbd binding={shortcuts[action]} />
          </div>
        ))}
      </div>
    </div>
  )
}
