export function ThinkingIndicator() {
  return (
    <div className="flex animate-in items-center gap-1 self-start py-1 duration-200 fade-in-0">
      <span
        className="animate-thinking-dot size-1.5 rounded-full bg-muted-foreground/60"
        style={{ animationDelay: "0ms" }}
      />
      <span
        className="animate-thinking-dot size-1.5 rounded-full bg-muted-foreground/60"
        style={{ animationDelay: "200ms" }}
      />
      <span
        className="animate-thinking-dot size-1.5 rounded-full bg-muted-foreground/60"
        style={{ animationDelay: "400ms" }}
      />
    </div>
  )
}
