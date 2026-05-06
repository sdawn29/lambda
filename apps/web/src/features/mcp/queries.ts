import { useQuery } from "@tanstack/react-query"
import { fetchMcpSettings, fetchMcpServerStatus, fetchMcpTools } from "./api"

const mcpRootKey = ["mcp"] as const

export const mcpKeys = {
  all: mcpRootKey,
  settings: (workspaceId: string) => [...mcpRootKey, "settings", workspaceId] as const,
  status: (workspaceId: string) => [...mcpRootKey, "status", workspaceId] as const,
  tools: (workspaceId: string) => [...mcpRootKey, "tools", workspaceId] as const,
}

/**
 * Fetch MCP settings for a workspace
 */
export function useMcpSettings(workspaceId: string) {
  return useQuery({
    queryKey: mcpKeys.settings(workspaceId),
    queryFn: ({ signal }) => fetchMcpSettings(workspaceId, signal),
    staleTime: 30 * 1000,
    enabled: !!workspaceId,
  })
}

/**
 * Fetch MCP server status for a workspace
 */
export function useMcpServerStatus(workspaceId: string) {
  return useQuery({
    queryKey: mcpKeys.status(workspaceId),
    queryFn: ({ signal }) => fetchMcpServerStatus(workspaceId, signal),
    staleTime: 10 * 1000,
    enabled: !!workspaceId,
    refetchInterval: 30 * 1000, // Refresh status periodically
  })
}

/**
 * Fetch available MCP tools for a workspace
 */
export function useMcpTools(workspaceId: string) {
  return useQuery({
    queryKey: mcpKeys.tools(workspaceId),
    queryFn: ({ signal }) => fetchMcpTools(workspaceId, signal),
    staleTime: 30 * 1000,
    enabled: !!workspaceId,
  })
}
