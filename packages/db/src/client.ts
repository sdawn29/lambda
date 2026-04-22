import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { existsSync, mkdirSync, renameSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import * as schema from "./schema.js";

const APP_DATA_DIR_NAME = ".lamda-code";
const LEGACY_APP_DATA_DIR_NAME = ".lambda-code";
const DB_FILENAME = "db-v2.sqlite";

function resolveDbPath(): string {
  const homeDir = homedir();
  const dir = join(homeDir, APP_DATA_DIR_NAME);
  const legacyDir = join(homeDir, LEGACY_APP_DATA_DIR_NAME);

  if (!existsSync(dir) && existsSync(legacyDir)) {
    try {
      renameSync(legacyDir, dir);
    } catch {
      return join(legacyDir, DB_FILENAME);
    }
  }

  mkdirSync(dir, { recursive: true });
  return join(dir, DB_FILENAME);
}

export const dbPath = resolveDbPath();

let sqliteHandle: Database.Database | null = null;

export function closeDb(): void {
  if (sqliteHandle?.open) {
    sqliteHandle.close();
    sqliteHandle = null;
  }
}

function createDb() {
  const sqlite = new Database(dbPath, { timeout: 10000 });
  sqliteHandle = sqlite;

  sqlite.pragma("busy_timeout = 10000");
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  const db = drizzle(sqlite, { schema });

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workspaces (
      id               TEXT PRIMARY KEY,
      name             TEXT NOT NULL,
      path             TEXT NOT NULL,
      open_with_app_id TEXT,
      created_at       INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS threads (
      id               TEXT PRIMARY KEY,
      workspace_id     TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      title            TEXT NOT NULL DEFAULT 'New Thread',
      session_file     TEXT,
      model_id         TEXT,
      is_stopped       INTEGER NOT NULL DEFAULT 0,
      is_archived      INTEGER NOT NULL DEFAULT 0,
      is_pinned        INTEGER NOT NULL DEFAULT 0,
      last_accessed_at INTEGER,
      created_at       INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS message_blocks (
      id              TEXT PRIMARY KEY,
      thread_id       TEXT NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
      block_index     INTEGER NOT NULL,
      role            TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'tool')),
      content         TEXT,
      thinking        TEXT,
      model           TEXT,
      provider        TEXT,
      thinking_level  TEXT,
      response_time   INTEGER,
      error_message   TEXT,
      tool_call_id    TEXT,
      tool_name       TEXT,
      tool_args       TEXT,
      tool_result     TEXT,
      tool_status     TEXT CHECK(tool_status IN ('running', 'done', 'error')),
      tool_duration   INTEGER,
      tool_start_time INTEGER,
      created_at      INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS messages (
      id         TEXT PRIMARY KEY,
      thread_id  TEXT NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
      role       TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'tool')),
      content    TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS workspaces_path_unique ON workspaces(path);
    CREATE INDEX IF NOT EXISTS message_blocks_thread_idx ON message_blocks(thread_id, block_index);
  `);

  return db;
}

export const db = createDb();
export type Db = typeof db;
