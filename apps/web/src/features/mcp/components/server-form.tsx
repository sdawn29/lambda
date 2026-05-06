import React, { useState, useEffect } from "react"
import {
  Plus,
  Trash2,
  Edit2,
  Loader2,
  CheckCircle,
  XCircle,
  Terminal,
  ChevronDown,
  Copy,
  Settings2,
  Wrench,
  Zap,
} from "lucide-react"

import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { Card, CardContent } from "@/shared/ui/card"
import { Input } from "@/shared/ui/input"
import { Separator } from "@/shared/ui/separator"
import { Textarea } from "@/shared/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/shared/ui/dialog"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/shared/ui/field"
import { Badge } from "@/shared/ui/badge"
import { cn } from "@/shared/lib/utils"
import type { McpServerConfig, ServerFormState } from "../types"
import { createEmptyServerForm, formStateToConfig, configToFormState } from "../types"
import { useSaveMcpSettings, useTestMcpConnection } from "../mutations"

// ── Environment Variable Row ──────────────────────────────────────────────────

interface EnvVarRowProps {
  envVar: { key: string; value: string }
  index: number
  onChange: (field: "key" | "value", value: string) => void
  onRemove: () => void
}

function EnvVarRow({ envVar, index, onChange, onRemove }: EnvVarRowProps) {
  const isSecret =
    envVar.key.toLowerCase().includes("token") ||
    envVar.key.toLowerCase().includes("key") ||
    envVar.key.toLowerCase().includes("secret")

  return (
    <div className="group flex items-center gap-2 rounded-md border bg-muted/30 px-2 py-1.5">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-muted text-[10px] font-medium text-muted-foreground">
        {index + 1}
      </span>
      <Input
        value={envVar.key}
        onChange={(e) => onChange("key", e.target.value)}
        placeholder="VARIABLE_NAME"
        className="h-6 flex-1 font-mono text-xs"
      />
      <span className="shrink-0 select-none text-xs text-muted-foreground">=</span>
      <Input
        value={envVar.value}
        onChange={(e) => onChange("value", e.target.value)}
        placeholder="value"
        className="h-6 flex-1 text-xs"
        type={isSecret ? "password" : "text"}
      />
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onRemove}
        className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
      >
        <Trash2 />
        <span className="sr-only">Remove variable</span>
      </Button>
    </div>
  )
}

// ── JSON Config Import ────────────────────────────────────────────────────────

interface JsonImportProps {
  onImport: (config: McpServerConfig) => void
}

