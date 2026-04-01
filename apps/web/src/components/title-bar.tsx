import { ChevronLeft, ChevronRight } from "lucide-react"
import { useRouter } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"

const isMac =
  typeof window !== "undefined" && window.electronAPI?.platform === "darwin"

export function TitleBar() {
  const router = useRouter()

  return (
    <div
      className="sticky top-0 z-20 flex h-12 shrink-0 items-center bg-transparent"
      style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
    >
      <div
        className={`flex items-center gap-1 ${isMac ? "pl-20" : "pl-2"}`}
        style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
      >
        <SidebarTrigger />
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => router.history.back()}
        >
          <ChevronLeft />
          <span className="sr-only">Go back</span>
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => router.history.forward()}
        >
          <ChevronRight />
          <span className="sr-only">Go forward</span>
        </Button>
      </div>
    </div>
  )
}
