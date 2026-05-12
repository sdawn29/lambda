# Performance Plan: Native-Like Responsiveness

## Context

This Electron + React 19 + Hono app has several layered performance issues that prevent truly native-like feel. The most impactful ones are: a critical DB bug that silently corrupts block ordering on long threads, unbatched DB writes during streaming causing unnecessary I/O, sidebar-wide re-renders every 60 seconds, and inefficient SQL patterns that load entire datasets to filter one or two rows. Secondary wins come from memoizing recursive UI components and tightening query staleness settings.

---

## Issues by Priority

### 1. CRITICAL BUG — `getNextBlockIndex` returns wrong index
**File:** `packages/db/src/queries/message-blocks.ts:59`

```ts
// BUG: asc returns the MINIMUM block_index, not maximum
.orderBy(asc(messageBlocks.blockIndex))
```

After the 2nd block is inserted every subsequent block gets `blockIndex = 1` because the query always finds the smallest index (0) and adds 1. SQLite's rowid preserves insertion order so the data appears ordered, but the `blockIndex` values are wrong and will break any future sorting, pagination, or replay logic.

**Fix:** Replace with a MAX aggregate:
```ts
import { max, eq } from "drizzle-orm"

function getNextBlockIndex(threadId: string): number {
  const result = db
    .select({ maxIndex: max(messageBlocks.blockIndex) })
    .from(messageBlocks)
    .where(eq(messageBlocks.threadId, threadId))
    .get()
  return (result?.maxIndex ?? -1) + 1
}
```

Also remove the unused `asc` import from the file's import line.

---

### 2. HIGH — `listRunningToolBlocks` loads all blocks into memory
**File:** `packages/db/src/queries/message-blocks.ts:295–304`

The function fetches every block for a thread, converts them all, then filters in JS. On a long thread (500+ blocks) this reads megabytes of data to find 0–2 running tool blocks.

**Fix:** Push the filter into SQL:
```ts
import { and, eq, asc } from "drizzle-orm"

export function listRunningToolBlocks(threadId: string): MessageBlock[] {
  return db
    .select()
    .from(messageBlocks)
    .where(
      and(
        eq(messageBlocks.threadId, threadId),
        eq(messageBlocks.role, "tool"),
        eq(messageBlocks.toolStatus, "running")
      )
    )
    .orderBy(asc(messageBlocks.blockIndex))
    .all()
    .map(toMessageBlock)
}
```

The existing composite index `(thread_id, block_index)` covers the thread filter; the additional `role` / `tool_status` predicates are low-selectivity but still avoid the full table scan in JS.

---

### 3. HIGH — `ThreadRow` not memoized; `useNow()` re-renders all rows every 60s
**File:** `apps/web/src/features/workspace/components/app-sidebar.tsx:77–197`

`useNow()` lives in `AppSidebar` and passes `now` as a prop to every `ThreadRow`. Every 60-second tick re-renders ALL rows in every workspace, even when nothing visual changed for them.

**Fix — two-part:**

**Part A:** Move `useNow()` into `ThreadRow` itself so each row controls its own timestamp:
```ts
// Remove `now` prop from ThreadRow signature and call site
function ThreadRow({ thread, workspaceId, isActive, onClick }) {
  const now = useNow()          // <-- moved here
  ...
}
```

**Part B:** Wrap `ThreadRow` with `React.memo` so Workspace-level state changes don't re-render stable rows:
```ts
const ThreadRow = memo(function ThreadRow({ thread, workspaceId, isActive, onClick }) {
  ...
})
```

Add `memo` to the import from React at the top of the file.

---

### 4. HIGH — Git status capture has no timeout
**File:** `apps/server/src/session-events.ts:131–163`

`capturePreTurnStatus()` calls `gitStatus(this.cwd)` with no timeout. On a large monorepo, network-mounted drive, or heavily modified working tree, this blocks the agent_start broadcast indefinitely. The event is persisted and emitted *after* this promise resolves, so the entire streaming session stalls.

**Fix:** Add a 5-second race timeout; silently swallow on timeout:
```ts
private async capturePreTurnStatus(): Promise<void> {
  if (!this.cwd) return
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("git-status timeout")), 5_000)
  )
  try {
    const raw = await Promise.race([gitStatus(this.cwd), timeout])
    ...
  } catch {
    this.preTurnStatusMap = null
    this.preTurnFileContents = null
  }
}
```

---

### 5. MEDIUM — Text delta persistence is unbatched (50 DB writes/sec during streaming)
**File:** `apps/server/src/session-events.ts:440–443`

Every `text_delta` event immediately issues an SQL UPDATE. At typical LLM speeds (20–50 tokens/sec) this is 20–50 synchronous DB writes per second per streaming session. While SQLite handles this, it is unnecessary I/O that competes with reads and causes latency spikes on slower disks.

