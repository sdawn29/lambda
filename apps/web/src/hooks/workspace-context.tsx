import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react"

import { createSession, deleteSession } from "@/api/sessions"

export interface Thread {
  id: string
  sessionId: string
  title: string
  createdAt: number
}

export interface Workspace {
  id: string
  name: string
  path: string
  threads: Thread[]
}

interface WorkspaceContextValue {
  workspaces: Workspace[]
  activeWorkspace: Workspace | null
  activeThread: Thread | null
  createWorkspace: (name: string, path: string) => Promise<Workspace>
  selectWorkspace: (workspace: Workspace) => void
  deleteWorkspace: (workspace: Workspace) => void
  createThread: (workspaceId: string) => Promise<Thread>
  selectThread: (workspaceId: string, thread: Thread) => void
  setThreadTitle: (workspaceId: string, threadId: string, title: string) => void
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

let idCounter = 0
function generateId(): string {
  return `ws-${++idCounter}-${Date.now()}`
}
function generateThreadId(): string {
  return `th-${++idCounter}-${Date.now()}`
}

function makeThread(sessionId: string): Thread {
  return {
    id: generateThreadId(),
    sessionId,
    title: "New Thread",
    createdAt: Date.now(),
  }
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null)
  const [activeThread, setActiveThread] = useState<Thread | null>(null)

  const createWorkspace = useCallback(
    async (name: string, path: string): Promise<Workspace> => {
      const { sessionId } = await createSession({ cwd: path })
      const firstThread = makeThread(sessionId)
      const workspace: Workspace = {
        id: generateId(),
        name,
        path,
        threads: [firstThread],
      }
      setWorkspaces((prev) => [...prev, workspace])
      setActiveWorkspace(workspace)
      setActiveThread(firstThread)
      return workspace
    },
    []
  )

  const createThread = useCallback(
    async (workspaceId: string): Promise<Thread> => {
      let workspacePath: string | undefined
      setWorkspaces((prev) => {
        workspacePath = prev.find((w) => w.id === workspaceId)?.path
        return prev
      })
      if (!workspacePath) throw new Error("Workspace not found")
      const { sessionId } = await createSession({ cwd: workspacePath })
      const thread = makeThread(sessionId)
      setWorkspaces((prev) =>
        prev.map((w) =>
          w.id === workspaceId ? { ...w, threads: [...w.threads, thread] } : w
        )
      )
      setActiveWorkspace((prev) =>
        prev?.id === workspaceId
          ? { ...prev, threads: [...prev.threads, thread] }
          : prev
      )
      setActiveThread(thread)
      return thread
    },
    []
  )

  const selectThread = useCallback(
    (workspaceId: string, thread: Thread) => {
      setWorkspaces((prev) => {
        const ws = prev.find((w) => w.id === workspaceId)
        if (ws) setActiveWorkspace(ws)
        return prev
      })
      setActiveThread(thread)
    },
    []
  )

  const setThreadTitle = useCallback(
    (workspaceId: string, threadId: string, title: string) => {
      setWorkspaces((prev) =>
        prev.map((w) =>
          w.id !== workspaceId
            ? w
            : {
                ...w,
                threads: w.threads.map((t) =>
                  t.id === threadId ? { ...t, title } : t
                ),
              }
        )
      )
      setActiveThread((prev) =>
        prev?.id === threadId ? { ...prev, title } : prev
      )
    },
    []
  )

  const selectWorkspace = useCallback((workspace: Workspace) => {
    setActiveWorkspace(workspace)
    setActiveThread(workspace.threads[0] ?? null)
  }, [])

  const deleteWorkspace = useCallback((workspace: Workspace) => {
    workspace.threads.forEach((t) => deleteSession(t.sessionId).catch(() => {}))
    setWorkspaces((prev) => prev.filter((w) => w.id !== workspace.id))
    setActiveWorkspace((prev) => (prev?.id === workspace.id ? null : prev))
    setActiveThread((prev) =>
      workspace.threads.some((t) => t.id === prev?.id) ? null : prev
    )
  }, [])

  return (
    <WorkspaceContext
      value={{
        workspaces,
        activeWorkspace,
        activeThread,
        createWorkspace,
        selectWorkspace,
        deleteWorkspace,
        createThread,
        selectThread,
        setThreadTitle,
      }}
    >
      {children}
    </WorkspaceContext>
  )
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext)
  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider")
  }
  return context
}
