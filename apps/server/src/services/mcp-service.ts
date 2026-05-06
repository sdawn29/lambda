import { McpClient, createMcpClient, mcpToolToPiTool } from "@lamda/mcp"
import type { ToolDefinition } from "@mariozechner/pi-coding-agent"
import type { McpServerConfig } from "@lamda/mcp"

// ── Types ─────────────────────────────────────────────────────────────────────

export interface McpSettings {
  servers: McpServerConfig[]
}

// ── In-memory Storage ─────────────────────────────────────────────────────────

const settingsStore = new Map<string, McpSettings>()
const clientPool = new Map<string, Map<string, McpClient>>()

// ── Settings Management ──────────────────────────────────────────────────────

export function getMcpSettings(workspaceId: string): McpSettings {
  return settingsStore.get(workspaceId) ?? { servers: [] }
}

export function saveMcpSettings(workspaceId: string, settings: McpSettings): void {
  removeAllClients(workspaceId)
  settingsStore.set(workspaceId, settings)
}

export function deleteMcpSettings(workspaceId: string): void {
  removeAllClients(workspaceId)
  settingsStore.delete(workspaceId)
}

// ── Client Pool ──────────────────────────────────────────────────────────────

function getClient(workspaceId: string, config: McpServerConfig): McpClient {
  let pool = clientPool.get(workspaceId) ?? new Map()
  let client = pool.get(config.name)
  if (!client) {
    client = createMcpClient()
    pool.set(config.name, client)
  }
  if (!clientPool.has(workspaceId)) clientPool.set(workspaceId, pool)
  return client
}

function removeAllClients(workspaceId: string): void {
  clientPool.get(workspaceId)?.forEach((c) => c.disconnectAll())
  clientPool.delete(workspaceId)
}

// ── Server Status ────────────────────────────────────────────────────────────

export async function getMcpServerStatus(workspaceId: string) {
  const { servers } = getMcpSettings(workspaceId)
  return Promise.all(servers.map(async (s) => {
    try {
      const client = getClient(workspaceId, s)
      if (!client.isConnected(s.name)) await client.connect(s)
      const tools = await client.listTools()
      return { name: s.name, connected: true, toolCount: tools.length }
    } catch (e) {
      return { name: s.name, connected: false, toolCount: 0, error: String(e) }
    }
  }))
}

export async function getMcpTools(workspaceId: string) {
  const { servers } = getMcpSettings(workspaceId)
  const tools: Array<{ name: string; description?: string; serverName: string }> = []

  for (const s of servers) {
    try {
      const client = getClient(workspaceId, s)
      if (!client.isConnected(s.name)) {
        await client.connect(s)
      }
      const mcpTools = await client.listTools()
      for (const tool of mcpTools) {
        tools.push({ name: tool.name, description: tool.description, serverName: s.name })
      }
    } catch (e) {
      console.warn(`[MCP] Failed to list tools from ${s.name}:`, e)
    }
  }

  return tools
}

export async function testMcpConnection(server: McpServerConfig) {
  const client = createMcpClient()
  try {
    await client.connect(server)
    const tools = await client.listTools()
    return { success: true, toolCount: tools.length, tools: tools.map((t) => ({ name: t.name, description: t.description })) }
  } catch (e) {
    return { success: false, toolCount: 0, error: String(e) }
  } finally {
    await client.disconnectAll()
  }
}

// ── Tool Conversion for pi ───────────────────────────────────────────────────

export async function getMcpToolsForSession(workspaceId: string): Promise<ToolDefinition[]> {
  const { servers } = getMcpSettings(workspaceId)
  const tools: ToolDefinition[] = []

  for (const config of servers) {
    try {
      const client = getClient(workspaceId, config)
      if (!client.isConnected(config.name)) await client.connect(config)
      const mcpTools = await client.listTools()

      for (const tool of mcpTools) {
        tools.push(mcpToolToPiTool(tool, async (name, params) => {
          const result = await client.callTool(name, params)
          return { success: result.success, content: result.content as Array<{ type: "text"; text: string }>, error: result.error }
        }))
      }
    } catch (e) {
      console.error(`[MCP] Failed to load tools from ${config.name}:`, e)
    }
  }

  return tools
}