import { cn } from "@/shared/lib/utils"
import { formatBindingParts } from "@/shared/lib/keyboard-shortcuts"

function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "pointer-events-none inline-flex h-5 w-fit min-w-5 items-center justify-center gap-1 rounded-xs bg-muted px-1 font-sans text-[0.625rem] font-medium text-muted-foreground select-none in-data-[slot=tooltip-content]:bg-background/20 in-data-[slot=tooltip-content]:text-background dark:in-data-[slot=tooltip-content]:bg-background/10 [&_svg:not([class*='size-'])]:size-3",
        className
      )}
      {...props}
    />
  )
}

function KbdGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <kbd
      data-slot="kbd-group"
      className={cn("inline-flex items-center gap-1", className)}
      {...props}
    />
  )
}

/** Renders a keyboard shortcut binding string as individual Kbd elements inside a KbdGroup. */
function ShortcutKbd({ binding, className }: { binding: string; className?: string }) {
  const parts = formatBindingParts(binding)
  if (parts.length === 0) return null
  return (
    <KbdGroup className={className}>
      {parts.map((part, i) => (
        <Kbd key={i}>{part}</Kbd>
      ))}
    </KbdGroup>
  )
}

export { Kbd, KbdGroup, ShortcutKbd }
