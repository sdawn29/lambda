# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands can be run from the repo root via Turborepo or from within each app directory directly.

**Root (all apps in parallel):**

```bash
npm run dev          # Start all apps in dev mode
npm run build        # Build all apps
npm run lint         # Lint all apps
npm run check-types  # Type-check all apps
npm run format       # Prettier format everything
```

**Web app only (`apps/web`):**

```bash
npm run dev -w web
npm run build -w web
npm run lint -w web
npm run typecheck -w web
```

**Desktop app only (`apps/desktop`):**

```bash
npm run dev -w desktop      # Start Electron with dev server
npm run check-types -w desktop
```

There are no tests currently.

## Architecture

This is a monorepo (Turborepo + npm workspaces) building an Electron desktop app that wraps a React web UI.

### Apps

- **`apps/web`** — React 19 + Vite + TanStack Router + TanStack React Query + Tailwind CSS + shadcn/ui. This is the renderer/UI layer.
- **`apps/desktop`** — Electron wrapper. Loads the web app in a `BrowserWindow`. Spawns the server as a child process on a random port and communicates the port to the renderer via IPC.
- **`apps/server`** — Hono HTTP + WebSocket server. Manages workspaces, threads, Pi agent sessions, git operations, and terminal (pty) sessions. Runs on a random port (PORT=0) determined at startup.

### Electron IPC Bridge

The boundary between Electron and the web app is defined in two files:

- [apps/desktop/src/preload.ts](apps/desktop/src/preload.ts) — exposes `window.electronAPI` to the renderer via `contextBridge`. Currently exposes:
  - `platform` — OS platform string
  - `selectFolder()` — opens native folder picker dialog
  - `getServerPort()` — returns the port the spawned server is listening on
  - `openPath(path)` — opens a path in Finder/Explorer
- [apps/web/src/types/electron.d.ts](apps/web/src/types/electron.d.ts) — TypeScript types for `window.electronAPI` on the web side.

When adding new IPC channels, add the handler in [apps/desktop/src/main.ts](apps/desktop/src/main.ts), expose it in preload.ts, and add its type in electron.d.ts.

### Routing

