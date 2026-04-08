import { useState } from "react"
import { CheckIcon, CopyIcon } from "lucide-react"

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      aria-label="Copy message"
      onClick={() => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }}
      className="flex size-6 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-foreground/8 hover:text-foreground"
    >
      {copied ? (
        <CheckIcon className="size-3.5 text-green-500" />
      ) : (
        <CopyIcon className="size-3.5" />
      )}
    </button>
  )
}
