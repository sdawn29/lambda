import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  gitCommit,
  gitStage,
  gitUnstage,
  gitStageAll,
  gitUnstageAll,
  gitStash,
  gitStashPop,
  gitStashApply,
  gitStashDrop,
  gitRevertFile,
  gitPush,
} from "./api"
import { gitStatusKey, gitStashListKey, branchKey, branchesKey } from "./queries"
import { checkoutBranch, createBranch } from "@/features/chat/api"

// ── Commit ────────────────────────────────────────────────────────────────────

export function useGitCommit(sessionId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (message: string) => gitCommit(sessionId, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gitStatusKey(sessionId) })
    },
  })
}

// ── Stage / Unstage ───────────────────────────────────────────────────────────

export function useGitStage(sessionId: string) {
  const queryClient = useQueryClient()
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: gitStatusKey(sessionId) })
  return {
    stage: useMutation({
      mutationFn: (filePath: string) => gitStage(sessionId, filePath),
      onSuccess: invalidate,
    }),
    unstage: useMutation({
      mutationFn: (filePath: string) => gitUnstage(sessionId, filePath),
      onSuccess: invalidate,
    }),
  }
}

export function useGitStageAll(sessionId: string) {
  const queryClient = useQueryClient()
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: gitStatusKey(sessionId) })
  return {
    stageAll: useMutation({
      mutationFn: () => gitStageAll(sessionId),
      onSuccess: invalidate,
    }),
    unstageAll: useMutation({
      mutationFn: () => gitUnstageAll(sessionId),
      onSuccess: invalidate,
    }),
  }
}

// ── Stash ─────────────────────────────────────────────────────────────────────

export function useGitStashMutations(sessionId: string) {
  const queryClient = useQueryClient()

  const invalidateStatus = () =>
    queryClient.invalidateQueries({ queryKey: gitStatusKey(sessionId) })
  const invalidateList = () =>
    queryClient.invalidateQueries({ queryKey: gitStashListKey(sessionId) })
  const invalidateBoth = () => {
    invalidateStatus()
    invalidateList()
  }

  return {
    stash: useMutation({
      mutationFn: (message?: string) => gitStash(sessionId, message),
      onSuccess: invalidateBoth,
    }),
    pop: useMutation({
      mutationFn: (ref: string) => gitStashPop(sessionId, ref),
      onSuccess: invalidateBoth,
    }),
    apply: useMutation({
      mutationFn: (ref: string) => gitStashApply(sessionId, ref),
      onSuccess: invalidateStatus,
    }),
    drop: useMutation({
      mutationFn: (ref: string) => gitStashDrop(sessionId, ref),
      onSuccess: invalidateList,
    }),
  }
}

// ── Revert file ───────────────────────────────────────────────────────────────

export function useGitRevertFile(sessionId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ filePath, raw }: { filePath: string; raw: string }) =>
      gitRevertFile(sessionId, filePath, raw),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: gitStatusKey(sessionId) }),
  })
}

// ── Push ──────────────────────────────────────────────────────────────────────

export function useGitPush(sessionId: string) {
  return useMutation({
    mutationFn: () => gitPush(sessionId),
  })
}

// ── Branch ────────────────────────────────────────────────────────────────────

export function useCheckoutBranch(sessionId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (branch: string) => checkoutBranch(sessionId, branch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: branchKey(sessionId) })
    },
  })
}

export function useCreateBranch(sessionId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (branch: string) => createBranch(sessionId, branch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: branchKey(sessionId) })
      queryClient.invalidateQueries({ queryKey: branchesKey(sessionId) })
    },
  })
}
