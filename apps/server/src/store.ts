import { randomUUID } from "node:crypto";
import type { ManagedSessionHandle } from "@asphalt/pi-sdk";

interface StoredSession {
  handle: ManagedSessionHandle;
  createdAt: number;
  cwd: string;
}

class SessionStore {
  private sessions = new Map<string, StoredSession>();

  create(handle: ManagedSessionHandle, cwd: string): string {
    const id = randomUUID();
    this.sessions.set(id, { handle, createdAt: Date.now(), cwd });
    return id;
  }

  get(id: string): StoredSession | undefined {
    return this.sessions.get(id);
  }

  has(id: string): boolean {
    return this.sessions.has(id);
  }

  getCwd(id: string): string | undefined {
    return this.sessions.get(id)?.cwd;
  }

  delete(id: string): boolean {
    const entry = this.sessions.get(id);
    if (!entry) return false;
    entry.handle.dispose();
    this.sessions.delete(id);
    return true;
  }
}

export const store = new SessionStore();
