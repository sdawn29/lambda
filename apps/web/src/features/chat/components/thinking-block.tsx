import { memo, useState } from "react"
import { BrainIcon, ChevronDownIcon } from "lucide-react"

import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"

import { cn } from "@/shared/lib/utils"
import { markdownComponents } from "./markdown-components"

function getThinkingSummary(thinking: string): string {
  const firstMeaningfulLine =
    thinking
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => line.length > 0 && !line.startsWith("```")) ?? ""

  return firstMeaningfulLine
    .replace(/^[#>*+\-\d.\s]+/, "")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_~`]+/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

export const ThinkingBlock = memo(function ThinkingBlock({
  thinking,
}: {
  thinking: string
}) {
  const [userToggled, setUserToggled] = useState(false)
  const [manualExpanded, setManualExpanded] = useState(false)

  const expanded = userToggled ? manualExpanded : true
  const summary = getThinkingSummary(thinking)

  function toggle() {
    setUserToggled(true)
    setManualExpanded((current) => !current)
  }

  return (
    <div className="w-full self-start text-xs text-muted-foreground">
      <button
        type="button"
        className="flex w-full items-center gap-1.5 py-0.5 text-left transition-colors hover:text-foreground"
        onClick={toggle}
      >
        <span className="flex size-4 shrink-0 items-center justify-center">
          <BrainIcon className="h-3.5 w-3.5 text-muted-foreground" />
        </span>
        <span className="shrink-0 font-medium text-foreground">Thinking</span>
        {summary && (
          <span className="min-w-0 flex-1 truncate text-muted-foreground">
            {summary}
          </span>
        )}
        <ChevronDownIcon
          className={cn(
            "h-3 w-3 shrink-0 text-muted-foreground transition-transform",
            expanded && "rotate-180"
          )}
        />
      </button>

      {expanded && (
        <div className="mt-1 ml-2 animate-in border-l pl-5 duration-300 fade-in-0 slide-in-from-top-1">
          <div className="prose prose-sm max-w-none text-muted-foreground dark:prose-invert [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
            <Markdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {thinking}
            </Markdown>
          </div>
        </div>
      )}
    </div>
  )
})
