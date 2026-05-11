---
name: explore
description: Codebase exploration and navigation skill. Use when asked to understand the project structure, find files, locate features, trace code paths, or map relationships between modules. Triggers on phrases such as "explore the codebase", "find where X is implemented", "how does X work", "trace the flow of", "map the architecture", or "what files handle X".
metadata:
  author: lamda team
  version: 1.0.0
---

# Explore: Codebase Navigation and Discovery

Codebase exploration skill for understanding project structure, finding files, tracing code paths, and mapping architecture relationships.

## When to Use

- Understanding the overall project structure
- Finding where a specific feature is implemented
- Tracing how data flows through the codebase
- Mapping relationships between modules
- Locating files for a particular feature
- Understanding dependency relationships
- Finding entry points for specific functionality

## When NOT to Use

- Actually modifying or writing code (use regular agent mode)
- Running commands or executing tasks
- Debugging runtime errors (use logs + code reading)
- Finding dead code or code health (use `fallow` skill)

## Core Commands

### Project Structure

```bash
# List top-level structure
ls -la
cat AGENTS.md

# Explore a specific directory
ls -la apps/web/src/features/
ls -la packages/
```

### Finding Files

```bash
# Find files by name pattern
find . -type f -name "*.ts" | grep -i "session"

# Find files by content pattern
rg -l "gitStage" --type ts

# List a module's files
ls -la apps/web/src/features/chat/
```

### Tracing Code Paths

```bash
# Find where a function is defined
rg "export function" --type ts

# Find all usages of a function
rg "gitStage" --type ts

# Find type definitions
rg "interface.*Session" --type ts
```

## Workflows

### 1. Understand Project Architecture

1. Read `AGENTS.md` for high-level overview. If not found, skip to the next step.
2. Read `docs/architecture.md` for technical details. If not found, skip to the next step.
3. List workspace packages: `ls apps/ packages/`
4. Identify entry points for the layer you're interested in.

Fallback: If any file is missing, proceed with the available files and note what was skipped.

### 2. Find a Feature's Implementation

1. Identify the feature domain (chat, git, terminal, etc.).
2. Navigate to the feature directory: `ls apps/web/src/features/<feature>/`. If the directory does not exist, search with `find . -type d -name "<feature>"`.
3. Read the feature's AGENTS.md if available; skip this step if it does not exist.
4. Trace the main components (hooks, components, lib).
5. Find the API route that backs it: `ls apps/server/src/routes/`.

Fallback: If the feature directory is not found, use `rg -l "<feature>" --type ts` to locate relevant files.

### 3. Trace a Data Flow

1. Identify the entry point (user action or API endpoint).
2. Find the handler function.
3. Follow the call chain with `rg` to find called functions. If a function is not found, search by partial name or type.
4. Identify state changes (DB writes, in-memory updates).
5. Find the response/UI update path.

Fallback: If a step in the chain cannot be resolved, document what was found so far and note where the trace stopped.

### 4. Map Module Dependencies

1. Find all imports in a file: `rg "from '@lamda" apps/web/src/features/chat/`
2. Identify cross-package dependencies.
3. Trace shared utilities: `apps/web/src/shared/lib/`
4. Identify the data flow between packages.

Fallback: If a package is not found, check `package.json` workspaces to confirm available packages.

## Codebase Mapping

### Layer Structure

```
apps/web/src/features/    # React UI components and hooks
  ├── chat/               # Chat interface, streaming
  ├── git/                # Git diff, staging, commits
  ├── terminal/           # xterm.js terminal
  ├── settings/           # Provider configuration
  ├── workspace/          # Workspace/thread management
  └── file-tree/          # File navigation

packages/db/             # Drizzle ORM schema + migrations
packages/git/            # Git CLI wrappers
packages/pi-sdk/          # Pi agent SDK wrapper

apps/server/src/routes/   # Hono API endpoints
apps/server/src/services/ # Business logic layer
```

### Key File Types

| Extension | Purpose                    |
| --------- | -------------------------- |
| `*.ts`    | TypeScript source files    |
| `*.tsx`   | React components           |
| `*.sql`   | Drizzle migrations         |
| `.sse.ts` | Server-Sent Event handlers |
| `*.ws.ts` | WebSocket handlers         |

### Finding Entry Points

| Layer            | How to find entry                          |
| ---------------- | ------------------------------------------ |
| React components | `export function` in `.tsx` files          |
| API routes       | `router.post/get/put/delete` in `routes/`  |
| Services         | `export async function` in `services/`     |
| Database         | Table definitions in `packages/db/schema/` |

## Tips

- Use `AGENTS.md` files for quick module understanding
- `rg` (ripgrep) is faster than `find` for content search
- Check `packages/` for reusable utilities before writing new code
- Review `shared/` for existing components before creating new ones
- Trace from UI → API → Service → DB for complete flow understanding

## Quick Reference

| Task                       | Command                                |
| -------------------------- | -------------------------------------- |
| List all features          | `ls apps/web/src/features/`            |
| Find chat implementation   | `ls apps/web/src/features/chat/`       |
| Find API route for feature | `ls apps/server/src/routes/`           |
| Find DB schema for entity  | `ls packages/db/schema/`               |
| Find git wrappers          | `ls packages/git/src/`                 |
| Find shared components     | `ls apps/web/src/shared/ui/`           |
| Find all TypeScript files  | `find . -name "*.ts" -o -name "*.tsx"` |
| Search for implementation  | `rg "functionName" --type ts`          |
