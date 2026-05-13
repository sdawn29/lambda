import { createAgentSession, createReadOnlyTools, ModelRegistry, SessionManager } from "@earendil-works/pi-coding-agent"
import type { AgentSession } from "@earendil-works/pi-coding-agent"
import { buildAuthStorage } from "./auth.js"
import { sessionEventGenerator } from "./stream.js"
import type { ManagedSessionHandle, ManagedSessionStats, SdkConfig, SessionTokenStats } from "./types.js"

function buildHandle(session: AgentSession): ManagedSessionHandle {
  return {
    prompt: (text, options) => session.prompt(text, options as any),
    steer: (text) => session.steer(text),
    followUp: (text) => session.followUp(text),
    abort: () => session.abort(),
    dispose: () => session.dispose(),
    events: () => sessionEventGenerator(session),
    setModel: async (provider, modelId) => {
      const registry = (session as any).modelRegistry
      if (registry) {
        const model = registry.find(provider, modelId)
        if (model) await session.setModel(model)
      }
    },
    setThinkingLevel: (level) => session.setThinkingLevel(level as any),
    get sessionFile() { return session.sessionFile },
    getContextUsage() {
      const usage = session.getContextUsage()
      if (!usage) return undefined
      return { tokens: usage.tokens, contextWindow: usage.contextWindow, percent: usage.percent }
    },
    async compact() { await session.compact() },
    getAvailableThinkingLevels: () => session.getAvailableThinkingLevels() as string[],
    getCommands() {
      const { skills } = session.resourceLoader.getSkills()
      const { prompts } = session.resourceLoader.getPrompts()
      return [
        ...skills.map((s) => ({ name: `skill:${s.name}`, description: s.description, source: "skill" as const })),
        ...prompts.map((p) => ({ name: p.name, description: p.description, source: "prompt" as const })),
      ]
    },
    getSessionStats(): ManagedSessionStats {
      const stats = session.getSessionStats()
      return {
        sessionFile: stats.sessionFile ?? null,
        sessionId: stats.sessionId,
        userMessages: stats.userMessages,
        assistantMessages: stats.assistantMessages,
        toolCalls: stats.toolCalls,
        toolResults: stats.toolResults,
        totalMessages: stats.totalMessages,
        tokens: stats.tokens as SessionTokenStats,
        cost: stats.cost,
        contextUsage: stats.contextUsage,
      }
    },
    setCustomTools: (tools) => {
      const s = session as any
      s._customTools = tools
      s._refreshToolRegistry()
    },
  }
}

/**
 * Create a new managed agent session, persisted to disk under ~/.pi/agent/sessions/.
 */
export async function createManagedSession(config: SdkConfig): Promise<ManagedSessionHandle> {
  const cwd = config.cwd ?? process.cwd()
  const authStorage = config.authStorage ?? buildAuthStorage(config)
  const modelRegistry = config.modelRegistry ?? ModelRegistry.create(authStorage)
  const sessionManager = SessionManager.create(cwd)

  const model = config.provider && config.model ? modelRegistry.find(config.provider, config.model) : undefined

  const baseTools = createReadOnlyTools(cwd)
  const tools = config.customTools ? [...baseTools, ...config.customTools] : baseTools

  const { session } = await createAgentSession({
    authStorage,
    modelRegistry,
    sessionManager,
    cwd,
    model,
    thinkingLevel: config.thinkingLevel as any,
    customTools: tools,
  })

  return buildHandle(session)
}

/**
 * Resume an existing persisted session from its JSONL file.
 * Previous conversation context is automatically restored by the Pi SDK.
 */
export async function openManagedSession(sessionFilePath: string, config: SdkConfig = {}): Promise<ManagedSessionHandle> {
  const cwd = config.cwd ?? process.cwd()
  const authStorage = config.authStorage ?? buildAuthStorage(config)
  const modelRegistry = config.modelRegistry ?? ModelRegistry.create(authStorage)
  const sessionManager = SessionManager.open(sessionFilePath)

  const baseTools = createReadOnlyTools(cwd)
  const tools = config.customTools ? [...baseTools, ...config.customTools] : baseTools

  const { session } = await createAgentSession({
    authStorage,
    modelRegistry,
    sessionManager,
    cwd,
    customTools: tools,
  })

  return buildHandle(session)
}