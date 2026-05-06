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

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          showCloseButton
          className="flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl"
        >
          <DialogHeader className="shrink-0 border-b px-5 pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border bg-muted/50">
                <Server className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div>
                <DialogTitle>MCP Servers</DialogTitle>
                <DialogDescription>
                  Configure Model Context Protocol servers to enable additional tools.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="space-y-3 p-5">
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
                    <Plus />
                    Add Server
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
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
              )}

              <Alert>
                <Info />
                <AlertDescription>
                  MCP servers are configured per-workspace. Connected tools are automatically available to the agent.
                </AlertDescription>
              </Alert>
            </div>
          </div>

          {servers.length > 0 && (
            <div className="shrink-0 border-t px-5 py-4">
              <div className="flex justify-end">
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
