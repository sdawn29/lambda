import { apiFetch } from "@/shared/lib/client"
import type { McpServerConfig } from "./types"

// ── MCP Settings ────────────────────────────────────────────────────────────────

export type McpToolList = Array<{ name: string; description?: string }>

export type McpSettings = Record<string, McpServerConfig[]>

/**
 * Fetch MCP settings for the current workspace
 */
export async function fetchMcpSettings(
  workspaceId: string,
  signal?: AbortSignal
): Promise<McpSettings> {
  const res = await apiFetch<{ settings: McpSettings }>(
    `/mcp/settings/${encodeURIComponent(workspaceId)}`,
    { signal }
  )
  return res.settings
}

/**
 * Save MCP settings for a workspace
 */
export async function saveMcpSettings(
  workspaceId: string,
  settings: McpSettings
): Promise<void> {
  await apiFetch(`/mcp/settings/${encodeURIComponent(workspaceId)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ settings }),
  })
}

/**
 * List available tools from connected MCP servers
 */
export async function fetchMcpTools(
  workspaceId: string,
  signal?: AbortSignal
): Promise<Array<{ serverName: string; name: string; description?: string }>> {
  const res = await apiFetch<{ tools: Array<{ serverName: string; name: string; description?: string }> }>(
    `/mcp/tools/${encodeURIComponent(workspaceId)}`,
    { signal }
  )
  return res.tools
}

/**
 * Test connecting to an MCP server
 */
export async function testMcpConnection(
  server: McpServerConfig
): Promise<{ success: boolean; toolCount: number; tools?: Array<{ name: string; description?: string }>; error?: string }> {
  const res = await apiFetch<{
    success: boolean
    toolCount: number
    tools?: Array<{ name: string; description?: string }>
    error?: string
  }>("/mcp/test-connection", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ server }),
  })
  return res
}

/**
 * Get MCP server status for a workspace
 */
export async function fetchMcpServerStatus(
  workspaceId: string,
  signal?: AbortSignal
): Promise<Array<{ name: string; connected: boolean; toolCount: number; error?: string; enabled?: boolean }>> {
  const res = await apiFetch<{ servers: Array<{ name: string; connected: boolean; toolCount: number; error?: string; enabled?: boolean }> }>(
    `/mcp/status/${encodeURIComponent(workspaceId)}`,
    { signal }
  )
  return res.servers
}

/**
 * Start an MCP server
 */
export async function startMcpServer(
  workspaceId: string,
  serverName: string
): Promise<{ success: boolean; error?: string; toolCount?: number }> {
  const res = await apiFetch<{ success: boolean; error?: string; toolCount?: number }>(
    `/mcp/start/${encodeURIComponent(workspaceId)}/${encodeURIComponent(serverName)}`,
    { method: "POST" }
  )
  return res
}

/**
 * Stop an MCP server
 */
export async function stopMcpServer(
  workspaceId: string,
  serverName: string
): Promise<{ success: boolean; error?: string }> {
  const res = await apiFetch<{ success: boolean; error?: string }>(
    `/mcp/stop/${encodeURIComponent(workspaceId)}/${encodeURIComponent(serverName)}`,
    { method: "POST" }
  )
  return res
}

/**
 * Enable or disable an MCP server
 */
export async function setMcpServerEnabled(
  workspaceId: string,
  serverName: string,
  enabled: boolean
): Promise<void> {
  await apiFetch(`/mcp/enabled/${encodeURIComponent(workspaceId)}/${encodeURIComponent(serverName)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ enabled }),
  })
}