Uses **TanStack Router** with file-based routing. The route tree at [apps/web/src/routeTree.gen.ts](apps/web/src/routeTree.gen.ts) is **auto-generated** (read-only — configured as such in `.vscode/settings.json`). Routes live in `apps/web/src/routes/`. Hash-based history is used (required for Electron's `file://` protocol).

Current routes:

- `__root.tsx` — Root layout wrapping all providers and the sidebar shell
- `index.tsx` — Redirects to last-visited thread (stored in localStorage)
- `workspace.$threadId.tsx` — Main thread view: ChatView + optional DiffPanel + optional TerminalPanel
- `settings.tsx` — Settings page: theme selector, data management (reset all), about section

### State Management

- **WorkspaceContext** ([apps/web/src/hooks/workspace-context.tsx](apps/web/src/hooks/workspace-context.tsx)) — backed by **TanStack React Query**. Manages workspace/thread CRUD with optimistic updates. Key methods: `createWorkspace`, `deleteWorkspace`, `createThread`, `setThreadTitle`, `deleteThread`, `resetAll`. `createWorkspace` calls `window.electronAPI?.selectFolder()`, then `POST /workspace`, then navigates to the first thread.
- **DiffPanelContext** ([apps/web/src/hooks/diff-panel-context.tsx](apps/web/src/hooks/diff-panel-context.tsx)) — simple toggle for the diff panel visibility.
- **TerminalContext** ([apps/web/src/hooks/terminal-context.tsx](apps/web/src/hooks/terminal-context.tsx)) — simple toggle for the terminal panel visibility.
- **ThemeProvider** ([apps/web/src/components/theme-provider.tsx](apps/web/src/components/theme-provider.tsx)) — dark/light/system theme with localStorage persistence. Press `d` to toggle.
- No external state library beyond React Query — plain React context for UI toggles.

### UI Components

Components live in `apps/web/src/components/`. Primitive/headless UI components are in the `ui/` subdirectory — these are **shadcn/ui** components using **Base UI React** (not Radix). Use the `cn()` utility from [apps/web/src/lib/utils.ts](apps/web/src/lib/utils.ts) to merge Tailwind classes.

To add a new shadcn component:

```bash
cd apps/web && npx shadcn@latest add <component>
```

The shadcn config ([apps/web/components.json](apps/web/components.json)) uses the `base-mira` style with Lucide icons.

### Key Layout Structure

```
__root.tsx (WorkspaceProvider + ThemeProvider + DiffPanelProvider + TerminalProvider)
  ├─ WorkspaceEmptyState  (shown when no workspaces exist)
  └─ SidebarProvider
       ├─ AppSidebar       (workspace list + threads + new thread button + settings footer)
       ├─ TitleBar         (back/forward nav, draggable, macOS-aware)
       └─ <Outlet />       (route content)
            └─ workspace.$threadId.tsx
                 ├─ ChatView          (keyed by threadId)
                 │    └─ ChatTextbox  (model selector, branch selector, send)
                 ├─ DiffPanel         (toggleable side panel — git status, staging, diff, commit, stash)
                 └─ TerminalPanel     (toggleable bottom panel — xterm.js over WebSocket)
```

The TitleBar uses `-webkit-app-region: drag` for Electron window dragging and adjusts padding for macOS traffic lights based on `window.electronAPI.platform`. The `BrowserWindow` uses `titleBarStyle: "hiddenInset"`.

### AppSidebar

[apps/web/src/components/app-sidebar.tsx](apps/web/src/components/app-sidebar.tsx):

- Lists workspaces; each collapses/expands to show its threads
- Per-workspace dropdown: "Find in Finder" (`window.electronAPI?.openPath()`), "Delete Workspace"
- Per-workspace "New Thread" button
- Active thread highlighted
- Settings button in the footer navigates to `/settings`

### Chat

**ChatView** ([apps/web/src/components/chat-view.tsx](apps/web/src/components/chat-view.tsx)):

- Opens an `EventSource` to `GET /session/:id/events` for streaming
- SSE events handled:
  - `message_start` — push empty assistant message
  - `message_update` — append `text_delta`; tool events update tool call blocks (running/done/error)
  - `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
  - `agent_end` — clear loading state
- Messages persisted via React Query (`useMessages`) and stored server-side in `@lamda/db`
- Renders text with `react-markdown` + `remark-gfm` + Tailwind Typography (`prose prose-sm dark:prose-invert`)
- Tool call blocks rendered inline with status indicators

**ChatTextbox** ([apps/web/src/components/chat-textbox.tsx](apps/web/src/components/chat-textbox.tsx)):

- Model selection dropdown (models grouped by provider, fetched from `/models`)
- Branch selector (`BranchSelector` component — popover with search, calls `POST /session/:id/checkout`)
- Enter to send, Shift+Enter for newline

**Message types** are defined in [apps/web/src/components/chat-types.ts](apps/web/src/components/chat-types.ts): `TextMessage` and `ToolMessage`.

### DiffPanel

[apps/web/src/components/diff-panel.tsx](apps/web/src/components/diff-panel.tsx) — toggleable side panel providing full git workflow:

- Git status display (staged, unstaged, untracked files)
- File-level staging/unstaging and bulk stage-all/unstage-all
- Inline and side-by-side diff views (`DiffView` component using `refractor` for syntax highlighting)
- Commit via `CommitDialog` (file accordion with diffs, commit message input, status color coding: M=yellow, A=green, D=red, U=blue)
- Stash management: stash, list, pop, apply, drop

### TerminalPanel

[apps/web/src/components/terminal-panel.tsx](apps/web/src/components/terminal-panel.tsx) — toggleable bottom terminal:

- `@xterm/xterm` + `@xterm/addon-fit` for terminal emulation
- WebSocket connection to server at `ws://.../terminal?cwd=<workspace-path>`
- Messages: `{ type: "input", data }` and `{ type: "resize", cols, rows }` sent to server; raw terminal output received back
- Vertically resizable via mouse drag
- Dark theme matching app color scheme

### Server API (`apps/server`)

The server is a Hono app ([apps/server/src/app.ts](apps/server/src/app.ts)) started in [apps/server/src/index.ts](apps/server/src/index.ts) which also runs a WebSocket server for terminal sessions (using `node-pty`).

**Workspace & Thread Management:**

| Method   | Path                             | Description                                                       |
| -------- | -------------------------------- | ----------------------------------------------------------------- |
| `GET`    | `/workspaces`                    | List all workspaces with their threads                            |
| `POST`   | `/workspace`                     | Create workspace — body: `{ name, path }` → 409 if already exists |
| `DELETE` | `/workspace/:id`                 | Delete workspace and all its threads/sessions                     |
| `POST`   | `/workspace/:workspaceId/thread` | Create thread in workspace → `{ threadId }`                       |
| `DELETE` | `/thread/:id`                    | Delete thread                                                     |
| `PATCH`  | `/thread/:id/title`              | Update thread title — body: `{ title }`                           |

**Session & Messaging:**

| Method   | Path                    | Description                                                                                                 |
| -------- | ----------------------- | ----------------------------------------------------------------------------------------------------------- |
| `POST`   | `/session`              | Create/reuse session for a thread — body: `{ cwd?, provider?, model?, anthropicApiKey? }` → `{ sessionId }` |
| `DELETE` | `/session/:id`          | Dispose and remove a session                                                                                |
| `POST`   | `/session/:id/prompt`   | Send a prompt (fire-and-forget, 202) — body: `{ text }`                                                     |
| `GET`    | `/session/:id/messages` | Get persisted messages for thread                                                                           |
| `GET`    | `/session/:id/events`   | SSE stream of agent events                                                                                  |
| `POST`   | `/title`                | Generate thread title from first message — body: `{ message }` → `{ title }`                                |

**Branch Operations:**

| Method | Path                    | Description                          |
| ------ | ----------------------- | ------------------------------------ |
| `GET`  | `/session/:id/branch`   | Get current branch name              |
| `GET`  | `/session/:id/branches` | List all branches                    |
| `POST` | `/session/:id/checkout` | Checkout branch — body: `{ branch }` |

**Git Operations:**

| Method | Path                           | Description                                           |
| ------ | ------------------------------ | ----------------------------------------------------- |
| `GET`  | `/session/:id/git/status`      | Git status (staged, unstaged, untracked files)        |
| `GET`  | `/session/:id/git/diff`        | Diff for a file — query: `?file=<path>&status=<code>` |
| `POST` | `/session/:id/git/commit`      | Commit — body: `{ message }`                          |
| `POST` | `/session/:id/git/stage`       | Stage a file — body: `{ file }`                       |
| `POST` | `/session/:id/git/unstage`     | Unstage a file — body: `{ file }`                     |
| `POST` | `/session/:id/git/stage-all`   | Stage all changes                                     |
| `POST` | `/session/:id/git/unstage-all` | Unstage all changes                                   |
| `POST` | `/session/:id/git/stash`       | Stash changes                                         |
| `GET`  | `/session/:id/git/stash-list`  | List stashes                                          |
| `POST` | `/session/:id/git/stash-pop`   | Pop stash — body: `{ index? }`                        |
| `POST` | `/session/:id/git/stash-apply` | Apply stash — body: `{ index? }`                      |
| `POST` | `/session/:id/git/stash-drop`  | Drop stash — body: `{ index }`                        |

**Misc:**

| Method   | Path      | Description                                                    |
| -------- | --------- | -------------------------------------------------------------- |
| `GET`    | `/health` | Uptime check                                                   |
| `GET`    | `/models` | List available models from the Pi SDK                          |
| `DELETE` | `/reset`  | Delete all workspaces/threads/sessions (used by Settings page) |

**WebSocket** (`/terminal?cwd=<path>`): spawns a `node-pty` shell at `cwd`. Client sends `{ type: "input", data }` or `{ type: "resize", cols, rows }`. Server sends raw terminal output as text frames.

### API Clients (`apps/web/src/api/`)

- `client.ts` — `apiFetch()` and `apiUrl()` (base URL from `VITE_SERVER_URL`, or derived from `window.electronAPI?.getServerPort()`)
- `workspaces.ts` — workspace/thread/message CRUD with DTOs
- `sessions.ts` — session lifecycle, prompts, branch ops, title generation
- `git.ts` — complete git command suite (status, diff, commit, stage/unstage, stash ops)

### React Query Hooks (`apps/web/src/queries/` and `mutations/`)

**Queries:**

- `useWorkspaces`, `useMessages`, `useBranch`, `useBranches`
- `useGitStatus`, `useGitFileDiff`, `useGitStashList`
- `useModels`

**Mutations:**

- `useCreateWorkspace`, `useDeleteWorkspace`, `useCreateThread`, `useUpdateThreadTitle`, `useResetAll`
- `useGitCommit`, `useGitStage`, `useGitStageAll`, `useGitStashMutations`, `useCheckoutBranch`
- `useSendPrompt`, `useGenerateTitle`

### Key Dependencies

**Web:**

- `@tanstack/react-router`, `@tanstack/react-query` — routing + server state
- `@xterm/xterm`, `@xterm/addon-fit` — terminal emulation
- `react-markdown`, `remark-gfm` — markdown rendering
- `refractor`, `react-syntax-highlighter` — syntax highlighting in diffs
- `lucide-react` — icons

**Server:**

- `hono`, `@hono/node-server` — HTTP framework
- `node-pty`, `ws` — terminal WebSocket
- `@lamda/git`, `@lamda/db`, `@lamda/pi-sdk` — git ops, persistence, Pi agent SDK

## Pi SDK Reference

When working with the `@mariozechner/pi-coding-agent` SDK, refer to the local installation:

- **Docs:** `/Users/snehasishdawn/.nvm/versions/node/v25.8.2/lib/node_modules/@mariozechner/pi-coding-agent/docs`
- **Examples:** `/Users/snehasishdawn/.nvm/versions/node/v25.8.2/lib/node_modules/@mariozechner/pi-coding-agent/examples`
