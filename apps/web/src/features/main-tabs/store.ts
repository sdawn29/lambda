import { create } from "zustand"

export interface ThreadMainTab {
  id: string
  type: "thread"
  threadId: string
  title: string
}

export interface FileMainTab {
  id: string
  type: "file"
  filePath: string
  title: string
  workspacePath?: string
  openWithAppId?: string | null
}

export type MainTab = ThreadMainTab | FileMainTab

interface MainTabsStore {
  tabs: MainTab[]
  activeTabId: string | null
  addThreadTab: (threadId: string, title: string) => void
  addFileTab: (tab: Omit<FileMainTab, "id" | "type">) => void
  closeTab: (id: string) => void
  setActiveTab: (id: string) => void
  updateThreadTitle: (threadId: string, title: string) => void
  reorderTabs: (draggedId: string, targetId: string, before: boolean) => void
}

export const useMainTabsStore = create<MainTabsStore>()((set) => ({
  tabs: [],
  activeTabId: null,

  addThreadTab: (threadId, title) =>
    set((s) => {
      const existing = s.tabs.find((t) => t.type === "thread" && t.threadId === threadId)
      if (existing) return { activeTabId: existing.id }
      const id = `thread-${threadId}`
      const newTab: ThreadMainTab = { id, type: "thread", threadId, title }
      return { tabs: [...s.tabs, newTab], activeTabId: id }
    }),

  addFileTab: (tab) =>
    set((s) => {
      const existing = s.tabs.find((t) => t.type === "file" && t.filePath === tab.filePath)
      if (existing) return { activeTabId: existing.id }
      const id = `file-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      const newTab: FileMainTab = { id, type: "file", ...tab }
      return { tabs: [...s.tabs, newTab], activeTabId: id }
    }),

  closeTab: (id) =>
    set((s) => {
      const idx = s.tabs.findIndex((t) => t.id === id)
      if (idx === -1) return s
      const newTabs = s.tabs.filter((t) => t.id !== id)
      const newActiveTabId =
        s.activeTabId === id
          ? newTabs.length > 0
            ? newTabs[Math.max(0, idx - 1)].id
            : null
          : s.activeTabId
      return { tabs: newTabs, activeTabId: newActiveTabId }
    }),

  setActiveTab: (id) => set({ activeTabId: id }),

  updateThreadTitle: (threadId, title) =>
    set((s) => {
      const existing = s.tabs.find((t) => t.type === "thread" && t.threadId === threadId)
      if (!existing || existing.title === title) return s
      return {
        tabs: s.tabs.map((t) =>
          t.type === "thread" && t.threadId === threadId ? { ...t, title } : t
        ),
      }
    }),

  reorderTabs: (draggedId, targetId, before) =>
    set((s) => {
      if (draggedId === targetId) return s
      const dragged = s.tabs.find((t) => t.id === draggedId)
      if (!dragged) return s
      const without = s.tabs.filter((t) => t.id !== draggedId)
      const targetIdx = without.findIndex((t) => t.id === targetId)
      if (targetIdx === -1) return s
      const insertAt = before ? targetIdx : targetIdx + 1
      return { tabs: [...without.slice(0, insertAt), dragged, ...without.slice(insertAt)] }
    }),
}))

export function useMainTabs() {
  const store = useMainTabsStore()
  const activeTab = store.tabs.find((t) => t.id === store.activeTabId) ?? null
  return { ...store, activeTab }
}