function JsonImport({ onImport }: JsonImportProps) {
  const [jsonText, setJsonText] = useState("")
  const [error, setError] = useState("")
  const [expanded, setExpanded] = useState(false)

  function handleImport() {
    try {
      const parsed = JSON.parse(jsonText)
      if (parsed.name && parsed.command) {
        onImport(parsed as McpServerConfig)
        setJsonText("")
        setExpanded(false)
        setError("")
      } else {
        setError("Config must include 'name' and 'command' fields")
      }
    } catch {
      setError("Invalid JSON format")
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "flex w-full items-center justify-between px-4 py-3 text-xs font-medium transition-colors hover:bg-muted/50",
          expanded ? "bg-muted/50 text-foreground" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <span>Paste JSON Configuration</span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 transition-transform duration-200",
            expanded && "rotate-180"
          )}
        />
      </button>

      {expanded && (
        <div className="space-y-3 border-t p-4">
          <Textarea
            value={jsonText}
            onChange={(e) => {
              setJsonText(e.target.value)
              setError("")
            }}
            placeholder={'{\n  "name": "my-server",\n  "command": "npx",\n  "args": ["-y", "package-name"]\n}'}
            className="min-h-[100px] resize-none font-mono text-xs"
            rows={5}
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex items-center justify-between">
            <Button size="sm" onClick={handleImport} disabled={!jsonText.trim()}>
              Import
            </Button>
            {jsonText && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigator.clipboard.writeText(jsonText)}
              >
                <Copy />
                Copy
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Form Dialog ──────────────────────────────────────────────────────────

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
  const [showAdvanced, setShowAdvanced] = useState(false)

  useEffect(() => {
    if (formState.envVars.length > 0) {
      setShowAdvanced(true)
    }
  }, [formState.envVars.length])

  function updateField<K extends keyof ServerFormState>(
    key: K,
    value: ServerFormState[K]
  ) {
    setFormState({ ...formState, [key]: value })
    const next = { ...formErrors }
    delete (next as Record<string, string>)[key as string]
    setFormErrors(next)
  }

  function addEnvVar() {
    setFormState({
      ...formState,
      envVars: [...formState.envVars, { key: "", value: "" }],
    })
    setShowAdvanced(true)
  }

  function updateEnvVar(index: number, field: "key" | "value", value: string) {
    setFormState({
      ...formState,
      envVars: formState.envVars.map((v, i) =>
        i === index ? { ...v, [field]: value } : v
      ),
    })
  }

  function removeEnvVar(index: number) {
    setFormState({
      ...formState,
      envVars: formState.envVars.filter((_, i) => i !== index),
    })
  }

  const canTest = formState.name.trim() && formState.command.trim()
  const canSave = canTest && Object.keys(formErrors).length === 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl"
      >
        {/* Header */}
        <DialogHeader className="shrink-0 border-b px-5 pt-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border bg-muted/50">
              <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div>
              <DialogTitle>
                {server ? "Edit MCP Server" : "Add MCP Server"}
              </DialogTitle>
              <DialogDescription>
                Connect a Model Context Protocol server to extend the agent with additional tools.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable body */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="space-y-4 p-5">

            {/* Core config */}
            <Card>
              <CardContent className="flex flex-col gap-4 p-4">
                <FieldGroup>
                  <Field data-invalid={formErrors.name ? true : undefined}>
                    <FieldLabel htmlFor="server-name">
                      Server Name <span className="text-destructive">*</span>
                    </FieldLabel>
                    <FieldDescription>
                      Unique identifier — lowercase letters, numbers, hyphens, or underscores.
                    </FieldDescription>
                    <Input
                      id="server-name"
                      value={formState.name}
                      onChange={(e) => updateField("name", e.target.value)}
                      placeholder="my-mcp-server"
                      disabled={!!server}
                      autoFocus
                      className="mt-1.5"
                    />
                    {formErrors.name && (
                      <FieldError>{formErrors.name}</FieldError>
                    )}
                  </Field>

                  <Field data-invalid={formErrors.command ? true : undefined}>
                    <FieldLabel htmlFor="server-command">
                      Command <span className="text-destructive">*</span>
                    </FieldLabel>
                    <FieldDescription>
                      Executable to start the server — e.g. npx, node, python, uvx.
                    </FieldDescription>
                    <Input
                      id="server-command"
                      value={formState.command}
                      onChange={(e) => updateField("command", e.target.value)}
                      placeholder="npx"
                      className="mt-1.5"
                    />
                    {formErrors.command && (
                      <FieldError>{formErrors.command}</FieldError>
                    )}
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="server-args">Arguments</FieldLabel>
                    <FieldDescription>
                      Space-separated arguments passed to the command.
                    </FieldDescription>
                    <Input
                      id="server-args"
                      value={formState.args}
                      onChange={(e) => updateField("args", e.target.value)}
                      placeholder="-y @modelcontextprotocol/server-filesystem ./path"
                      className="mt-1.5 font-mono text-xs"
                    />
                  </Field>
                </FieldGroup>

                {formState.command && (
                  <div className="rounded-md border bg-muted/50 px-3 py-2.5">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Preview
                    </p>
                    <code className="break-all font-mono text-xs">
                      {formState.command}
                      {formState.args && ` ${formState.args}`}
                    </code>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Description */}
            <Field>
              <FieldLabel htmlFor="server-description">Description</FieldLabel>
              <FieldDescription>
                Short summary of what this server provides (optional).
              </FieldDescription>
              <Input
                id="server-description"
                value={formState.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="File system access with read/write capabilities"
                className="mt-1.5"
              />
            </Field>

            {/* Advanced Options */}
            <div className="overflow-hidden rounded-lg border">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className={cn(
                  "flex w-full items-center justify-between px-4 py-3 text-xs font-medium transition-colors hover:bg-muted/50",
                  showAdvanced
                    ? "bg-muted/50 text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-2">
                  <Settings2 className="h-3.5 w-3.5" />
                  Advanced Options
                </div>
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 transition-transform duration-200",
                    showAdvanced && "rotate-180"
                  )}
                />
              </button>

              {showAdvanced && (
                <div className="space-y-5 border-t p-4">
                  <Field>
                    <FieldLabel htmlFor="server-cwd">Working Directory</FieldLabel>
                    <FieldDescription>
                      Directory where the server process is launched.
                    </FieldDescription>
                    <Input
                      id="server-cwd"
                      value={formState.cwd}
                      onChange={(e) => updateField("cwd", e.target.value)}
                      placeholder="/path/to/directory"
                      className="mt-1.5 font-mono text-xs"
                    />
                  </Field>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-medium">Environment Variables</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          API keys, tokens, and secrets passed to the server process.
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={addEnvVar}
                        className="shrink-0"
                      >
                        <Plus />
                        Add Variable
                      </Button>
                    </div>

                    {formState.envVars.length > 0 ? (
                      <div className="space-y-1.5">
                        {formState.envVars.map((envVar, index) => (
                          <EnvVarRow
                            key={index}
                            envVar={envVar}
                            index={index}
                            onChange={(field, value) =>
                              updateEnvVar(index, field, value)
                            }
                            onRemove={() => removeEnvVar(index)}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-md border border-dashed px-4 py-5 text-center">
                        <p className="text-xs text-muted-foreground">
                          No environment variables configured.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* JSON Import */}
            <JsonImport
              onImport={(config) => setFormState(configToFormState(config))}
            />

            {/* Test Connection */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium">Test Connection</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Verify the server can be started successfully.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      testConnection.mutate(formStateToConfig(formState))
                    }
                    disabled={testConnection.isPending || !canTest}
                    className="shrink-0"
                  >
                    {testConnection.isPending ? (
                      <>
                        <Loader2 className="animate-spin" />
                        Testing…
                      </>
                    ) : (
                      <>
                        <Terminal />
                        Run Test
                      </>
                    )}
                  </Button>
                </div>

                {testConnection.data && (
                  <div className="mt-3">
                    <Alert
                      variant={testConnection.data.success ? "default" : "destructive"}
                      className="animate-in fade-in-50"
                    >
                      {testConnection.data.success ? (
                        <CheckCircle className="text-green-500" />
                      ) : (
                        <XCircle />
                      )}
                      <AlertDescription>
                        {testConnection.data.success ? (
                          <div>
                            <p className="font-medium text-foreground">
                              Connection successful
                            </p>
                            {testConnection.data.toolCount > 0 ? (
                              <p className="mt-0.5">
                                {testConnection.data.toolCount} tool
                                {testConnection.data.toolCount !== 1 ? "s" : ""} available
                                {testConnection.data.tools &&
                                  testConnection.data.tools.length > 0 && (
                                    <span className="text-muted-foreground">
                                      {" "}
                                      —{" "}
                                      {testConnection.data.tools
                                        .map((t) => t.name)
                                        .join(", ")}
                                    </span>
                                  )}
                              </p>
                            ) : (
                              <p className="mt-0.5">No tools available.</p>
                            )}
                          </div>
                        ) : (
                          <div>
                            <p className="font-medium">Connection failed</p>
                            <p className="mt-0.5 break-all">{testConnection.data.error}</p>
                          </div>
                        )}
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="shrink-0 border-t px-5 py-4">
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button onClick={onSave} disabled={!canSave || isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="animate-spin" />
                Saving…
              </>
            ) : server ? (
              "Update Server"
            ) : (
              "Add Server"
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
  tools?: Array<{ name: string; description?: string }>
  onEdit: () => void
  onDelete: () => void
}

export function ServerListItem({
  server,
  status,
  tools,
  onEdit,
  onDelete,
}: ServerListItemProps) {
  const hasTools = tools && tools.length > 0

  return (
    <div className="overflow-hidden rounded-lg border">
      {/* Main row */}
      <div className="group flex items-start justify-between gap-3 p-3 transition-colors hover:bg-muted/30">
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium">{server.name}</span>
            {status === undefined ? (
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground/40" />
            ) : status.connected ? (
              <Badge
                variant="secondary"
                className="h-4 border-green-500/20 bg-green-500/10 text-green-600 dark:text-green-400"
              >
                <CheckCircle />
                Connected
              </Badge>
            ) : (
              <Badge
                variant={status.error ? "destructive" : "outline"}
                className="h-4"
              >
                {status.error ? "Error" : "Disconnected"}
              </Badge>
            )}
          </div>

          <code className="truncate rounded bg-muted/50 px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
            {server.command} {server.args?.join(" ")}
          </code>

          {server.description && (
            <p className="text-xs text-muted-foreground">{server.description}</p>
          )}

          {status?.error && (
            <p className="text-xs text-destructive">{status.error}</p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <Button variant="ghost" size="icon-sm" onClick={onEdit} title="Edit server">
            <Edit2 />
            <span className="sr-only">Edit</span>
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onDelete}
            title="Remove server"
            className="text-destructive hover:text-destructive"
          >
            <Trash2 />
            <span className="sr-only">Remove</span>
          </Button>
        </div>
      </div>

      {/* Tool list — always visible when tools are available */}
      {hasTools ? (
        <div className="border-t">
          <div className="flex items-center gap-1.5 border-b bg-muted/30 px-3 py-1.5">
            <Wrench className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {tools.length} Tool{tools.length !== 1 ? "s" : ""}
            </span>
          </div>
          {tools.map((tool) => (
            <div
              key={tool.name}
              className="flex items-start gap-3 border-b bg-muted/10 px-3 py-2 last:border-b-0"
            >
              <div className="mt-px flex h-3.5 w-3.5 shrink-0 items-center justify-center">
                <Zap className="h-3 w-3 text-muted-foreground/60" />
              </div>
              <code className="shrink-0 font-mono text-xs font-medium text-foreground/80">
                {tool.name}
              </code>
              {tool.description && (
                <p className="min-w-0 text-xs leading-relaxed text-muted-foreground">
                  {tool.description}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : status?.connected && status.toolCount === 0 ? (
        <div className="flex items-center gap-1.5 border-t bg-muted/20 px-3 py-2">
          <Wrench className="h-3 w-3 text-muted-foreground/50" />
          <p className="text-xs text-muted-foreground">No tools exposed</p>
        </div>
      ) : null}
    </div>
  )
}

// ── Delete Confirmation Dialog ────────────────────────────────────────────────

interface DeleteConfirmDialogProps {
  open: boolean
  serverName: string | null
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteConfirmDialog({
  open,
  serverName,
  onConfirm,
  onCancel,
}: DeleteConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onCancel()
      }}
    >
      <DialogContent className="max-w-sm" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Delete Server</DialogTitle>
          <DialogDescription>
            Remove{" "}
            <span className="font-medium text-foreground">{serverName}</span>?
            This disconnects the server and removes its tools from the agent.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
  setShowDialog: (open: boolean) => void
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
        settings: {
          servers: servers.filter((s) => s.name !== serverToDelete),
        },
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
    setShowDialog,
    handleSave,
    handleDelete,
    confirmDelete,
    setFormState,
    setFormErrors,
  }
}

// ── Form Validation ───────────────────────────────────────────────────────────

export function validateForm(
  form: ServerFormState
): Record<string, string> {
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
