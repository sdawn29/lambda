import {
  createAgentSession,
  loadSkills,
  ModelRegistry,
  SessionManager,
} from "@mariozechner/pi-coding-agent";
import { existsSync, readdirSync, readFileSync } from "fs";
import { homedir } from "os";
import { basename, join } from "path";
import { buildAuthStorage } from "./auth.js";
import { sessionEventGenerator } from "./stream.js";
import type { ManagedSessionHandle, SdkConfig } from "./types.js";

interface PromptEntry { name: string; description: string }

/** Read .md files from a directory and extract name + description from frontmatter. */
function loadPromptsFromDir(dir: string): PromptEntry[] {
  if (!existsSync(dir)) return [];
  try {
    return readdirSync(dir)
      .filter((f) => f.endsWith(".md"))
      .flatMap((f) => {
        try {
          const raw = readFileSync(join(dir, f), "utf-8");
          const name = basename(f, ".md");
          // Parse optional YAML frontmatter between --- markers
          const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
          let description = "";
          if (fmMatch) {
            const descMatch = fmMatch[1].match(/^description:\s*(.+)$/m);
            description = descMatch?.[1]?.trim() ?? "";
          }
          if (!description) {
            // Fall back to first non-empty body line (truncated)
            const body = fmMatch ? raw.slice(fmMatch[0].length) : raw;
            const firstLine = body.split("\n").find((l) => l.trim());
            description = firstLine ? firstLine.slice(0, 60) : "";
          }
          return [{ name, description }];
        } catch {
          return [];
        }
      });
  } catch {
    return [];
  }
}

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
    getContextUsage() {
      const usage = session.getContextUsage();
      if (!usage) return undefined;
      return {
        tokens: usage.tokens,
        contextWindow: usage.contextWindow,
        percent: usage.percent,
      };
    },
    async compact() {
      await session.compact();
    },
    getAvailableThinkingLevels() {
      return session.getAvailableThinkingLevels();
    },
    getCommands() {
      // Skills and prompts may live in the Pi default (~/.pi/agent/*)
      // or the agents-convention alternative (~/.agents/*).
      // Pass both as explicit paths so either layout is discovered.
      const home = homedir();
      const agentsSkillsGlobal = join(home, ".agents", "skills");
      const agentsSkillsProject = join(cwd, ".agents", "skills");
      const agentsPromptsGlobal = join(home, ".agents", "prompts");
      const agentsPromptsProject = join(cwd, ".agents", "prompts");

      const { skills } = loadSkills({
        cwd,
        skillPaths: [agentsSkillsGlobal, agentsSkillsProject],
      });

      const promptDirs = [
        join(homedir(), ".pi", "agent", "prompts"),  // Pi default
        agentsPromptsGlobal,                          // agents convention global
        join(cwd, ".pi", "prompts"),                  // Pi default project-local
        agentsPromptsProject,                         // agents convention project-local
      ];
      const prompts = promptDirs.flatMap(loadPromptsFromDir);

      const skillCommands = skills.map((skill) => ({
        name: `skill:${skill.name}`,
        description: skill.description,
        source: "skill" as const,
      }));

      const promptCommands = prompts.map((prompt) => ({
        name: prompt.name,
        description: prompt.description,
        source: "prompt" as const,
      }));

      return [...skillCommands, ...promptCommands];
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
