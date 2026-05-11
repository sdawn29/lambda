# Explore References

## Directory Structure Reference

```
asphalt-code/                          # Root
├── AGENTS.md                         # Main agent context file
├── CLAUDE.md                         # Link to AGENTS.md
├── apps/
│   ├── web/                          # React UI (Vite + TanStack)
│   │   ├── src/
│   │   │   ├── features/             # Feature modules
│   │   │   │   ├── chat/             # Chat UI + streaming
│   │   │   │   ├── git/              # Git operations UI
│   │   │   │   ├── terminal/         # xterm.js terminal
│   │   │   │   ├── settings/         # Provider config
│   │   │   │   ├── workspace/        # Workspace management
│   │   │   │   ├── file-tree/        # File navigation
│   │   │   │   ├── layout/           # Layout components
│   │   │   │   ├── command-palette/  # Cmd+K interface
│   │   │   │   └── electron/         # Desktop integration
│   │   │   ├── shared/               # Shared code
│   │   │   │   ├── ui/               # shadcn/ui components
│   │   │   │   ├── lib/              # Utilities
│   │   │   │   └── hooks/            # React hooks
│   │   │   ├── routes.tsx            # Router setup
│   │   │   └── main.tsx              # App entry
│   │   └── AGENTS.md                 # Web-specific context
│   ├── desktop/                      # Electron shell
│   │   ├── src/
│   │   │   ├── main.ts               # Main process
│   │   │   └── preload.ts            # IPC bridge
│   │   └── AGENTS.md                 # Desktop-specific context
│   └── server/                       # Hono API server
│       └── src/
│           ├── index.ts              # Server entry
│           ├── routes/               # API endpoints
│           ├── services/             # Business logic
│           └── AGENTS.md             # Server-specific context
└── packages/
    ├── db/                           # Drizzle + SQLite
    │   ├── schema/                   # Table definitions
    │   └── migrations/               # SQL migrations
    ├── git/                          # Git CLI wrappers
    ├── mcp/                          # MCP client integration
    └── pi-sdk/                       # Pi agent SDK wrapper
```

## Feature Module Discovery Pattern

Each feature module follows a pattern:

```
features/<name>/
├── components/          # React UI components
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions
├── types.ts             # TypeScript types
├── AGENTS.md            # Feature-specific context (optional)
└── index.ts             # Module exports
```

## Search Patterns

### Finding by Function Name

```bash
# Find function definition
rg "export (async )?function <name>" --type ts

# Find all calls to a function
rg "<name>\(" --type ts

# Find type/interface
rg "(export )?(interface|type) <Name>"
```

### Finding by File Type

```bash
# All React components
find . -name "*.tsx" -path "*/components/*"

# All API routes
find apps/server -name "*.ts" | xargs rg "router\.(get|post|put|delete)"

# All database tables
ls packages/db/schema/
```

### Finding by Concept

```bash
# How is auth handled?
rg "api[Ks]ey|authentication|token" --type ts

# How is streaming implemented?
rg "streamSSE|SSE|ReadableStream" --type ts

# How is git called?
rg "git (diff|stage|commit)" --type ts
```

## Architecture Layer Mapping

### Web → Server Communication

```
Web UI (React)           Server (Hono)
        │                        │
        ├── HTTP POST            │
        │   /session/:id/prompt  │
        │                        │
        ├── HTTP GET             │
        │   /git/status          │
        │                        │
        └── SSE                 │
            /session/:id/events  │
```

### Server → External Tools

```
Server                    External
    │                        │
    ├── git CLI ──────────────┤
    │                        │
    ├── spawn PTY ────────────┤
    │                        │
    └── SQLite ──────────────┤
```

## Common Tracing Flows

### Chat Message Flow

1. User types → `ChatInput` component
2. Submit → `useChat` hook
3. POST → `/session/:id/prompt`
4. Server inserts block → `sessions.ts` route
5. Pi agent starts → `session-service.ts`
6. Events stream → SSE endpoint
7. Client consumes → `useSessionStream` hook
8. React state updates → UI re-renders

### Git Operation Flow

1. User clicks "Stage" → `GitPanel` component
2. POST → `/session/:id/git/stage`
3. Server calls → `gitStage()` from `@lamda/git`
4. Git CLI executes → `git add <file>`
5. Response → updated status
6. UI refreshes → `useGitStatus` hook

### Terminal Flow

1. User opens terminal → `TerminalFeature` component
2. WebSocket connects → `/terminal/ws`
3. User input → sent via WS
4. Server spawns PTY → `terminal-service.ts`
5. Output streams back → WS
6. xterm.js renders → terminal display

## Code Patterns

### API Route Pattern (Hono)

```typescript
// apps/server/src/routes/sessions.ts
import { Hono } from 'hono';
import { sessionService } from '../services/session-service';

const router = new Hono();

router.post('/:id/prompt', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  // ... handler
});

export { router as sessionsRouter };
```

### React Hook Pattern

```typescript
// apps/web/src/features/chat/hooks/useChat.ts
export function useChat(sessionId: string) {
  const queryClient = useQueryClient();
  // ... hook implementation
}
```

### Service Pattern

```typescript
// apps/server/src/services/session-service.ts
import type { ManagedSessionHandle } from '@mariozechner/pi-coding-agent';

const sessions = new Map<string, ManagedSessionHandle>();

export async function createSession(/* ... */) {
  // ... implementation
}
```

## Quick Navigation

| Need to find | Look in |
|--------------|---------|
| React components | `apps/web/src/features/<name>/components/` |
| API handlers | `apps/server/src/routes/` |
| Business logic | `apps/server/src/services/` |
| Database schema | `packages/db/schema/` |
| Git operations | `packages/git/src/` |
| Type definitions | Feature module `types.ts` |
| Tests | Currently none (per AGENTS.md) |