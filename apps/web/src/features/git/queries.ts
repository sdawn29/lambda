import { useQuery } from "@tanstack/react-query"
import { gitStatus, gitFileDiff, gitDiffStat, gitStashList } from "./api"
import { getBranch, listBranches } from "@/features/chat/api"

// ── Git status ────────────────────────────────────────────────────────────────

export const gitStatusKey = (sessionId: string) => ["git-status", sessionId] as const

export function useGitStatus(sessionId: string) {
  return useQuery({
    queryKey: gitStatusKey(sessionId),
    queryFn: () => gitStatus(sessionId),
    enabled: !!sessionId,
    staleTime: 0,
  })
}

// ── Git file diff ─────────────────────────────────────────────────────────────

export const gitFileDiffKey = (
  sessionId: string,
  filePath: string,
  statusCode: string
) => ["git-diff", sessionId, filePath, statusCode] as const

export function useGitFileDiff(
  sessionId: string,
  filePath: string,
  statusCode: string,
  enabled: boolean
) {
  return useQuery({
    queryKey: gitFileDiffKey(sessionId, filePath, statusCode),
    queryFn: () => gitFileDiff(sessionId, filePath, statusCode),
    enabled: enabled && !!sessionId && !!filePath,
    staleTime: 30_000,
  })
}

// ── Git diff stat ─────────────────────────────────────────────────────────────

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

// ── Stash list ────────────────────────────────────────────────────────────────

export const gitStashListKey = (sessionId: string) =>
  ["git-stash-list", sessionId] as const

export function useGitStashList(sessionId: string) {
  return useQuery({
    queryKey: gitStashListKey(sessionId),
    queryFn: () => gitStashList(sessionId),
    enabled: !!sessionId,
    staleTime: 0,
  })
}

// ── Branch ────────────────────────────────────────────────────────────────────

export const branchKey = (sessionId: string) => ["branch", sessionId] as const

export function useBranch(sessionId: string) {
  return useQuery({
    queryKey: branchKey(sessionId),
    queryFn: () => getBranch(sessionId),
    enabled: !!sessionId,
    staleTime: 30_000,
  })
}

export const branchesKey = (sessionId: string) => ["branches", sessionId] as const

export function useBranches(sessionId: string) {
  return useQuery({
    queryKey: branchesKey(sessionId),
    queryFn: () => listBranches(sessionId),
    enabled: !!sessionId,
    staleTime: 30_000,
  })
}
