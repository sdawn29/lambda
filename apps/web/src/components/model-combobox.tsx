import * as React from "react"
import { ChevronsUpDownIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { getProviderMeta } from "@/lib/provider-meta"

export type ModelGroup = [
  string,
  { id: string; name: string; provider: string; reasoning: boolean }[],
][]

export function ModelCombobox({
  groups,
  selected,
  onSelect,
  disabled,
}: {
  groups: ModelGroup
  selected: { id: string; name: string } | null
  onSelect: (id: string) => void
  disabled?: boolean
}) {
  const [open, setOpen] = React.useState(false)

  const selectedProvider = groups.find(([, items]) =>
    items.some((m) => m.id === selected?.id)
  )?.[0]
  const selectedMeta = selectedProvider
    ? getProviderMeta(selectedProvider)
    : null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            disabled={disabled}
            aria-expanded={open}
          >
            {selectedMeta?.icon}
            <span>{selected?.name ?? "Select model"}</span>
            <ChevronsUpDownIcon data-icon="inline-end" className="opacity-50" />
          </Button>
        }
      />
      <PopoverContent
        className="w-48 p-0"
        side="top"
        align="start"
        sideOffset={6}
      >
        <Command>
          <CommandInput placeholder="Search models…" />
          <CommandList>
            <CommandEmpty>No models found</CommandEmpty>
            {groups.map(([provider, items]) => {
              const meta = getProviderMeta(provider)
              return (
                <CommandGroup key={provider} heading={meta.label}>
                  {items.map((m) => (
                    <CommandItem
                      key={m.id}
                      value={`${provider} ${m.name}`}
                      data-checked={m.id === selected?.id}
                      onSelect={() => {
                        onSelect(m.id)
                        setOpen(false)
                      }}
                    >
                      {meta.icon}
                      {m.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
