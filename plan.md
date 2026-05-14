# Plan: Replace React Context with Zustand

## Context

The web app manages all UI state through React Context, leading to coarse re-render boundaries and boilerplate Provider nesting. Zustand v5 offers module-level stores with granular subscriptions, no Provider required, and cleaner TypeScript ergonomics — making it a direct improvement for UI/client state management.

**8 of 13 contexts** will be migrated. The remaining 5 are kept as React Context because they are either tightly coupled to React Query mutations (WorkspaceContext), manage DOM side effects that require component lifecycle (ThemeContext, KeyboardShortcutsContext), wrap third-party libraries with no actual state (ErrorToastContext), or are WIP placeholders (McpContext). UI library contexts (SidebarContext, ToggleGroupContext) are untouched.

---

## Step 0 — Install Zustand

```bash
npm install zustand -w web
```

---

## Phase 1 — Simple Boolean/Modal Stores (4 contexts)

Each follows the same pattern: create `store.ts`, update `index.ts` barrel exports, remove the Provider from `app-providers.tsx` or `__root.tsx`. Consumer import paths change; call sites do not (hook names are preserved).

### 1. SettingsModalContext → `settings/store.ts`

**Current file:** `src/features/settings/context.tsx`  
**Delete:** `SettingsModalProvider` from `src/providers/app-providers.tsx`  
**~4 consumers:** settings-modal, settings-page, title-bar, etc.

```ts
import { create } from 'zustand'
interface SettingsModalStore {
  open: boolean
  openSettings: () => void
  closeSettings: () => void
}
export const useSettingsModal = create<SettingsModalStore>()((set) => ({
  open: false,
  openSettings: () => set({ open: true }),
  closeSettings: () => set({ open: false }),
}))
```

### 2. ConfigureProviderContext → `settings/configure-provider-store.ts`

**Current file:** `src/features/settings/configure-provider-context.tsx`  
**Delete:** `ConfigureProviderProvider` from `src/providers/app-providers.tsx`  
**~3 consumers**

```ts
import { create } from 'zustand'
type ConfigureProviderTab = 'subscriptions' | 'api-keys'
interface ConfigureProviderStore {
  open: boolean
  tab: ConfigureProviderTab
  openConfigure: (tab?: ConfigureProviderTab) => void
  closeConfigure: () => void
  setTab: (tab: ConfigureProviderTab) => void
}
export const useConfigureProvider = create<ConfigureProviderStore>()((set) => ({
  open: false,
  tab: 'subscriptions',
  openConfigure: (tab = 'subscriptions') => set({ open: true, tab }),
  closeConfigure: () => set({ open: false }),
  setTab: (tab) => set({ tab }),
}))
```

### 3. CommandPaletteContext → `command-palette/store.ts`

**Current file:** `src/features/command-palette/context.tsx`  
**Delete:** `CommandPaletteProvider` from `src/providers/app-providers.tsx`  
**~2 consumers**

```ts
export const useCommandPalette = create<{
  open: boolean
  openPalette: () => void
  closePalette: () => void
}>()((set) => ({
  open: false,
  openPalette: () => set({ open: true }),
  closePalette: () => set({ open: false }),
}))
```

### 4. FileTreeContext → `file-tree/store.ts`

**Current file:** `src/features/file-tree/context.tsx`  
**Delete:** `<FileTreeProvider>` from `src/routes/__root.tsx` (inside `RootLayoutGate`)  
**~3 consumers**

```ts
export const useFileTree = create<{
  isOpen: boolean
  toggle: () => void
  open: () => void
  close: () => void
}>()((set) => ({
  isOpen: false,
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}))
```

---

## Phase 2 — Reducer-Based Tab Stores (2 contexts)

### 5. MainTabsContext → `main-tabs/store.ts`

**Current file:** `src/features/main-tabs/context.tsx` (uses `useReducer`)  
**Delete:** `<MainTabsProvider>` from `src/routes/__root.tsx`  
**~6 consumers:** main-tab-bar, file-content-view, tabs-empty-state, root layout, etc.

Keep type definitions (`MainTab`, `ThreadMainTab`, `FileMainTab`) in `context.tsx` or a `types.ts`. Move all reducer logic into Zustand actions. Preserve the `activeTab` derived value as a getter using `get()`:

```ts
import { create } from 'zustand'

export const useMainTabsStore = create<MainTabsStore>()((set, get) => ({
  tabs: [],
  activeTabId: null,
  get activeTab() {
    const { tabs, activeTabId } = get()
    return tabs.find((t) => t.id === activeTabId) ?? null
  },
  addThreadTab: (threadId, title) => set((s) => {
    const existing = s.tabs.find((t) => t.type === 'thread' && t.threadId === threadId)
    if (existing) return { activeTabId: existing.id }
    const id = `thread-${threadId}`
    return { tabs: [...s.tabs, { id, type: 'thread', threadId, title }], activeTabId: id }
  }),
  // closeTab: smart next-active logic (pick prev tab, or next, or null)
  // setActiveTab, updateThreadTitle, reorderTabs, addFileTab — port from reducer cases
}))

// Backward-compatible hook
export function useMainTabs() { return useMainTabsStore() }
```

### 6. DiffPanelContext → `git/store.ts`

**Current file:** `src/features/git/context.tsx` (uses `useReducer`)  
**Delete:** `<DiffPanelProvider>` from `src/routes/__root.tsx`  
**~3 consumers**

Port all 10 reducer action types to Zustand methods. Preserve:
- `SOURCE_CONTROL_TAB` constant (cannot be closed)
- `addTab` deduplication by `filePath`
- `workspaceTabs` per-workspace file tab memory (in-memory only, no localStorage)

```ts
export const useDiffPanelStore = create<DiffPanelStore>()((set, get) => ({
  isOpen: false,
  isFullscreen: false,
  tabs: [SOURCE_CONTROL_TAB],
  activeTabId: 'tab-source-control',
  pendingTabId: null,
  currentWorkspacePath: null,
  workspaceTabs: {},
  // ... all actions as methods using set()/get()
}))

export function useDiffPanel() { return useDiffPanelStore() }
```

---

## Phase 3A — Per-Workspace Terminal Store

### 7. TerminalContext → `terminal/store.ts`

**Current file:** `src/features/terminal/context.tsx` (uses `useState(new Map())` + `useRef` for counters)  
**Delete:** `<TerminalProvider>` from `src/routes/__root.tsx`  
**~3 consumers**

Replace `Map<string, WorkspaceTerminalState>` with `Record<string, WorkspaceTerminalState>` (Zustand-friendly). Move tab counters to a module-level variable (they never drive re-renders):

```ts
const tabCounters: Record<string, number> = {}

export const useTerminalStore = create<TerminalStore>()((set, get) => ({
  states: {},
  getState: (workspaceId) => get().states[workspaceId] ?? makeDefaultState(),
  toggle: (workspaceId, cwd) => {
    const current = get().states[workspaceId] ?? makeDefaultState()
    // open/close/create-first-tab logic using get() — no stale closure issue
  },
  // addTab, closeTab, setActiveTab, renameTab, killAll — all keyed by workspaceId
}))

export function useTerminal() { return useTerminalStore() }

export function useTerminalForWorkspace(workspaceId: string, cwd: string) {
  const state = useTerminalStore((s) => s.states[workspaceId] ?? makeDefaultState())
  return {
    ...state,
    toggle: () => useTerminalStore.getState().toggle(workspaceId, cwd),
    open: () => useTerminalStore.getState().open(workspaceId, cwd),
    addTab: () => useTerminalStore.getState().addTab(workspaceId, cwd),
    // remaining actions bound to workspaceId
  }
}
```

---

## Phase 3B — ThreadStatus Store (most impactful)

### 8. ThreadStatusContext → `chat/thread-status-store.ts`

**Current file:** `src/features/chat/thread-status-context.tsx`  
Uses: custom `ThreadStatusStore` class + `useSyncExternalStore` + `useEffect` WebSocket setup  
**Delete:** `<ThreadStatusProvider>` from `src/providers/app-providers.tsx`  
**~15 consumers** — most-used context in the app

The custom external store class is replaced by Zustand with `subscribeWithSelector` middleware. The WebSocket init moves out of a React component into a module-level function called once from `main.tsx`:

```ts
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

// Module-level timer registry — not React state, not subscribed to
const timers: Record<string, ReturnType<typeof setTimeout>> = {}

export const useThreadStatusStore = create<ThreadStatusStore>()(
  subscribeWithSelector((set, get) => ({
    statuses: {} as Record<string, ThreadStatus>,
    activeThreadId: null as string | null,
    setStatus: (threadId, status) => {
      // preserve: ignore non-streaming updates when status is 'error'
      // preserve: mark thread as streamed in localStorage
      // preserve: completed→idle timer only fires for the active thread
      set((s) => ({ statuses: { ...s.statuses, [threadId]: status } }))
      if (status === 'completed' && get().activeThreadId === threadId) {
        startIdleTimer(threadId) // 5s then sets status to 'idle'
      } else {
        cancelTimer(threadId)
      }
    },
    setActiveThreadId: (threadId) => {
      const prev = get().activeThreadId
      if (prev) cancelTimer(prev)
      set({ activeThreadId: threadId })
      if (threadId && (get().statuses[threadId] ?? 'idle') === 'completed') {
        startIdleTimer(threadId)
      }
    },
  }))
)

// Called once from main.tsx — WebSocket lives outside React entirely
export function initThreadStatusWebSocket() {
  // subscribe to WS events → call useThreadStatusStore.getState().setStatus(...)
}

// Granular per-thread selector — re-renders only when that thread's status changes
export function useThreadStatus(threadId: string): ThreadStatus {
  return useThreadStatusStore((s) => s.statuses[threadId] ?? 'idle')
}
export function useSetThreadStatus() {
  return useThreadStatusStore.getState().setStatus
}
export function useSetActiveThreadId() {
  return useThreadStatusStore.getState().setActiveThreadId
}
```

