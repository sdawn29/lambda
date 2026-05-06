/**
 * MCP types for connecting to Model Context Protocol servers
 */

/**
 * Configuration for an MCP server connection
 */
export interface McpServerConfig {
  /** Unique name for this server */
  name: string;
  /** Command to run (e.g., "npx", "node", "python") */
  command: string;
  /** Arguments to pass to the command */
  args?: string[];
  /** Environment variables */
  env?: Record<string, string>;
  /** Working directory for the server process */
  cwd?: string;
}

/**
 * MCP server discovery configuration
 * Supports standard mcp.json format
 */
export interface McpDiscoveryConfig {
  /** Array of server configurations */
  servers: McpServerConfig[];
}

/**
 * A tool exposed by an MCP server
 */
export interface McpTool {
  /** Unique name including server prefix (e.g., "filesystem/readFile") */
  name: string;
  /** Human-readable description */
  description?: string;
  /** Server name this tool belongs to */
  serverName: string;
  /** Original MCP tool name */
  originalName: string;
  /** JSON schema for tool input */
  inputSchema: {
    type: "object";
    properties?: Record<string, unknown>;
    required?: string[];
  };
}

/**
 * Connection state for an MCP server
 */
export interface McpServerState {
  /** Server configuration */
  config: McpServerConfig;
  /** Whether the server is currently connected */
  connected: boolean;
  /** Error message if connection failed */
  error?: string;
  /** Last error timestamp */
  lastErrorAt?: number;
}

/**
 * MCP client events
 */
export type McpEventType =
  | "server_connected"
  | "server_disconnected"
  | "server_error"
  | "tool_called"
  | "tool_result";

export interface McpEvent {
  type: McpEventType;
  serverName: string;
  toolName?: string;
  data?: unknown;
  error?: string;
  timestamp: number;
}

export interface McpServerConnectedEvent extends McpEvent {
  type: "server_connected";
  serverName: string;
}

export interface McpServerDisconnectedEvent extends McpEvent {
  type: "server_disconnected";
  serverName: string;
}

export interface McpServerErrorEvent extends McpEvent {
  type: "server_error";
  serverName: string;
  error: string;
}

export interface McpToolCalledEvent extends McpEvent {
  type: "tool_called";
  toolName: string;
  data: Record<string, unknown>;
}

export interface McpToolResultEvent extends McpEvent {
  type: "tool_result";
  toolName: string;
  data: unknown;
}

/**
 * Result of executing an MCP tool
 */
export interface McpToolResult {
  /** Whether the tool call was successful */
  success: boolean;
  /** Tool output content */
  content: Array<{ type: "text"; text: string } | { type: "image"; data: string; mimeType: string }>;
  /** Additional metadata */
  details?: Record<string, unknown>;
  /** Error message if failed */
  error?: string;
}

/**
 * Event handler types for MCP events
 */
export type McpEventHandler = (event: McpEvent) => void | Promise<void>;
