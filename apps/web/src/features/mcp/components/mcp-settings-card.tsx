import { Server, Plus, Info } from "lucide-react"
import { Card, CardContent } from "@/shared/ui/card"
import { Button } from "@/shared/ui/button"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Separator } from "@/shared/ui/separator"
import { useMcpSettings, useMcpServerStatus, useMcpTools } from "../queries"
import { useSaveMcpSettings } from "../mutations"
import { ServerListItem, useServerManagement } from "./server-form"
import { FormDialog, DeleteConfirmDialog } from "./server-form"

interface McpSettingsCardProps {
  workspaceId?: string
}

export function McpSettingsCard({ workspaceId = "default" }: McpSettingsCardProps) {
  const { data: settings, isLoading } = useMcpSettings(workspaceId)
  const { data: serverStatus } = useMcpServerStatus(workspaceId)
  const { data: allTools } = useMcpTools(workspaceId)
  const saveSettings = useSaveMcpSettings()
  const servers = settings?.servers ?? []

  const { showDialog, editingServer, formState, formErrors, serverToDelete, openAddDialog,
    openEditDialog, handleSave, handleDelete, confirmDelete, setFormState, setFormErrors } =
    useServerManagement({ workspaceId, servers, saveSettings })

  function getStatus(name: string) {
    return serverStatus?.find((s) => s.name === name)
  }

  function getServerTools(name: string) {
    return allTools?.filter((t) => t.serverName === name)
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardContent className="flex flex-col gap-4 p-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">MCP Servers</p>
                <p className="text-xs text-muted-foreground">Connect to Model Context Protocol servers</p>
              </div>
            </div>
            <Button size="sm" onClick={openAddDialog}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add Server
            </Button>
          </div>

          <Separator />

          {/* Server list */}
          {servers.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <Server className="h-8 w-8 text-muted-foreground/40" />
              <div>
                <p className="text-sm text-muted-foreground">No MCP servers configured</p>
                <p className="text-xs text-muted-foreground">Add a server to enable additional tools for the agent</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
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

          <Alert>
            <Info />
            <AlertDescription>
              MCP servers are configured per-workspace. Click the play/stop button to start or stop servers. Tools from connected servers are automatically available to the agent.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <FormDialog
        open={showDialog}
        onOpenChange={() => {}}
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