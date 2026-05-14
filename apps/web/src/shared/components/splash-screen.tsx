export function SplashScreen() {
  return (
    <div className="flex h-svh w-full flex-col items-center justify-center bg-background animate-in fade-in duration-300">
      <div className="flex flex-col items-center gap-3">
        <div className="flex size-20 items-center justify-center rounded-2xl bg-[#1c1c1c] shadow-xl ring-1 ring-white/5">
          <span
            className="select-none font-heading text-6xl font-black leading-none"
            style={{ color: "#d4a017" }}
          >
            Λ
          </span>
        </div>
        <p className="font-heading text-sm font-semibold tracking-[0.4em] text-foreground/50 uppercase">
          lamda
        </p>
        <div className="mt-3 flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-muted-foreground/30 animate-bounce [animation-delay:-0.3s]" />
          <span className="size-1.5 rounded-full bg-muted-foreground/30 animate-bounce [animation-delay:-0.15s]" />
          <span className="size-1.5 rounded-full bg-muted-foreground/30 animate-bounce" />
        </div>
      </div>
    </div>
  )
}
