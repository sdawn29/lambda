import { FolderOpen, MessageSquare, Plus } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { useWorkspace } from "@/hooks/workspace-context"

export function AppSidebar() {
  const {
    workspaces,
    activeWorkspace,
    activeThread,
    selectWorkspace,
    createWorkspace,
    createThread,
    selectThread,
  } = useWorkspace()

  async function handleCreateWorkspace() {
    const folderPath = await window.electronAPI?.selectFolder()
    if (folderPath) {
      const folderName = folderPath.split(/[/\\]/).pop() || folderPath
      createWorkspace(folderName, folderPath)
    }
  }

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarContent className="mt-10">
        <SidebarGroup>
          <div className="flex items-center justify-between">
            <SidebarGroupLabel>
              <span className="font-serif">Workspaces</span>
            </SidebarGroupLabel>
            <Button variant="ghost" size="icon" onClick={handleCreateWorkspace}>
              <Plus />
            </Button>
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {workspaces.length === 0 ? (
                <div className="my-2 text-center text-muted-foreground">
                  No workspaces available
                </div>
              ) : (
                workspaces.map((ws) => (
                  <SidebarMenuItem key={ws.id}>
                    <div className="group/ws flex items-center">
                      <SidebarMenuButton
                        isActive={activeWorkspace?.id === ws.id}
                        onClick={() => selectWorkspace(ws)}
                        tooltip={ws.name}
                        className="flex-1"
                      >
                        <FolderOpen />
                        <span>{ws.name}</span>
                      </SidebarMenuButton>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0 opacity-0 transition-opacity group-hover/ws:opacity-100"
                        onClick={() => createThread(ws.id)}
                        title="New Thread"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    {ws.threads.length > 0 && (
                      <SidebarMenuSub>
                        {ws.threads.map((thread) => (
                          <SidebarMenuSubItem key={thread.id}>
                            <SidebarMenuSubButton
                              isActive={activeThread?.id === thread.id}
                              onClick={() => selectThread(ws.id, thread)}
                            >
                              <MessageSquare className="h-3 w-3 shrink-0" />
                              <span className="truncate">{thread.title}</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    )}
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarFooter />
      </SidebarContent>
    </Sidebar>
  )
}
