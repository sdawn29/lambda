import { serve } from "@hono/node-server";
import { resolvePort } from "./port.js";
import app from "./app.js";

const port = resolvePort();

serve({ fetch: app.fetch, port, hostname: "127.0.0.1" }, (info) => {
  // Must be first stdout write — apps/desktop/src/main.ts reads this to learn the port
  process.stdout.write(JSON.stringify({ ready: true, port: info.port }) + "\n");
  console.error(`[server] listening on http://127.0.0.1:${info.port}`);
});

process.on("SIGTERM", () => process.exit(0));;
process.on("SIGINT", () => process.exit(0));
