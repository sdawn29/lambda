import React, { useState } from "react"
import { Plus, Trash2, Edit2, Loader2, CheckCircle, XCircle, Terminal } from "lucide-react"

import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/shared/ui/dialog"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/shared/ui/field"
import type { McpServerConfig, ServerFormState } from "../types"
import { createEmptyServerForm, formStateToConfig, configToFormState } from "../types"
import { useSaveMcpSettings } from "../mutations"

// ── Shared Server Form Dialog ──────────────────────────────────────────────────

interface ServerFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  server: McpServerConfig | null
  formState: ServerFormState
  setFormState: (state: ServerFormState) => void
  formErrors: Record<string, string>
  setFormErrors: (errors: Record<string, string>) => void
  onSave: () => void
  isSaving: boolean
}

export function FormDialog({
  open,
  onOpenChange,
  server,
  formState,
  setFormState,
  formErrors,
  setFormErrors,
  onSave,
  isSaving,
}: ServerFormDialogProps) {
  const testConnection = useTestMcpConnection()

  function updateField<K extends keyof ServerFormState>(key: K, value: ServerFormState[K]) {
    setFormState((prev) => ({ ...prev, [key]: value }))
    setFormErrors((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  function addEnvVar() {
    setFormState((prev) => ({ ...prev, envVars: [...prev.envVars, { key: "", value: "" }] }))
  }

  function updateEnvVar(index: number, field: "key" | "value", value: string) {
    setFormState((prev) => ({
      ...prev,
      envVars: prev.envVars.map((v, i) => (i === index ? { ...v, [field]: value } : v)),
    }))
  }

  function removeEnvVar(index: number) {
    setFormState((prev) => ({ ...prev, envVars: prev.envVars.filter((_, i) => i !== index) }))
  }

  function handleTestConnection() {
    testConnection.mutate(formStateToConfig(formState))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{server ? "Edit MCP Server" : "Add MCP Server"}</DialogTitle>
          <DialogDescription>
            Configure a Model Context Protocol server to enable additional tools for the agent.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* Name */}
          <Field data-invalid={formErrors.name || undefined}>
            <FieldLabel htmlFor="server-name">Server Name</FieldLabel>
            <FieldDescription>A unique identifier for this server</FieldDescription>
            <Input
              id="server-name"
              value={formState.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="filesystem"
              disabled={!!server}
            />
            {formErrors.name && <FieldError>{formErrors.name}</FieldError>}
          </Field>

          {/* Command */}
          <Field data-invalid={formErrors.command || undefined}>
            <FieldLabel htmlFor="server-command">Command</FieldLabel>
            <FieldDescription>The command to run the server</FieldDescription>
            <Input
              id="server-command"
              value={formState.command}
              onChange={(e) => updateField("command", e.target.value)}
              placeholder="npx"
            />
            {formErrors.command && <FieldError>{formErrors.command}</FieldError>}
          </Field>

          {/* Args */}
          <Field>
            <FieldLabel htmlFor="server-args">Arguments</FieldLabel>
            <FieldDescription>Arguments passed to the command (space-separated)</FieldDescription>
            <Input
              id="server-args"
              value={formState.args}
              onChange={(e) => updateField("args", e.target.value)}
              placeholder="-y @modelcontextprotocol/server-filesystem ./"
            />
          </Field>

          {/* Working Directory */}
          <Field>
            <FieldLabel htmlFor="server-cwd">Working Directory</FieldLabel>
            <FieldDescription>Optional working directory for the server process</FieldDescription>
            <Input
              id="server-cwd"
              value={formState.cwd}
              onChange={(e) => updateField("cwd", e.target.value)}
              placeholder="/path/to/directory"
            />
          </Field>

          {/* Environment Variables */}
          <FieldGroup>
            <div className="flex items-center justify-between">
              <FieldLabel>Environment Variables</FieldLabel>
              <Button variant="ghost" size="sm" onClick={addEnvVar}>
                <Plus className="h-3 w-3" />
                Add
              </Button>
            </div>
            {formState.envVars.length > 0 ? (
              <div className="flex flex-col gap-2">
                {formState.envVars.map((envVar, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={envVar.key}
                      onChange={(e) => updateEnvVar(index, "key", e.target.value)}
                      placeholder="KEY"
                      className="w-32"
                    />
                    <span className="text-muted-foreground">=</span>
                    <Input
                      value={envVar.value}
                      onChange={(e) => updateEnvVar(index, "value", e.target.value)}
                      placeholder="value"
                      className="flex-1"
                    />
                    <Button variant="ghost" size="icon-sm" onClick={() => removeEnvVar(index)}>
                      <X />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No environment variables configured</p>
            )}
          </FieldGroup>

          {/* Description */}
          <Field>
            <FieldLabel htmlFor="server-description">Description</FieldLabel>
            <FieldDescription>Optional description for this server</FieldDescription>
            <Input
              id="server-description"
              value={formState.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="Access local filesystem with read/write capabilities"
            />
          </Field>

          {/* Test Connection */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleTestConnection}
            disabled={testConnection.isPending || !formState.name || !formState.command}
          >
            {testConnection.isPending ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Testing…
              </>
            ) : (
              <>
                <Terminal className="mr-1.5 h-3.5 w-3.5" />
                Test Connection
              </>
            )}
          </Button>

          {testConnection.data && (
            <Alert variant={testConnection.data.success ? "default" : "destructive"}>
              {testConnection.data.success ? (
                <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500" />
              ) : (
                <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              )}
              <AlertDescription className="text-xs">
                {testConnection.data.success ? (
                  <>
                    <span className="font-medium">Connection successful!</span>{" "}
                    {testConnection.data.toolCount === 0
                      ? "No tools found."
                      : `Found ${testConnection.data.toolCount} tool${testConnection.data.toolCount !== 1 ? "s" : ""}.`}
                  </>
                ) : (
                  testConnection.data.error
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button onClick={onSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                {server ? "Update" : "Add"} Server
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Shared Server List Item ───────────────────────────────────────────────────

interface ServerListItemProps {
  server: McpServerConfig
  status?: { connected: boolean; toolCount: number; error?: string }
  onEdit: () => void
  onDelete: () => void
}

export function ServerListItem({ server, status, onEdit, onDelete }: ServerListItemProps) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border p-3">
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{server.name}</span>
          {status === undefined ? (
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
          ) : status.connected ? (
            <CheckCircle className="h-3 w-3 text-green-500" />
          ) : (
            <XCircle className={status.error ? "h-3 w-3 text-destructive" : "h-3 w-3 text-muted-foreground"} />
          )}
        </div>
        <p className="truncate font-mono text-xs text-muted-foreground">
          {server.command} {server.args?.join(" ")}
        </p>
        {server.description && <p className="text-xs text-muted-foreground">{server.description}</p>}
        {status?.error && <p className="truncate text-xs text-destructive">{status.error}</p>}
        {status?.connected && (
          <p className="text-xs text-muted-foreground">
            {status.toolCount} tool{status.toolCount !== 1 ? "s" : ""} available
          </p>
        )}
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon-sm" onClick={onEdit} title="Edit server">
          <Edit2 />
          <span className="sr-only">Edit</span>
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={onDelete} title="Remove server">
          <Trash2 />
          <span className="sr-only">Remove</span>
        </Button>
      </div>
    </div>
  )
}

// ── Shared Hook for Server Management ────────────────────────────────────────

interface UseServerManagementProps {
  workspaceId: string
  servers: McpServerConfig[]
  saveSettings: ReturnType<typeof useSaveMcpSettings>
}

interface UseServerManagementReturn {
  showDialog: boolean
  editingServer: McpServerConfig | null
  formState: ServerFormState
  formErrors: Record<string, string>
  serverToDelete: string | null
  openAddDialog: () => void
  openEditDialog: (server: McpServerConfig) => void
  closeDialog: () => void
  handleSave: () => void
  handleDelete: (serverName: string) => void
  confirmDelete: () => void
  setFormState: React.Dispatch<React.SetStateAction<ServerFormState>>
  setFormErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>
}

export function useServerManagement({
  workspaceId,
  servers,
  saveSettings,
}: UseServerManagementProps): UseServerManagementReturn {
  const [showDialog, setShowDialog] = useState(false)
  const [editingServer, setEditingServer] = useState<McpServerConfig | null>(null)
  const [formState, setFormState] = useState<ServerFormState>(createEmptyServerForm)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [serverToDelete, setServerToDelete] = useState<string | null>(null)

  function openAddDialog() {
    setEditingServer(null)
    setFormState(createEmptyServerForm())
    setFormErrors({})
    setShowDialog(true)
  }

  function openEditDialog(server: McpServerConfig) {
    setEditingServer(server)
    setFormState(configToFormState(server))
    setFormErrors({})
    setShowDialog(true)
  }

  function closeDialog() {
    setShowDialog(false)
  }

  function handleSave() {
    const errors = validateForm(formState)
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    const newConfig = formStateToConfig(formState)
    const updatedServers = editingServer
      ? servers.map((s) => (s.name === editingServer.name ? newConfig : s))
      : [...servers.filter((s) => s.name !== newConfig.name), newConfig]

    saveSettings.mutate({ workspaceId, settings: { servers: updatedServers } })
    setShowDialog(false)
  }

  function handleDelete(serverName: string) {
    setServerToDelete(serverName)
  }

  function confirmDelete() {
    if (serverToDelete) {
      saveSettings.mutate({
        workspaceId,
        settings: { servers: servers.filter((s) => s.name !== serverToDelete) },
      })
    }
    setServerToDelete(null)
  }

  return {
    showDialog,
    editingServer,
    formState,
    formErrors,
    serverToDelete,
    openAddDialog,
    openEditDialog,
    closeDialog,
    handleSave,
    handleDelete,
    confirmDelete,
    setFormState,
    setFormErrors,
  }
}

// ── Form Validation ───────────────────────────────────────────────────────────

export function validateForm(form: ServerFormState): Record<string, string> {
  const errors: Record<string, string> = {}

  if (!form.name.trim()) {
    errors.name = "Server name is required"
  } else if (!/^[a-zA-Z0-9_-]+$/.test(form.name)) {
    errors.name = "Only letters, numbers, underscores, and hyphens allowed"
  }

  if (!form.command.trim()) {
    errors.command = "Command is required"
  }

  return errors
}