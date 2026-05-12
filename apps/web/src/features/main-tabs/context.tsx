import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from "react"

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

interface MainTabsState {
  tabs: MainTab[]
  activeTabId: string | null
}

type MainTabsAction =
  | { type: "ADD_THREAD_TAB"; payload: { threadId: string; title: string } }
  | { type: "ADD_FILE_TAB"; payload: Omit<FileMainTab, "id" | "type"> }
  | { type: "CLOSE_TAB"; payload: string }
  | { type: "SET_ACTIVE_TAB"; payload: string }
  | { type: "UPDATE_THREAD_TITLE"; payload: { threadId: string; title: string } }

const initialState: MainTabsState = {
  tabs: [],
  activeTabId: null,
}

function mainTabsReducer(
  state: MainTabsState,
  action: MainTabsAction
): MainTabsState {
  switch (action.type) {
    case "ADD_THREAD_TAB": {
      const { threadId, title } = action.payload
      const existing = state.tabs.find(
        (t) => t.type === "thread" && t.threadId === threadId
      )
      if (existing) {
        return { ...state, activeTabId: existing.id }
      }
      const id = `thread-${threadId}`
      const newTab: ThreadMainTab = { id, type: "thread", threadId, title }
      return { ...state, tabs: [...state.tabs, newTab], activeTabId: id }
    }

    case "ADD_FILE_TAB": {
      const { filePath } = action.payload
      const existing = state.tabs.find(
        (t) => t.type === "file" && t.filePath === filePath
      )
      if (existing) {
        return { ...state, activeTabId: existing.id }
      }
      const id = `file-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      const newTab: FileMainTab = { id, type: "file", ...action.payload }
      return { ...state, tabs: [...state.tabs, newTab], activeTabId: id }
    }

    case "CLOSE_TAB": {
      const id = action.payload
      const idx = state.tabs.findIndex((t) => t.id === id)
      if (idx === -1) return state
      const newTabs = state.tabs.filter((t) => t.id !== id)
      let newActiveTabId = state.activeTabId
      if (state.activeTabId === id) {
        newActiveTabId =
          newTabs.length > 0 ? newTabs[Math.max(0, idx - 1)].id : null
      }
      return { ...state, tabs: newTabs, activeTabId: newActiveTabId }
    }

    case "SET_ACTIVE_TAB":
      return { ...state, activeTabId: action.payload }

    case "UPDATE_THREAD_TITLE": {
      const { threadId, title } = action.payload
      const existing = state.tabs.find(
        (t) => t.type === "thread" && t.threadId === threadId
      )
      if (!existing || existing.title === title) return state
      return {
        ...state,
        tabs: state.tabs.map((t) =>
          t.type === "thread" && t.threadId === threadId
            ? { ...t, title }
            : t
        ),
      }
    }

    default:
      return state
  }
}

interface MainTabsContextValue {
  tabs: MainTab[]
  activeTabId: string | null
  activeTab: MainTab | null
  addThreadTab: (threadId: string, title: string) => void
  addFileTab: (tab: Omit<FileMainTab, "id" | "type">) => void
  closeTab: (id: string) => void
  setActiveTab: (id: string) => void
  updateThreadTitle: (threadId: string, title: string) => void
}

const MainTabsContext = createContext<MainTabsContextValue | null>(null)

export function MainTabsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(mainTabsReducer, initialState)

  const addThreadTab = useCallback(
    (threadId: string, title: string) =>
      dispatch({ type: "ADD_THREAD_TAB", payload: { threadId, title } }),
    []
  )
  const addFileTab = useCallback(
    (tab: Omit<FileMainTab, "id" | "type">) =>
      dispatch({ type: "ADD_FILE_TAB", payload: tab }),
    []
  )
  const closeTab = useCallback(
    (id: string) => dispatch({ type: "CLOSE_TAB", payload: id }),
    []
  )
  const setActiveTab = useCallback(
    (id: string) => dispatch({ type: "SET_ACTIVE_TAB", payload: id }),
    []
  )
  const updateThreadTitle = useCallback(
    (threadId: string, title: string) =>
      dispatch({ type: "UPDATE_THREAD_TITLE", payload: { threadId, title } }),
    []
  )

  const activeTab = useMemo(
    () => state.tabs.find((t) => t.id === state.activeTabId) ?? null,
    [state.tabs, state.activeTabId]
  )

  const value = useMemo(
    () => ({
      tabs: state.tabs,
      activeTabId: state.activeTabId,
      activeTab,
      addThreadTab,
      addFileTab,
      closeTab,
      setActiveTab,
      updateThreadTitle,
    }),
    [
      state.tabs,
      state.activeTabId,
      activeTab,
      addThreadTab,
      addFileTab,
      closeTab,
      setActiveTab,
      updateThreadTitle,
    ]
  )

  return <MainTabsContext value={value}>{children}</MainTabsContext>
}

export function useMainTabs() {
  const ctx = useContext(MainTabsContext)
  if (!ctx) throw new Error("useMainTabs must be used within MainTabsProvider")
  return ctx
}
