import { useEffect, useState } from "react"

import { cn } from "@/shared/lib/utils"

const PHRASES = [
  "Thinking...",
  "Sketching the plan...",
  "Checking the details...",
  "Pulling the pieces together...",
  "Polishing the answer...",
]

const PHRASE_INTERVAL_MS = 2200

export function ThinkingIndicator({ className }: { className?: string }) {
  const [phraseIndex, setPhraseIndex] = useState(0)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches

    if (prefersReducedMotion) return

    const interval = window.setInterval(() => {
      setPhraseIndex((currentIndex) => (currentIndex + 1) % PHRASES.length)
    }, PHRASE_INTERVAL_MS)

    return () => window.clearInterval(interval)
  }, [])

  const phrase = PHRASES[phraseIndex]

  return (
    <div
      className={cn(
        "flex animate-in items-center self-start py-1 duration-200 fade-in-0",
        className
      )}
      aria-live="polite"
      aria-label={phrase}
    >
      <span
        key={phrase}
        className="animate-thinking-shimmer bg-linear-to-r from-muted-foreground/40 via-foreground to-muted-foreground/40 bg-size-[200%_100%] bg-clip-text text-sm font-medium text-transparent"
      >
        {phrase}
      </span>
    </div>
  )
}
