import {
  createAgentSession,
  loadSkills,
  ModelRegistry,
  SessionManager,
} from "@mariozechner/pi-coding-agent";
import { homedir } from "os";
import { join } from "path";
import { buildAuthStorage } from "./auth.js";
import { sessionEventGenerator } from "./stream.js";
import type { ManagedSessionHandle, SdkConfig } from "./types.js";

function buildHandle(session: Awaited<ReturnType<typeof createAgentSession>>["session"], modelRegistry: ModelRegistry, cwd: string): ManagedSessionHandle {
  return {
    prompt: (text) => session.prompt(text),
    abort: () => session.abort(),
    dispose: () => session.dispose(),
    events: () => sessionEventGenerator(session),
    setModel: async (provider, modelId) => {
      const model = modelRegistry.find(provider, modelId);
      if (model) await session.setModel(model);
    },
    setThinkingLevel: (level) => session.setThinkingLevel(level),
    get sessionFile() {
      return session.sessionFile;
    },
    getCommands() {
      // Skills may live in the Pi default (~/.pi/agent/skills/) or the
      // agents-convention alternative (~/.agents/skills/).  Pass both as
      // explicit skillPaths so either layout is discovered.
      const home = homedir();
      const { skills } = loadSkills({
        cwd,
        skillPaths: [
          join(home, ".agents", "skills"),
          join(cwd, ".agents", "skills"),
        ],
      });
      return skills.map((skill) => ({
        name: `skill:${skill.name}`,
        description: skill.description,
        source: "skill" as const,
      }));
    },
  };
}

/**
 * Create a new managed agent session, persisted to disk under ~/.pi/agent/sessions/.
 */
export async function createManagedSession(
  config: SdkConfig,
): Promise<ManagedSessionHandle> {
  const cwd = config.cwd ?? process.cwd();
  const authStorage = buildAuthStorage(config);
  const modelRegistry = ModelRegistry.create(authStorage);
  const sessionManager = SessionManager.create(cwd);

  const model =
    config.provider && config.model
      ? modelRegistry.find(config.provider, config.model)
      : undefined;

  const { session } = await createAgentSession({
    authStorage,
    modelRegistry,
    sessionManager,
    cwd,
    model,
    thinkingLevel: config.thinkingLevel,
  });

  return buildHandle(session, modelRegistry, cwd);
}

/**
 * Resume an existing persisted session from its JSONL file.
 * Previous conversation context is automatically restored by the Pi SDK.
 */
export async function openManagedSession(
  sessionFilePath: string,
  config: SdkConfig = {},
): Promise<ManagedSessionHandle> {
  const cwd = config.cwd ?? process.cwd();
  const authStorage = buildAuthStorage(config);
  const modelRegistry = ModelRegistry.create(authStorage);
  const sessionManager = SessionManager.open(sessionFilePath);

  const { session } = await createAgentSession({
    authStorage,
    modelRegistry,
    sessionManager,
    cwd,
  });

  return buildHandle(session, modelRegistry, cwd);
}
