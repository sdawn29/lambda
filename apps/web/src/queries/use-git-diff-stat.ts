import { useQuery } from "@tanstack/react-query"
import { gitDiffStat } from "@/api/git"

export const gitDiffStatKey = (sessionId: string) => ["git-diff-stat", sessionId] as const

export function useGitDiffStat(sessionId: string) {
  return useQuery({
    queryKey: gitDiffStatKey(sessionId),
    queryFn: () => gitDiffStat(sessionId),
    enabled: !!sessionId,
    staleTime: 0,
    refetchInterval: 5000,
  })
}
