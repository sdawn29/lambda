import { apiFetch } from "./client"

export type WorkspaceEntry = { path: string; type: "file" | "dir" }

export async function listWorkspaceFiles(
  sessionId: string
): Promise<WorkspaceEntry[]> {
  const data = await apiFetch<{ entries: WorkspaceEntry[] }>(
    `/session/${sessionId}/workspace-files`
  )
  return data.entries
}