In `src/main.tsx`, call `initThreadStatusWebSocket()` before rendering.

---

## Phase 4 — Cleanup

After all phases:

1. If `AppProviders` only wraps `ErrorToastProvider`, delete `src/providers/app-providers.tsx` and inline `<ErrorToastProvider>` directly in `main.tsx`.
2. Delete all old `context.tsx` files for migrated contexts (or keep as type-only re-export stubs if needed for a single-pass import update).
3. Remove unused imports (`createContext`, `useContext`, `useReducer`, `useMemo`, `useCallback`) from migrated files.

---

## Contexts Kept Unchanged

| Context | File | Reason |
|---|---|---|
| WorkspaceContext | `workspace/context.tsx` | Wraps React Query mutations — not migratable |
| ThemeContext | `shared/components/theme-provider.tsx` | DOM side effects + React Query coupling |
| KeyboardShortcutsContext | `shared/components/keyboard-shortcuts-provider.tsx` | Global event listener + handler ref registry |
| ErrorToastContext | `chat/contexts/error-toast-context.tsx` | Zero React state; thin wrapper over `sonner` |
| McpContext | `mcp/context.tsx` | WIP placeholder |

---

## React Compiler Note

`babel-plugin-react-compiler` is enabled. This means:
- No need to add `useMemo`/`useCallback` in new store files (they are plain TS modules outside React).
- No need for `useShallow` on most consumers — the Compiler handles granular re-renders from destructuring.
- Zustand action functions in `create()` are already stable references (close over `set`/`get`) — fully compatible.

---

## Critical Files

| File | Change |
|---|---|
| `apps/web/package.json` | Add `zustand` dependency |
| `apps/web/src/main.tsx` | Add `initThreadStatusWebSocket()` call; later inline `ErrorToastProvider` |
| `apps/web/src/providers/app-providers.tsx` | Remove 4 providers across phases; delete in cleanup |
| `apps/web/src/routes/__root.tsx` | Remove 4 providers from `RootLayoutGate` across phases |
| `apps/web/src/features/settings/context.tsx` | Replace with `store.ts` |
| `apps/web/src/features/settings/configure-provider-context.tsx` | Replace with `configure-provider-store.ts` |
| `apps/web/src/features/command-palette/context.tsx` | Replace with `store.ts` |
| `apps/web/src/features/file-tree/context.tsx` | Replace with `store.ts` |
| `apps/web/src/features/main-tabs/context.tsx` | Split: types stay, logic moves to `store.ts` |
| `apps/web/src/features/git/context.tsx` | Split: types stay, logic moves to `store.ts` |
| `apps/web/src/features/terminal/context.tsx` | Replace with `store.ts` |
| `apps/web/src/features/chat/thread-status-context.tsx` | Replace with `thread-status-store.ts` |

---

## Verification

After each phase:

```bash
npm run typecheck -w web
```

Dev server smoke tests by phase:
- **Phase 1:** Open/close Settings modal, Configure Provider modal, Command Palette, File Tree
- **Phase 2:** Open tabs, close tabs (verify smart focus), drag-reorder, diff panel workspace switching
- **Phase 3A:** Open terminal, add/close/rename tabs, switch workspaces (PTY stays alive)
- **Phase 3B:** Open a thread, observe streaming → completed → idle transition (5s), navigate away/back

Post-migration grep checks:
```bash
# Should return 0 results in src/ (except deleted files)
grep -r "ThreadStatusProvider\|SettingsModalProvider\|CommandPaletteProvider\|FileTreeProvider\|MainTabsProvider\|DiffPanelProvider\|TerminalProvider\|ConfigureProviderProvider" apps/web/src/
grep -r "useContext" apps/web/src/features/{settings,command-palette,file-tree,main-tabs,git,terminal,chat}/
```
