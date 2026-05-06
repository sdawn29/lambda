import {
  AuthStorage,
  ModelRegistry,
} from "@mariozechner/pi-coding-agent";
import { getSupportedThinkingLevels } from "@mariozechner/pi-ai";
import type { ModelInfo } from "./types.js";

// Cached instances for getAvailableModels()
let cachedAuthStorage: AuthStorage | undefined;
let cachedModelRegistry: ModelRegistry | undefined;

/**
 * Returns all models available to the pi-coding-agent SDK.
 * Uses cached instances to avoid repeated initialization.
 */
export function getAvailableModels(): ModelInfo[] {
  if (!cachedAuthStorage) {
    cachedAuthStorage = AuthStorage.create();
  }
  if (!cachedModelRegistry) {
    cachedModelRegistry = ModelRegistry.create(cachedAuthStorage);
  }

  return cachedModelRegistry.getAvailable().map((m) => {
    const reasoning = m.reasoning ?? false;
    return {
      id: m.id,
      name: m.name,
      provider: m.provider,
      reasoning,
      thinkingLevels: reasoning
        ? getSupportedThinkingLevels(m).filter((level) => level !== "off")
        : [],
    };
  });
}
