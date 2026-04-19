import { createManagedSession, type SdkConfig } from "@lamda/pi-sdk";
import { updateThreadSessionFile } from "@lamda/db";
import { store } from "../store.js";
import { sessionEvents } from "../session-events.js";

export async function createSessionForThread(
  threadId: string,
  cwd: string,
  opts: Omit<Partial<SdkConfig>, "cwd"> = {},
): Promise<string> {
  const handle = await createManagedSession({ cwd, ...opts });
  const sessionId = store.create(handle, cwd, threadId);
  if (handle.sessionFile) updateThreadSessionFile(threadId, handle.sessionFile);
  return sessionId;
}

export function ensureSessionEventHub(
  sessionId: string,
  entry: NonNullable<ReturnType<typeof store.get>>,
) {
  return sessionEvents.ensure(sessionId, entry.threadId, entry.handle);
}

export function gitCwd(id: string): string | null {
  return store.getCwd(id) ?? null;
}
