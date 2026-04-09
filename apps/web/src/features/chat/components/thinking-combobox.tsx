import * as React from "react"
import { BrainIcon, ChevronsUpDownIcon } from "lucide-react"

import { Button } from "@/shared/ui/button"
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/shared/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui/popover"

export type ThinkingLevel = "low" | "medium" | "high" | "xhigh"

const THINKING_LEVELS: {
  value: ThinkingLevel
  label: string
  icon: React.ReactNode
}[] = [
  {
    value: "low",
    label: "Low",
    icon: <BrainIcon className="size-3.5 shrink-0" strokeWidth={1} />,
  },
  {
    value: "medium",
    label: "Med",
    icon: <BrainIcon className="size-3.5 shrink-0" strokeWidth={1.5} />,
  },
  {
    value: "high",
    label: "High",
    icon: <BrainIcon className="size-3.5 shrink-0" strokeWidth={2.5} />,
  },
  {
    value: "xhigh",
    label: "Max",
    icon: <BrainIcon className="size-3.5 shrink-0" strokeWidth={3} />,
  },
]

export function ThinkingCombobox({
  selected,
  onSelect,
}: {
  selected: ThinkingLevel
  onSelect: (level: ThinkingLevel) => void
}) {
  const [open, setOpen] = React.useState(false)
  const selectedLevel = THINKING_LEVELS.find((l) => l.value === selected)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button variant="ghost" size="sm" aria-expanded={open}>
            {selectedLevel?.icon}
            <span>{selectedLevel?.label ?? selected}</span>
            <ChevronsUpDownIcon data-icon="inline-end" className="opacity-50" />
          </Button>
        }
      />
      <PopoverContent
        className="w-28 p-0"
        side="top"
        align="start"
        sideOffset={6}
      >
        <Command>
          <CommandList>
            <CommandGroup>
              {THINKING_LEVELS.map((level) => (
                <CommandItem
                  key={level.value}
                  value={level.value}
                  data-checked={level.value === selected}
                  onSelect={() => {
                    onSelect(level.value)
                    setOpen(false)
                  }}
                >
                  {level.icon}
                  {level.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
