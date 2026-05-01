# Architecture

## Overview

`lamda` is a monorepo with three main application layers:

```
┌─────────────────────────────────────────────────────────┐
│                    Electron Shell                       │
│              (desktop app, native APIs)                │
└────────────────────────┬──────────────────────────────┘
                         │ IPC
                         ▼
┌─────────────────────────────────────────────────────────┐
│                    Web UI (React)                      │
│           (Vite, TanStack Router/Query)                │
│                                                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐    │
│  │  Chat   │ │   Git   │ │Terminal │ │Settings │    │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘    │
└────────────────────────┬──────────────────────────────┘
                         │ HTTP/SSE/WebSocket
                         ▼
┌─────────────────────────────────────────────────────────┐
│                    Hono Server                        │
│               (port 3001, Node.js)                    │
│                                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │ Sessions │ │   Git    │ │ Terminal │            │
│  └──────────┘ └──────────┘ └──────────┘            │
└────────────────────────┬──────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                      SQLite                            │
│              (Drizzle ORM, local persistence)          │
└─────────────────────────────────────────────────────────┘
```

## Application Layers

### Desktop (`apps/desktop/`)

Electron shell that:
- Spawns the Hono server as a child process
- Exposes native APIs (folder selection, file opening, updates)
- Handles IPC communication with the renderer
- Manages app lifecycle and window management

**Key files:**
- `src/main.ts` — Main process entry
- `src/preload.ts` — Preload script for IPC bridge

### Web (`apps/web/`)

React 19 + Vite application with feature modules:

| Module | Path | Purpose |
|--------|------|---------|
| Chat | `src/features/chat/` | Messaging, streaming, tool display |
| Git | `src/features/git/` | Diff view, staging, commits, branches |
| Terminal | `src/features/terminal/` | xterm.js with WebSocket PTY |
| Settings | `src/features/settings/` | Provider config, API keys |
| Workspace | `src/features/workspace/` | Workspace/thread management |
| Electron | `src/features/electron/` | Desktop IPC wrapper |

**Shared components:**
- `src/shared/ui/` — shadcn/ui component library
- `src/shared/lib/` — Utilities and helpers

### Server (`apps/server/`)

Hono API server that:
- Manages Pi agent sessions
- Streams events via SSE
- Handles git operations via CLI wrappers
- Provides WebSocket terminal service
- Persists data to SQLite

**Route modules:**
- `routes/sessions.ts` — Session lifecycle, prompts, SSE events
- `routes/threads.ts` — Thread CRUD, archive, pin
- `routes/workspaces.ts` — Workspace CRUD
- `routes/git.ts` — Git operations
- `routes/terminal.ts` — WebSocket terminal

**Services:**
- `services/session-service.ts` — Session management
- `services/terminal-service.ts` — PTY management
- `services/auth-service.ts` — API key management

## Packages

### `@lamda/db` (`packages/db/`)

Drizzle ORM + SQLite persistence layer:

| Table | Purpose |
|-------|---------|
| `workspaces` | Repository metadata |
| `threads` | Conversation threads |
| `message_blocks` | Messages, thinking, tool calls |
| `settings` | User preferences |

### `@lamda/git` (`packages/git/`)

Git CLI wrapper functions:
- Branch operations (`getCurrentBranch`, `checkoutBranch`, `createBranch`)
- Diff operations (`gitFileDiff`, `gitDiffStat`, `gitStagedDiff`)
- Staging operations (`gitStage`, `gitUnstage`, `gitStageAll`)
- Commit operations (`gitCommit`, `gitPush`)
- Stash operations (`gitStash`, `gitStashPop`)

### `@lamda/pi-sdk` (`packages/pi-sdk/`)

Wrapper around `@mariozechner/pi-coding-agent`:
- Session creation and management
- Prompt handling
- Event streaming
- Model selection
- Thinking level control

## Data Flow

### Chat Message Flow

```
User types message
       │
       ▼
POST /session/:id/prompt
       │
       ▼
Server inserts user block to DB
       │
       ▼
entry.handle.prompt(text) — Pi agent starts
       │
       ├──► Events stream via SSE ◄──┐
       │                             │
       ▼                             │
useSessionStream (web hook)          │
       │                             │
       ▼                             │
React state updates                 │
       │                             │
       ▼                             │
UI renders message delta ────────────┘
```

### Git Operations

```
User clicks "Stage" in UI
       │
       ▼
POST /session/:id/git/stage { filePath: "src/index.ts" }
       │
       ▼
Server calls gitStage(cwd, "src/index.ts")
       │
       ▼
Git CLI executes git add src/index.ts
       │
       ▼
GET /session/:id/git/status returns updated status
```

## State Management

### Server (In-Memory)

```typescript
// store.ts
const store = new Map<sessionId, ManagedSessionHandle>()
```

Sessions are ephemeral — stored in memory and lost on server restart.

### Web (TanStack Query + Context)

- **Server state**: TanStack Query for API data (messages, git status, etc.)
- **UI state**: React Context (theme, sidebar, terminal tabs)
- **Local sync**: localStorage for message cache

## Communication Protocols

### SSE (Server-Sent Events)

Used for real-time streaming from server to client:
- Session events (message deltas, tool calls, thinking)
- Thread status updates

Protocol: Hono's `streamSSE` with write queue pattern

### WebSocket

Used for terminal communication:
- Client → Server: terminal input, resize events
- Server → Client: PTY output, exit codes

Protocol: JSON messages with `type` field

### IPC (Desktop only)

Desktop main process ↔ renderer:
- `electronAPI.selectFolder()` — Native folder picker
- `electronAPI.getServerPort()` — Server port discovery
- `electronAPI.openPath()` — Open files externally

## Build Output

| Package | Output | Format |
|---------|--------|--------|
| `web` | `dist/` | ESM + Vite chunks |
| `server` | `dist/server.cjs` | CommonJS bundle |
| `desktop` | `release/` | `.dmg`, `.zip` |

## Key Conventions

- **TypeScript strict mode** everywhere
- **ESM** in web and packages (`"type": "module"`)
- **CJS** in server (build target via esbuild)
- **npm workspaces** for dependency management
- **Turborepo** for build orchestration