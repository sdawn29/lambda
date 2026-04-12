import {
  type QueryClient,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"
import {
  createWorkspace as apiCreateWorkspace,
  type CreateWorkspaceBody,
  deleteWorkspace as apiDeleteWorkspace,
  createThread as apiCreateThread,
  deleteThread as apiDeleteThread,
  updateThreadTitle as apiUpdateThreadTitle,
  resetAllData,
  type WorkspaceDto,
} from "./api"
import { workspacesQueryKey } from "./queries"
import {
  createSession,
  deleteSession,
  type CreateSessionBody,
} from "@/features/chat/api"
import { chatKeys } from "@/features/chat/queries"
import { gitKeys } from "@/features/git/queries"

function setWorkspacesData(
  queryClient: QueryClient,
  updater: (workspaces: WorkspaceDto[]) => WorkspaceDto[]
) {
  queryClient.setQueryData<WorkspaceDto[]>(workspacesQueryKey, (current) =>
    updater(current ?? [])
  )
}

function removeSessionQueries(
  queryClient: QueryClient,
  sessionIds: Array<string | null | undefined>
) {
  for (const sessionId of sessionIds) {
    if (!sessionId) continue
    queryClient.removeQueries({ queryKey: chatKeys.session(sessionId) })
    queryClient.removeQueries({ queryKey: gitKeys.session(sessionId) })
  }
}

function upsertWorkspace(
  workspaces: WorkspaceDto[],
  workspace: WorkspaceDto
): WorkspaceDto[] {
  const existingIndex = workspaces.findIndex((item) => item.id === workspace.id)
  if (existingIndex === -1) {
    return [...workspaces, workspace]
  }

  const next = [...workspaces]
  next[existingIndex] = workspace
  return next
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateWorkspaceBody) => apiCreateWorkspace(body),
    onSuccess: ({ workspace }) => {
      setWorkspacesData(queryClient, (current) =>
        upsertWorkspace(current, workspace)
      )
      queryClient.invalidateQueries({ queryKey: workspacesQueryKey })
    },
  })
}

export function useDeleteWorkspace() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (workspace: WorkspaceDto) => apiDeleteWorkspace(workspace.id),
    onSuccess: (_data, workspace) => {
      setWorkspacesData(queryClient, (current) =>
        current.filter((item) => item.id !== workspace.id)
      )
      removeSessionQueries(
        queryClient,
        workspace.threads.map((thread) => thread.sessionId)
      )
      queryClient.invalidateQueries({ queryKey: workspacesQueryKey })
    },
  })
}

export function useCreateThread() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (workspaceId: string) => apiCreateThread(workspaceId),
    onSuccess: ({ thread }, workspaceId) => {
      setWorkspacesData(queryClient, (current) =>
        current.map((workspace) =>
          workspace.id !== workspaceId
            ? workspace
            : {
                ...workspace,
                threads: workspace.threads.some((item) => item.id === thread.id)
                  ? workspace.threads
                  : [...workspace.threads, thread],
              }
        )
      )
      queryClient.invalidateQueries({ queryKey: workspacesQueryKey })
    },
  })
}

export function useDeleteThread() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ threadId }: { workspaceId: string; threadId: string }) =>
      apiDeleteThread(threadId),
    onSuccess: (_data, { workspaceId, threadId }) => {
      const current =
        queryClient.getQueryData<WorkspaceDto[]>(workspacesQueryKey) ?? []
      const deletedThread = current
        .find((workspace) => workspace.id === workspaceId)
        ?.threads.find((thread) => thread.id === threadId)

      setWorkspacesData(queryClient, (workspaces) =>
        workspaces.map((workspace) =>
          workspace.id !== workspaceId
            ? workspace
            : {
                ...workspace,
                threads: workspace.threads.filter(
                  (thread) => thread.id !== threadId
                ),
              }
        )
      )

      removeSessionQueries(queryClient, [deletedThread?.sessionId])
      queryClient.invalidateQueries({ queryKey: workspacesQueryKey })
    },
  })
}

export function useUpdateThreadTitle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      threadId,
      title,
    }: {
      workspaceId: string
      threadId: string
      title: string
    }) => apiUpdateThreadTitle(threadId, title),
    onMutate: ({ workspaceId, threadId, title }) => {
      const previous =
        queryClient.getQueryData<WorkspaceDto[]>(workspacesQueryKey)
      setWorkspacesData(queryClient, (workspaces) =>
        workspaces.map((workspace) =>
          workspace.id !== workspaceId
            ? workspace
            : {
                ...workspace,
                threads: workspace.threads.map((thread) =>
                  thread.id === threadId ? { ...thread, title } : thread
                ),
              }
        )
      )

      return { previous }
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(workspacesQueryKey, context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: workspacesQueryKey })
    },
  })
}

export function useResetAll() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => resetAllData(),
    onSuccess: () => {
      queryClient.setQueryData(workspacesQueryKey, [])
      queryClient.removeQueries({ queryKey: chatKeys.all })
      queryClient.removeQueries({ queryKey: gitKeys.all })
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
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteSession(id),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: chatKeys.session(id) })
      queryClient.removeQueries({ queryKey: gitKeys.session(id) })
    },
  })
}
