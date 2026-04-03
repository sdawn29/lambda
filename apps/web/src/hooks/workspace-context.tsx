import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react"

export interface Workspace {
  id: string
  name: string
  path: string
}

interface WorkspaceContextValue {
  workspaces: Workspace[]
  activeWorkspace: Workspace | null
  createWorkspace: (name: string, path: string) => Workspace
  selectWorkspace: (workspace: Workspace) => void
  deleteWorkspace: (workspace: Workspace) => void
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

let idCounter = 0
function generateId(): string {
  return `ws-${++idCounter}-${Date.now()}`
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null)

  const createWorkspace = useCallback(
    (name: string, path: string): Workspace => {
      const workspace: Workspace = { id: generateId(), name, path }
      setWorkspaces((prev) => [...prev, workspace])
      setActiveWorkspace(workspace)
      return workspace
    },
    []
  )

  const selectWorkspace = useCallback((workspace: Workspace) => {
    setActiveWorkspace(workspace)
  }, [])

  const deleteWorkspace = useCallback((workspace: Workspace) => {
    setWorkspaces((prev) => prev.filter((w) => w.id !== workspace.id))
    setActiveWorkspace((prev) => (prev?.id === workspace.id ? null : prev))
  }, [])

  return (
    <WorkspaceContext
      value={{
        workspaces,
        activeWorkspace,
        createWorkspace,
        selectWorkspace,
        deleteWorkspace,
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
