import { Plug, Plus, Server } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { Badge } from "@/shared/ui/badge"
import { useMcpSettings, useMcpServerStatus, useMcpTools } from "../queries"
import { useSaveMcpSettings } from "../mutations"
import { ServerListItem, useServerManagement } from "./server-form"
import { FormDialog, DeleteConfirmDialog } from "./server-form"

interface McpDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId?: string
}

export function McpDialog({ open, onOpenChange, workspaceId = "default" }: McpDialogProps) {
  const { data: settings, isLoading } = useMcpSettings(workspaceId)
  const { data: serverStatus } = useMcpServerStatus(workspaceId)
  const { data: allTools } = useMcpTools(workspaceId)
  const saveSettings = useSaveMcpSettings()
  const servers = settings?.servers ?? []
  const connectedCount = serverStatus?.filter((s) => s.connected).length ?? 0

  const {
    showDialog,
    setShowDialog,
    editingServer,
    formState,
    formErrors,
    serverToDelete,
    openAddDialog,
    openEditDialog,
    handleSave,
    handleDelete,
    confirmDelete,
    setFormState,
    setFormErrors,
  } = useServerManagement({ workspaceId, servers, saveSettings })

  function getStatus(name: string) {
    return serverStatus?.find((s) => s.name === name)
  }

  function getServerTools(name: string) {
    return allTools?.filter((t) => t.serverName === name)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          showCloseButton
          className="flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl"
        >
          <DialogHeader className="shrink-0 border-b px-5 pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border bg-primary/5">
                <Plug className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <DialogTitle>MCP Servers</DialogTitle>
                  {servers.length > 0 && (
                    <Badge variant="outline" className="font-mono tabular-nums">
                      {connectedCount}/{servers.length} connected
                    </Badge>
                  )}
                </div>
                <DialogDescription className="mt-0.5">
                  Connect external tools to the agent via Model Context Protocol.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
              </div>
            ) : servers.length === 0 ? (
              <div className="flex flex-col items-center gap-4 px-8 py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-dashed border-muted-foreground/20 bg-muted/30">
                  <Server className="h-6 w-6 text-muted-foreground/30" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">No servers configured</p>
                  <p className="max-w-xs text-xs text-muted-foreground">
                    MCP servers extend the agent with tools — file access, web search, databases, APIs, and more.
                  </p>
                </div>
                <Button size="sm" onClick={openAddDialog}>
                  <Plus />
                  Add your first server
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 p-4">
                {servers.map((server) => (
                  <ServerListItem
                    key={server.name}
                    server={server}
                    workspaceId={workspaceId}
                    status={getStatus(server.name)}
                    tools={getServerTools(server.name)}
                    onEdit={() => openEditDialog(server)}
                    onDelete={() => handleDelete(server.name)}
                  />
                ))}
              </div>
            )}
          </div>

          {servers.length > 0 && (
            <div className="shrink-0 border-t px-5 py-3">
              <div className="flex items-center justify-between gap-4">
                <p className="text-[11px] text-muted-foreground">
                  Servers are scoped to this workspace
                </p>
                <Button size="sm" onClick={openAddDialog}>
                  <Plus />
                  Add Server
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <FormDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        server={editingServer}
        formState={formState}
        setFormState={setFormState}
        formErrors={formErrors}
        setFormErrors={setFormErrors}
        onSave={handleSave}
        isSaving={saveSettings.isPending}
      />

      <DeleteConfirmDialog
        open={!!serverToDelete}
        serverName={serverToDelete}
        onConfirm={confirmDelete}
        onCancel={() => handleDelete("")}
      />
    </>
  )
}
