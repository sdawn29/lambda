import { memo, useState } from "react"
import { BrainIcon } from "lucide-react"

import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"

import { cn } from "@/shared/lib/utils"

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
  const [expanded, setExpanded] = useState(false)
  const summary = getThinkingSummary(thinking)

  return (
    <div className="w-full self-start text-xs">
      <button
        type="button"
        className="group flex w-full items-center gap-1.5 py-0.5 text-left transition-colors"
        onClick={() => setExpanded((e) => !e)}
      >
        <BrainIcon className="h-3 w-3 shrink-0 transition-colors text-muted-foreground/35 group-hover:text-muted-foreground/55" />
        <span className="min-w-0 flex-1 truncate leading-none italic text-muted-foreground/45 group-hover:text-muted-foreground/65">
          {summary || "thinking…"}
        </span>
      </button>

      <div
        className={cn(
          "grid transition-all duration-500 ease-in-out",
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <div className="mt-1 ml-1.5 border-l border-border/30 pl-4 text-muted-foreground/55 leading-relaxed [&>*+*]:mt-2 [&>*:first-child]:mt-0">
            <Markdown remarkPlugins={[remarkGfm]}>{thinking}</Markdown>
          </div>
        </div>
      </div>
    </div>
  )
})
