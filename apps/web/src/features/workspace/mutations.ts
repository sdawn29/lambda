import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  createWorkspace as apiCreateWorkspace,
  type CreateWorkspaceBody,
  deleteWorkspace as apiDeleteWorkspace,
  createThread as apiCreateThread,
  deleteThread as apiDeleteThread,
  updateThreadTitle as apiUpdateThreadTitle,
  resetAllData,
} from "./api"
import { workspacesQueryKey } from "./queries"
import {
  createSession,
  deleteSession,
  type CreateSessionBody,
} from "@/features/chat/api"

export function useCreateWorkspace() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateWorkspaceBody) => apiCreateWorkspace(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspacesQueryKey })
    },
  })
}

export function useDeleteWorkspace() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (workspaceId: string) => apiDeleteWorkspace(workspaceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspacesQueryKey })
    },
  })
}

export function useCreateThread() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (workspaceId: string) => apiCreateThread(workspaceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspacesQueryKey })
    },
  })
}

export function useDeleteThread() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (threadId: string) => apiDeleteThread(threadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspacesQueryKey })
    },
  })
}

export function useUpdateThreadTitle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ threadId, title }: { threadId: string; title: string }) =>
      apiUpdateThreadTitle(threadId, title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspacesQueryKey })
    },
  })
}

export function useResetAll() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => resetAllData(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspacesQueryKey })
    },
  })
}

export function useCreateSession() {
  return useMutation({
    mutationFn: (body: CreateSessionBody = {}) => createSession(body),
  })
}

export function useDeleteSession() {
  return useMutation({
    mutationFn: (id: string) => deleteSession(id),
  })
}
