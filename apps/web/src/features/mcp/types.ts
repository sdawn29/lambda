/**
 * MCP server configuration types
 */

/**
 * Configuration for an MCP server connection
 */
export interface McpServerConfig {
  /** Unique name for this server */
  name: string
  /** Command to run (e.g., "npx", "node", "python") */
  command: string
  /** Arguments to pass to the command */
  args?: string[]
  /** Environment variables */
  env?: Record<string, string>
  /** Working directory for the server process */
  cwd?: string
  /** Optional description */
  description?: string
  /** Whether the server is enabled (default: true) */
  enabled?: boolean
}

/**
 * MCP server discovery configuration
 * Supports standard mcp.json format
 */
export interface McpDiscoveryConfig {
  /** Array of server configurations */
  servers: McpServerConfig[]
}

/**
 * A tool exposed by an MCP server
 */
export interface McpTool {
  /** Unique name including server prefix */
  name: string
  /** Human-readable description */
  description?: string
  /** Server name this tool belongs to */
  serverName: string
}

/**
 * MCP server connection state
 */
export interface McpServerState {
  /** Server name */
  name: string
  /** Whether the server is currently connected */
  connected: boolean
  /** Number of tools available */
  toolCount: number
  /** Error message if connection failed */
  error?: string
  /** Whether the server is enabled */
  enabled?: boolean
}

/**
 * Server edit form state
 */
export interface ServerFormState {
  name: string
  command: string
  args: string
  envVars: Array<{ key: string; value: string }>
  cwd: string
  description: string
}

/**
 * Default empty form state for adding a new server
 */
export function createEmptyServerForm(): ServerFormState {
  return {
    name: "",
    command: "npx",
    args: "",
    envVars: [],
    cwd: "",
    description: "",
  }
}

/**
 * Convert form state to server config
 */
export function formStateToConfig(form: ServerFormState): McpServerConfig {
  return {
    name: form.name,
    command: form.command,
    args: form.args ? form.args.split(" ").filter(Boolean) : undefined,
    env: form.envVars.length > 0
      ? Object.fromEntries(form.envVars.filter((v) => v.key && v.value).map(v => [v.key, v.value]))
      : undefined,
    cwd: form.cwd || undefined,
    description: form.description || undefined,
  }
}

/**
 * Convert server config to form state
 */
export function configToFormState(config: McpServerConfig): ServerFormState {
  return {
    name: config.name,
    command: config.command,
    args: config.args?.join(" ") ?? "",
    envVars: Object.entries(config.env ?? {}).map(([key, value]) => ({
      key,
      value,
    })),
    cwd: config.cwd ?? "",
    description: config.description ?? "",
  }
}