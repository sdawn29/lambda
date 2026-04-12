import { useQuery } from "@tanstack/react-query"
import { listWorkspaces, type WorkspaceDto } from "./api"

export const workspaceKeys = {
  all: ["workspaces"] as const,
}

export const workspacesQueryKey = workspaceKeys.all

export function useWorkspaces() {
  return useQuery({
    queryKey: workspacesQueryKey,
    queryFn: async (): Promise<WorkspaceDto[]> => {
      const { workspaces } = await listWorkspaces()
      return workspaces
    },
    staleTime: 5 * 60 * 1000,
  })
}
