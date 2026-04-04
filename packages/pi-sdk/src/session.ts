import {
  createAgentSession,
  ModelRegistry,
  SessionManager,
} from "@mariozechner/pi-coding-agent";
import { buildAuthStorage } from "./auth.js";
import { sessionEventGenerator } from "./stream.js";
import type { ManagedSessionHandle, SdkConfig } from "./types.js";

/**
 * Create a managed agent session wrapping @mariozechner/pi-coding-agent.
 *
 * Auth is resolved from config.anthropicApiKey → ANTHROPIC_API_KEY env → auth.json.
 * Sessions are stored in-memory (not persisted to disk).
 */
export async function createManagedSession(
  config: SdkConfig,
): Promise<ManagedSessionHandle> {
  const authStorage = buildAuthStorage(config);
  const modelRegistry = ModelRegistry.create(authStorage);
  const sessionManager = SessionManager.inMemory(config.cwd ?? process.cwd());

  const { session } = await createAgentSession({
    authStorage,
    modelRegistry,
    sessionManager,
    cwd: config.cwd ?? process.cwd(),
  });

  return {
    prompt: (text) => session.prompt(text),
    abort: () => session.abort(),
    dispose: () => session.dispose(),
    events: () => sessionEventGenerator(session),
  };
}
