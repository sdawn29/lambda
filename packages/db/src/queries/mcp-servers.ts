import { eq, and } from "drizzle-orm"
import { db } from "../client.js"
import { mcpServers } from "../schema.js"
import type { McpServerConfig } from "@lamda/mcp"

export interface DbMcpServer {
  id: string
  workspaceId: string
  name: string
  command: string
  args: string | null
  env: string | null
  cwd: string | null
  description: string | null
  enabled: boolean
  createdAt: number
}

/**
 * Get all MCP servers for a workspace
 */
export function getMcpServers(workspaceId: string): DbMcpServer[] {
  return db
    .select()
    .from(mcpServers)
    .where(eq(mcpServers.workspaceId, workspaceId))
    .all()
}

/**
 * Get enabled MCP servers for a workspace
 */
export function getEnabledMcpServers(workspaceId: string): DbMcpServer[] {
  return db
    .select()
    .from(mcpServers)
    .where(and(eq(mcpServers.workspaceId, workspaceId), eq(mcpServers.enabled, true)))
    .all()
}

/**
 * Get a single MCP server by name and workspace
 */
export function getMcpServer(workspaceId: string, name: string): DbMcpServer | undefined {
  return db
    .select()
    .from(mcpServers)
    .where(and(eq(mcpServers.workspaceId, workspaceId), eq(mcpServers.name, name)))
    .get()
}

/**
 * Create or update an MCP server
 */
export function upsertMcpServer(
  workspaceId: string,
  config: McpServerConfig & { id?: string; enabled?: boolean }
): void {
  const id = config.id ?? crypto.randomUUID()
  const createdAt = Date.now()

  db.insert(mcpServers)
    .values({
      id,
      workspaceId,
      name: config.name,
      command: config.command,
      args: config.args ? JSON.stringify(config.args) : null,
      env: config.env ? JSON.stringify(config.env) : null,
      cwd: config.cwd ?? null,
      description: config.description ?? null,
      enabled: config.enabled ?? true,
      createdAt,
    })
    .onConflictDoUpdate({
      target: [mcpServers.workspaceId, mcpServers.name],
      set: {
        command: config.command,
        args: config.args ? JSON.stringify(config.args) : null,
        env: config.env ? JSON.stringify(config.env) : null,
        cwd: config.cwd ?? null,
        description: config.description ?? null,
        enabled: config.enabled ?? true,
      },
    })
    .run()
}

/**
 * Save multiple MCP servers (replaces all existing for workspace)
 */
export function saveMcpServers(workspaceId: string, configs: McpServerConfig[]): void {
  // Delete existing servers
  db.delete(mcpServers)
    .where(eq(mcpServers.workspaceId, workspaceId))
    .run()

  // Insert new servers
  const now = Date.now()
  for (const config of configs) {
    db.insert(mcpServers)
      .values({
        id: crypto.randomUUID(),
        workspaceId,
        name: config.name,
        command: config.command,
        args: config.args ? JSON.stringify(config.args) : null,
        env: config.env ? JSON.stringify(config.env) : null,
        cwd: config.cwd ?? null,
        description: config.description ?? null,
        enabled: true,
        createdAt: now,
      })
      .run()
  }
}

/**
 * Delete an MCP server
 */
export function deleteMcpServer(workspaceId: string, name: string): void {
  db.delete(mcpServers)
    .where(and(eq(mcpServers.workspaceId, workspaceId), eq(mcpServers.name, name)))
    .run()
}

/**
 * Update server enabled state
 */
export function setMcpServerEnabled(workspaceId: string, name: string, enabled: boolean): void {
  db.update(mcpServers)
    .set({ enabled })
    .where(and(eq(mcpServers.workspaceId, workspaceId), eq(mcpServers.name, name)))
    .run()
}

/**
 * Convert DB record to McpServerConfig
 */
export function dbToMcpConfig(server: DbMcpServer): McpServerConfig {
  return {
    name: server.name,
    command: server.command,
    args: server.args ? JSON.parse(server.args) : undefined,
    env: server.env ? JSON.parse(server.env) : undefined,
    cwd: server.cwd ?? undefined,
    description: server.description ?? undefined,
  }
}