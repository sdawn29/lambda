/**
 * MCP Routes
 * 
 * API endpoints for managing MCP server configurations per workspace.
 * Settings are stored in memory and passed to the MCP client at session creation.
 */

import { Hono } from "hono"
import {
  getMcpSettings,
  saveMcpSettings,
  testMcpConnection,
  getMcpServerStatus,
  getMcpTools,
} from "../services/mcp-service.js"

const mcpRouter = new Hono()

/**
 * GET /mcp/settings/:workspaceId
 * Fetch MCP settings for a workspace
 */
mcpRouter.get("/settings/:workspaceId", async (c) => {
  const workspaceId = c.req.param("workspaceId")
  const settings = getMcpSettings(workspaceId)
  return c.json({ settings })
})

/**
 * PUT /mcp/settings/:workspaceId
 * Save MCP settings for a workspace
 */
mcpRouter.put("/settings/:workspaceId", async (c) => {
  const workspaceId = c.req.param("workspaceId")
  const { settings } = await c.req.json<{
    settings: {
      servers: Array<{
        name: string
        command: string
        args?: string[]
        env?: Record<string, string>
        cwd?: string
        description?: string
      }>
    }
  }>()

  saveMcpSettings(workspaceId, settings)
  return c.json({ success: true })
})

/**
 * GET /mcp/status/:workspaceId
 * Get MCP server connection status
 */
mcpRouter.get("/status/:workspaceId", async (c) => {
  const workspaceId = c.req.param("workspaceId")
  
  const status = await getMcpServerStatus(workspaceId)
  
  return c.json({ servers: status })
})

/**
 * GET /mcp/tools/:workspaceId
 * List available MCP tools
 */
mcpRouter.get("/tools/:workspaceId", async (c) => {
  const workspaceId = c.req.param("workspaceId")
  
  const tools = await getMcpTools(workspaceId)
  
  return c.json({ tools })
})

/**
 * POST /mcp/test-connection
 * Test connecting to an MCP server
 */
mcpRouter.post("/test-connection", async (c) => {
  const { server } = await c.req.json<{
    server: {
      name: string
      command: string
      args?: string[]
      env?: Record<string, string>
      cwd?: string
    }
  }>()

  const result = await testMcpConnection(server)
  return c.json(result)
})

export { mcpRouter }
