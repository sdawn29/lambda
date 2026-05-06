import { Server, Plus, Info } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { useMcpSettings, useMcpServerStatus } from "../queries"
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
  const saveSettings = useSaveMcpSettings()
  const servers = settings?.servers ?? []

  const { showDialog, editingServer, formState, formErrors, serverToDelete, openAddDialog,
    openEditDialog, handleSave, handleDelete, confirmDelete, setFormState, setFormErrors } =
    useServerManagement({ workspaceId, servers, saveSettings })

  function getStatus(name: string) {
    return serverStatus?.find((s) => s.name === name)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              MCP Servers
            </DialogTitle>
            <DialogDescription>
              Configure Model Context Protocol servers to enable additional tools for the agent.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
              </div>
            ) : servers.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <Server className="h-10 w-10 text-muted-foreground/40" />
                <div>
                  <p className="text-sm font-medium">No MCP servers configured</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Add a server to enable additional tools for the agent
                  </p>
                </div>
                <Button size="sm" onClick={openAddDialog}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Add Server
                </Button>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-3 py-4">
                  {servers.map((server) => (
                    <ServerListItem
                      key={server.name}
                      server={server}
                      status={getStatus(server.name)}
                      onEdit={() => openEditDialog(server)}
                      onDelete={() => handleDelete(server.name)}
                    />
                  ))}
                </div>
                <div className="flex justify-center">
                  <Button size="sm" variant="outline" onClick={openAddDialog}>
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Add Server
                  </Button>
                </div>
              </>
            )}

            <Alert variant="outline" className="mt-4">
              <Info className="h-3.5 w-3.5" />
              <AlertDescription className="text-xs">
                MCP servers are configured per-workspace. Tools from connected servers are automatically available to the agent.
              </AlertDescription>
            </Alert>
          </div>
        </DialogContent>
      </Dialog>

      <FormDialog
        open={showDialog}
        onOpenChange={(v) => { if (!v) handleSave() }}
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