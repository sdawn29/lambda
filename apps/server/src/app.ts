import { Hono } from "hono";
import { cors } from "hono/cors";
import { streamSSE } from "hono/streaming";
import { createManagedSession, getAvailableModels, generateThreadTitle, type SdkConfig } from "@asphalt/pi-sdk";
import { getCurrentBranch } from "@asphalt/git";
import { store } from "./store.js";

const app = new Hono();

app.use(cors());

app.get("/health", (c) =>
  c.json({ status: "ok", uptime: process.uptime() }),
);

app.get("/models", (c) => {
  return c.json({ models: getAvailableModels() });
});

app.post("/title", async (c) => {
  const body = await c.req.json<{ message?: string; provider?: string; model?: string }>().catch((): { message?: string; provider?: string; model?: string } => ({}));
  if (!body.message) return c.json({ error: "message is required" }, 400);
  const title = await generateThreadTitle(body.message, {
    provider: body.provider,
    model: body.model,
  });
  return c.json({ title });
});

app.post("/session", async (c) => {
  const body = await c.req.json<Partial<SdkConfig>>().catch((): Partial<SdkConfig> => ({}));
  const config: SdkConfig = {
    anthropicApiKey: body.anthropicApiKey,
    cwd: body.cwd,
    provider: body.provider,
    model: body.model,
  };
  const handle = await createManagedSession(config);
  const resolvedCwd = body.cwd ?? process.cwd();
  const sessionId = store.create(handle, resolvedCwd);
  return c.json({ sessionId }, 201);
});

app.delete("/session/:id", (c) => {
  const id = c.req.param("id");
  if (!store.delete(id)) return c.json({ error: "Not found" }, 404);
  return new Response(null, { status: 204 });
});

app.post("/session/:id/prompt", async (c) => {
  const id = c.req.param("id");
  const entry = store.get(id);
  if (!entry) return c.json({ error: "Not found" }, 404);

  const body = await c.req.json<{ text?: string }>().catch((): { text?: string } => ({}));
  if (!body.text) return c.json({ error: "text is required" }, 400);

  // Fire and forget — events arrive via GET /session/:id/events
  entry.handle.prompt(body.text).catch((err: unknown) => {
    console.error(`[prompt:${id}]`, err);
  });

  return c.json({ accepted: true }, 202);
});

app.get("/session/:id/branch", async (c) => {
  const cwd = store.getCwd(c.req.param("id"));
  if (!cwd) return c.json({ branch: null });
  const branch = await getCurrentBranch(cwd);
  return c.json({ branch });
});

app.get("/session/:id/events", async (c) => {
  const id = c.req.param("id");
  const entry = store.get(id);
  if (!entry) return c.json({ error: "Not found" }, 404);

  return streamSSE(c, async (stream) => {
    const generator = entry.handle.events();

    stream.onAbort(async () => {
      await generator.return(undefined);
    });

    for await (const event of generator) {
      let data: string;
      try {
        data = JSON.stringify(event);
      } catch {
        data = JSON.stringify({ serializeError: true, type: event.type });
      }
      await stream.writeSSE({ event: event.type, data });
    }
  });
});

export default app;
