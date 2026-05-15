import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { WorkspaceTask } from "./types"

interface TasksStore {
  tasksByWorkspace: Record<string, WorkspaceTask[]>
  getTasks: (workspaceId: string) => WorkspaceTask[]
  addTask: (workspaceId: string, task: Omit<WorkspaceTask, "id">) => void
  updateTask: (workspaceId: string, id: string, updates: Partial<Omit<WorkspaceTask, "id">>) => void
  deleteTask: (workspaceId: string, id: string) => void
}

export const useTasksStore = create<TasksStore>()(
  persist(
    (set, get) => ({
      tasksByWorkspace: {},

      getTasks: (workspaceId) => get().tasksByWorkspace[workspaceId] ?? [],

      addTask: (workspaceId, task) =>
        set((s) => ({
          tasksByWorkspace: {
            ...s.tasksByWorkspace,
            [workspaceId]: [
              ...(s.tasksByWorkspace[workspaceId] ?? []),
              { ...task, id: crypto.randomUUID() },
            ],
          },
        })),

      updateTask: (workspaceId, id, updates) =>
        set((s) => ({
          tasksByWorkspace: {
            ...s.tasksByWorkspace,
            [workspaceId]: (s.tasksByWorkspace[workspaceId] ?? []).map((t) =>
              t.id === id ? { ...t, ...updates } : t
            ),
          },
        })),

      deleteTask: (workspaceId, id) =>
        set((s) => ({
          tasksByWorkspace: {
            ...s.tasksByWorkspace,
            [workspaceId]: (s.tasksByWorkspace[workspaceId] ?? []).filter(
              (t) => t.id !== id
            ),
          },
        })),
    }),
    { name: "lamda-workspace-tasks" }
  )
)
