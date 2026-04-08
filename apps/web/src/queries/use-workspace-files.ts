import { useQuery } from "@tanstack/react-query"
import { listWorkspaceFiles, type WorkspaceEntry } from "@/api/files"

export type { WorkspaceEntry }

export function useWorkspaceFiles(sessionId: string | undefined) {
  return useQuery({
    queryKey: ["workspace-files", sessionId],
    queryFn: () => listWorkspaceFiles(sessionId!),
    enabled: !!sessionId,
    staleTime: 30_000,
    select: (data) => data,
  })
}
