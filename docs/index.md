# lamda Documentation

A local-first desktop coding workspace for running Pi agent sessions against real repositories.

## Quick Links

- [Getting Started](getting-started.md)
- [Architecture](architecture.md)
- [API Reference](api.md)
- [Providers](providers.md)
- [Settings](settings.md)
- [CLI Reference](cli.md)

## What is lamda?

`lamda` is a desktop application that combines:
- **Chat interface** for interacting with the Pi coding agent
- **Git integration** for viewing diffs, staging, committing, and branch management
- **Embedded terminal** with multi-tab support
- **Workspace management** for organizing multiple repositories and conversation threads

## Key Features

| Feature | Description |
|---------|-------------|
| Multi-thread workspaces | Multiple conversation threads per repository |
| Real-time streaming | Live agent responses with tool execution updates |
| Git workflow | Status, diffs, staging, commits, stashes, branches |
| Embedded terminal | xterm.js with WebSocket PTY backend |
| Local-first | All data stored locally in SQLite |
| Multiple providers | Anthropic, OpenAI, Gemini, DeepSeek, and more |

## Project Status

> **Status**: Early open-source release. Functional but evolving.

- No automated test suite yet
- macOS `arm64` packaging only (for now)
- Desktop app is local-first

## Getting Help

- [AGENTS.md](../AGENTS.md) — Context for AI coding agents working on this codebase
- [GitHub Issues](https://github.com/snehasishdawn/lamda/issues) — Report bugs and feature requests