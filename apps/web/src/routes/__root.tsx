import { createRootRoute, Outlet } from "@tanstack/react-router"
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools"

import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"

const RootLayout = () => (
  <TooltipProvider>
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 px-4"></header>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
    <TanStackRouterDevtools />
  </TooltipProvider>
)

export const Route = createRootRoute({ component: RootLayout })
