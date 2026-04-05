import { serve } from "@hono/node-server";
import { resolvePort } from "./port.js";
import app from "./app.js";
import { bootstrapSessions } from "./bootstrap.js";

const port = resolvePort();

bootstrapSessions()
  .then(() => {
    serve({ fetch: app.fetch, port, hostname: "127.0.0.1" }, (info) => {
      // Must be first stdout write — apps/desktop/src/main.ts reads this to learn the port
      process.stdout.write(JSON.stringify({ ready: true, port: info.port }) + "\n");
      console.error(`[server] listening on http://127.0.0.1:${info.port}`);
    });
  })
  .catch((err) => {
    console.error("[bootstrap] fatal error:", err);
    process.exit(1);
  });

process.on("SIGTERM", () => process.exit(0));
process.on("SIGINT", () => process.exit(0));
