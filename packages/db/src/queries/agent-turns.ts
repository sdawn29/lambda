import { eq, desc, inArray } from "drizzle-orm";
import { db } from "../client.js";
import { agentTurns, agentTurnFiles } from "../schema.js";

export interface AgentTurnFileSummary {
  filePath: string;
  postStatusCode: string;
  wasCreatedByTurn: boolean;
}

export interface AgentTurnSummary {
  id: number;
  sessionId: string;
  startedAt: number;
  endedAt: number;
  files: AgentTurnFileSummary[];
}

export interface AgentTurnFileDetail {
  filePath: string;
  postStatusCode: string;
  preStatusCode: string;
  preContent: string | null;
  wasCreatedByTurn: boolean;
}

export function insertAgentTurn(data: {
  sessionId: string;
  threadId: string;
  startedAt: number;
  endedAt: number;
  files: AgentTurnFileDetail[];
}): void {
  const [turn] = db
    .insert(agentTurns)
    .values({
      sessionId: data.sessionId,
      threadId: data.threadId,
      startedAt: data.startedAt,
      endedAt: data.endedAt,
    })
    .returning()
    .all();

  if (!turn || data.files.length === 0) return;

  db.insert(agentTurnFiles)
    .values(
      data.files.map((f) => ({
        turnId: turn.id,
        filePath: f.filePath,
        postStatusCode: f.postStatusCode,
        preStatusCode: f.preStatusCode,
        preContent: f.preContent,
        wasCreatedByTurn: f.wasCreatedByTurn,
      }))
    )
    .run();
}

export function listAgentTurns(threadId: string): AgentTurnSummary[] {
  const turns = db
    .select()
    .from(agentTurns)
    .where(eq(agentTurns.threadId, threadId))
    .orderBy(desc(agentTurns.id))
    .all();

  if (turns.length === 0) return [];

  const turnIds = turns.map((t) => t.id);
  const files = db
    .select()
    .from(agentTurnFiles)
    .where(inArray(agentTurnFiles.turnId, turnIds))
    .all();

  const filesByTurn = new Map<number, AgentTurnFileSummary[]>();
  for (const f of files) {
    const list = filesByTurn.get(f.turnId) ?? [];
    list.push({
      filePath: f.filePath,
      postStatusCode: f.postStatusCode,
      wasCreatedByTurn: f.wasCreatedByTurn,
    });
    filesByTurn.set(f.turnId, list);
  }

  return turns.map((t) => ({
    id: t.id,
    sessionId: t.sessionId,
    startedAt: t.startedAt,
    endedAt: t.endedAt,
    files: filesByTurn.get(t.id) ?? [],
  }));
}

export function getAgentTurnFiles(turnId: number): AgentTurnFileDetail[] {
  return db
    .select()
    .from(agentTurnFiles)
    .where(eq(agentTurnFiles.turnId, turnId))
    .all()
    .map((f) => ({
      filePath: f.filePath,
      postStatusCode: f.postStatusCode,
      preStatusCode: f.preStatusCode,
      preContent: f.preContent,
      wasCreatedByTurn: f.wasCreatedByTurn,
    }));
}
