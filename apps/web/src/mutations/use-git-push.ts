import { useMutation } from "@tanstack/react-query"
import { gitPush } from "@/api/git"

export function useGitPush(sessionId: string) {
  return useMutation({
    mutationFn: () => gitPush(sessionId),
  })
}
