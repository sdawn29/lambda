// Components
export { McpDialog } from "./components/mcp-dialog"
export { McpSettingsCard } from "./components/mcp-settings-card"

// Shared UI components (shared between McpDialog and McpSettingsCard)
export { ServerListItem, FormDialog, DeleteConfirmDialog, useServerManagement, validateForm } from "./components/server-form"

// Types
export type {
  McpServerConfig,
  McpTool,
  McpServerState,
  ServerFormState,
} from "./types"
export {
  createEmptyServerForm,
  formStateToConfig,
  configToFormState,
} from "./types"

// Queries
export { useMcpSettings, useMcpServerStatus, useMcpTools, mcpKeys } from "./queries"

// Mutations
export { useSaveMcpSettings, useTestMcpConnection } from "./mutations"

// Context
export { McpProvider, useMcpContext } from "./context"

// API
export * from "./api"