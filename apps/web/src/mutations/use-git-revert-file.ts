import { useMutation, useQueryClient } from "@tanstack/react-query"
import { gitRevertFile } from "@/api/git"
import { gitStatusKey } from "@/queries/use-git-status"

export function useGitRevertFile(sessionId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ filePath, raw }: { filePath: string; raw: string }) =>
      gitRevertFile(sessionId, filePath, raw),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: gitStatusKey(sessionId) }),
  })
}
