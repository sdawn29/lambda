# lamda

A local-first desktop coding workspace for running Pi agent sessions against real repositories.

## Quick Start

```sh
npm install
npm run dev
```

## What it does

- **Chat** with the Pi coding agent about your code
- **Git** — view diffs, stage, commit, switch branches
- **Terminal** — embedded shell with multi-tab support
- **Workspaces** — organize multiple repos and conversation threads

## Tech Stack

| Layer | Technology |
|-------|------------|
| Desktop | Electron 41 |
| UI | React 19 + Vite + TanStack Router |
| Server | Hono (Node.js) |
| Database | Drizzle ORM + SQLite |
| Agent | @mariozechner/pi-coding-agent |

## Documentation

- [Getting Started](docs/getting-started.md)
- [Architecture](docs/architecture.md)
- [API Reference](docs/api.md)
- [Providers](docs/providers.md)
- [Settings](docs/settings.md)
- [CLI Reference](docs/cli.md)
- [Agent Context](AGENTS.md) — for AI coding agents

## Useful Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start all apps |
| `npm run dev -w web` | Web UI only |
| `npm run dev -w @lamda/server` | Server only |
| `npm run build` | Build everything |
| `npm run build -w desktop` | Build desktop app |
| `npm run check-types` | TypeScript checks |

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_SERVER_URL` | `http://localhost:3001` | Server URL for web UI |
| `PORT` | `3001` | Server port |

## Status

> Early open-source release. Functional but evolving. No automated tests yet.

- macOS `arm64` packaging only
- All data stored locally in SQLite

## Contributing

```sh
# Run checks before submitting PR
npm run build
npm run check-types
npm run lint
```

## Related

- [AGENTS.md](AGENTS.md) — Context for AI coding agents
- [docs/](docs/) — Full documentation