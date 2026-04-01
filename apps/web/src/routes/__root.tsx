import { createRootRoute, Outlet } from "@tanstack/react-router"
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools"

import { AppSidebar } from "@/components/app-sidebar"
import { TitleBar } from "@/components/title-bar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"

const RootLayout = () => (
  <TooltipProvider>
    <SidebarProvider className="h-svh flex-col">
      <TitleBar />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <AppSidebar />
        <SidebarInset>
          <Outlet />
        </SidebarInset>
      </div>
    </SidebarProvider>
    <TanStackRouterDevtools />
  </TooltipProvider>
)

export const Route = createRootRoute({ component: RootLayout })
