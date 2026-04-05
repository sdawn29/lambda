import { createRootRoute, Outlet } from "@tanstack/react-router"
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools"

import { AppSidebar } from "@/components/app-sidebar"
import { TitleBar } from "@/components/title-bar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { WorkspaceEmptyState } from "@/components/workspace-empty-state"
import { WorkspaceProvider, useWorkspace } from "@/hooks/workspace-context"

function RootLayoutInner() {
  const { workspaces, isLoading } = useWorkspace()
  const hasWorkspaces = workspaces.length > 0

  if (isLoading) {
    return (
      <TooltipProvider>
        <div className="flex h-svh items-center justify-center">
          <p className="text-muted-foreground text-sm">Loading…</p>
        </div>
      </TooltipProvider>
    )
  }

  if (!hasWorkspaces) {
    return (
      <TooltipProvider>
        <div className="flex h-svh flex-col">
          <WorkspaceEmptyState />
        </div>
      </TooltipProvider>
    )
  }

  return (
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
}

const RootLayout = () => (
  <WorkspaceProvider>
    <RootLayoutInner />
  </WorkspaceProvider>
)

export const Route = createRootRoute({ component: RootLayout })