**Fix:** Buffer deltas in a class-level accumulator and flush on a 100ms timer (or on `agent_end`):
```ts
// Add to class:
private textDeltaBuffer: string = ""
private thinkingDeltaBuffer: string = ""
private deltaFlushTimer: ReturnType<typeof setTimeout> | null = null

private scheduleDeltaFlush(blockId: string) {
  if (this.deltaFlushTimer) return
  this.deltaFlushTimer = setTimeout(() => {
    this.deltaFlushTimer = null
    if (this.textDeltaBuffer) {
      appendAssistantTextDelta(blockId, this.textDeltaBuffer)
      this.textDeltaBuffer = ""
    }
    if (this.thinkingDeltaBuffer) {
      appendAssistantThinkingDelta(blockId, this.thinkingDeltaBuffer)
      this.thinkingDeltaBuffer = ""
    }
  }, 100)
}

// On message_update text_delta:
this.textDeltaBuffer += assistantEvent.delta
this.scheduleDeltaFlush(blockId)

// On agent_end: clearTimeout + flush immediately before persist
```

---

### 6. MEDIUM — `useMessages` always refetches on mount and window focus
**File:** `apps/web/src/features/chat/queries.ts:75–77`

```ts
staleTime: 0,             // always stale
refetchOnMount: true,
refetchOnWindowFocus: true,
```

With `initialData` from localStorage and the WebSocket stream keeping the query cache current via `setQueryData`, a server round-trip on every thread switch and every window focus is unnecessary overhead (adds ~50–200ms RTT per switch).

**Fix:** Raise `staleTime` and disable focus refetch since the WebSocket invalidates the cache whenever messages arrive:
```ts
staleTime: 5 * 60 * 1000,   // 5 minutes; WS stream keeps data live
refetchOnMount: "always",    // keep for initial load when no WS yet
refetchOnWindowFocus: false, // WS handles freshness
```

Also apply the same pattern to `useContextUsage` and `useSessionStats` (`staleTime: 0` → `staleTime: 30_000`).

---

### 7. MEDIUM — `TreeItem` not memoized; entire tree re-renders on expand
**File:** `apps/web/src/features/file-tree/components/file-tree.tsx:94–164`

Toggling a directory's expanded state causes `FileTree` to re-render, which maps over `tree` and re-renders every `TreeItem`. For a repo with 500+ files this is noticeable jank on every click.

**Fix:** Wrap `TreeItem` with `React.memo`:
```ts
const TreeItem = memo(function TreeItem({ node, depth, expanded, onToggleDir, onSelectFile }) {
  ...
})
```

`onToggleDir` and `onSelectFile` are already stable `useCallback` references so memo will be effective. Add `memo` to the React import.

---

### 8. LOW — `getBlockCount` loads all rows to count them
**File:** `packages/db/src/queries/message-blocks.ts:282–289`

```ts
const result = db.select({ count: messageBlocks.id }).from(messageBlocks)...all()
return result.length  // fetches N rows just to count them
```

**Fix:**
```ts
import { count } from "drizzle-orm"

export function getBlockCount(threadId: string): number {
  const result = db
    .select({ count: count() })
    .from(messageBlocks)
    .where(eq(messageBlocks.threadId, threadId))
    .get()
  return result?.count ?? 0
}
```

---

### 9. LOW — Add `threads(workspace_id)` index for sidebar query
**File:** `packages/db/src/client.ts` (after line 151)

The workspace query that powers the sidebar lists threads by workspace. Without an index on `workspace_id`, SQLite does a full scan of the threads table. Add:
```sql
CREATE INDEX IF NOT EXISTS threads_workspace_idx ON threads(workspace_id);
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `packages/db/src/queries/message-blocks.ts` | Fix `getNextBlockIndex` (#1), fix `listRunningToolBlocks` (#2), fix `getBlockCount` (#8) |
| `apps/web/src/features/workspace/components/app-sidebar.tsx` | Memo + move `useNow` into `ThreadRow` (#3) |
| `apps/server/src/session-events.ts` | Git timeout (#4), delta batching (#5) |
| `apps/web/src/features/chat/queries.ts` | `staleTime` / `refetchOnWindowFocus` (#6) |
| `apps/web/src/features/file-tree/components/file-tree.tsx` | Memo `TreeItem` (#7) |
| `packages/db/src/client.ts` | Add `threads_workspace_idx` (#9) |

---

## Verification

1. **blockIndex bug** — Start a new thread, send 4+ messages. Query SQLite directly: `SELECT block_index FROM message_blocks WHERE thread_id = '...' ORDER BY created_at` — all values should now be sequential (0, 1, 2, 3…).
2. **listRunningToolBlocks** — Profile with Chrome DevTools / Node --prof during a tool-heavy run; the reconnect path should not load hundreds of rows.
3. **ThreadRow memo** — Open React DevTools Profiler, tick 60s clock; only the rows whose data changed should highlight.
4. **Git timeout** — Point the workspace at a large repo; `agent_start` event should arrive within 5s instead of waiting indefinitely.
5. **Delta batching** — Monitor SQLite write count during a long streaming response; writes should be ~10/sec instead of 50/sec.
6. **useMessages staleTime** — Switch between threads rapidly in DevTools Network tab; no redundant `/messages` fetches on each switch.
7. **TreeItem memo** — Open a large repo, toggle a directory; React Profiler should show only the toggled subtree re-rendering.
