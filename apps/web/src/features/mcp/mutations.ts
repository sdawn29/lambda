import { useMutation, useQueryClient } from "@tanstack/react-query"
import { saveMcpSettings, testMcpConnection } from "./api"
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
