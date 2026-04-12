import { insertMessage } from "@lambda/db";

const ASSISTANT_MESSAGE_CONTENT_KIND = "lambda:assistant-message/v1";

interface BufferEntry {
  threadId: string;
  content: string;
  thinking: string;
}

function serializeAssistantMessage(entry: BufferEntry): string {
  if (!entry.thinking.trim()) return entry.content;

  return JSON.stringify({
    type: ASSISTANT_MESSAGE_CONTENT_KIND,
    content: entry.content,
    thinking: entry.thinking,
  });
}

class MessageBuffer {
  private buffers = new Map<string, BufferEntry>();

  startAssistant(sessionId: string, threadId: string) {
    this.buffers.set(sessionId, { threadId, content: "", thinking: "" });
  }

  appendTextDelta(sessionId: string, delta: string) {
    const entry = this.buffers.get(sessionId);
    if (entry) entry.content += delta;
  }

  appendThinkingDelta(sessionId: string, delta: string) {
    const entry = this.buffers.get(sessionId);
    if (entry) entry.thinking += delta;
  }

  flush(sessionId: string) {
    const entry = this.buffers.get(sessionId);
    this.buffers.delete(sessionId);
    if (!entry || (!entry.content.trim() && !entry.thinking.trim())) return;
    insertMessage(
      entry.threadId,
      "assistant",
      serializeAssistantMessage(entry),
    );
  }

  clear(sessionId: string) {
    this.buffers.delete(sessionId);
  }
}

export const messageBuffer = new MessageBuffer();
