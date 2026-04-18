import { useEffect, useState } from "react"

import { cn } from "@/shared/lib/utils"
import { useThinkingPhrases } from "@/shared/lib/thinking-visibility"

const PHRASE_INTERVAL_MS = 2200

export function ThinkingIndicator({ className }: { className?: string }) {
  const phrases = useThinkingPhrases()
  const [phraseIndex, setPhraseIndex] = useState(0)

  useEffect(() => {
    setPhraseIndex(0)
  }, [phrases])

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches

    if (prefersReducedMotion) return

    const interval = window.setInterval(() => {
      setPhraseIndex((currentIndex) => (currentIndex + 1) % phrases.length)
    }, PHRASE_INTERVAL_MS)

    return () => window.clearInterval(interval)
  }, [phrases])

  const phrase = phrases[phraseIndex] ?? phrases[0]

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
