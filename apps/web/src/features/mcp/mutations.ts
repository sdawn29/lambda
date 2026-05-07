import { useMutation, useQueryClient } from "@tanstack/react-query"
import { saveMcpSettings, testMcpConnection, startMcpServer, stopMcpServer, setMcpServerEnabled } from "./api"
import type { McpServerConfig } from "./types"
import { mcpKeys } from "./queries"

export function useSaveMcpSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      workspaceId,
      settings,
    }: {
      workspaceId: string
      settings: Record<string, McpServerConfig[]>
    }) => saveMcpSettings(workspaceId, settings),
    onMutate: async ({ workspaceId, settings }) => {
      // Optimistically update the cache
      const prev = queryClient.getQueryData(mcpKeys.settings(workspaceId))
      queryClient.setQueryData(mcpKeys.settings(workspaceId), settings)
      return { prev }
    },
    onError: (_err, { workspaceId }, context) => {
      // Rollback on error
      if (context?.prev) {
        queryClient.setQueryData(mcpKeys.settings(workspaceId), context.prev)
      }
    },
    onSettled: (_data, _err, { workspaceId }) => {
      // Always refetch after mutation
      queryClient.invalidateQueries({ queryKey: mcpKeys.settings(workspaceId) })
      queryClient.invalidateQueries({ queryKey: mcpKeys.status(workspaceId) })
      queryClient.invalidateQueries({ queryKey: mcpKeys.tools(workspaceId) })
    },
  })
}

export function useTestMcpConnection() {
  return useMutation({
    mutationFn: (server: McpServerConfig) => testMcpConnection(server),
  })
}

export function useStartMcpServer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ workspaceId, serverName }: { workspaceId: string; serverName: string }) =>
      startMcpServer(workspaceId, serverName),
    onSettled: (_data, _err, { workspaceId }) => {
      // Refresh status and tools after starting
      queryClient.invalidateQueries({ queryKey: mcpKeys.status(workspaceId) })
      queryClient.invalidateQueries({ queryKey: mcpKeys.tools(workspaceId) })
    },
  })
}

export function useStopMcpServer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ workspaceId, serverName }: { workspaceId: string; serverName: string }) =>
      stopMcpServer(workspaceId, serverName),
    onSettled: (_data, _err, { workspaceId }) => {
      // Refresh status and tools after stopping
      queryClient.invalidateQueries({ queryKey: mcpKeys.status(workspaceId) })
      queryClient.invalidateQueries({ queryKey: mcpKeys.tools(workspaceId) })
    },
  })
}

export function useSetMcpServerEnabled() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ workspaceId, serverName, enabled }: { workspaceId: string; serverName: string; enabled: boolean }) =>
      setMcpServerEnabled(workspaceId, serverName, enabled),
    onSettled: (_data, _err, { workspaceId }) => {
      // Refresh settings and status after toggling enabled
      queryClient.invalidateQueries({ queryKey: mcpKeys.settings(workspaceId) })
      queryClient.invalidateQueries({ queryKey: mcpKeys.status(workspaceId) })
      queryClient.invalidateQueries({ queryKey: mcpKeys.tools(workspaceId) })
    },
  })
}