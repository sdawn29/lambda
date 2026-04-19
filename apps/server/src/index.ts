import { serve } from "@hono/node-server";
import { WebSocketServer } from "ws";
import type { WebSocket } from "ws";
import { URL } from "node:url";
import { resolvePort } from "./port.js";
import app from "./app.js";
import { bootstrapSessions } from "./bootstrap.js";
import { handleTerminalConnection } from "./services/terminal-service.js";

const port = resolvePort();

bootstrapSessions()
  .then(() => {
    const server = serve(
      { fetch: app.fetch, port, hostname: "127.0.0.1" },
      (info) => {
        // Must be first stdout write — apps/desktop/src/main.ts reads this to learn the port
        process.stdout.write(JSON.stringify({ ready: true, port: info.port }) + "\n");
        console.error(`[server] listening on http://127.0.0.1:${info.port}`);
      },
    );

    const wss = new WebSocketServer({ noServer: true });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (server as any).on(
      "upgrade",
      (
        request: import("node:http").IncomingMessage,
        socket: import("node:net").Socket,
        head: Buffer,
      ) => {
        const url = new URL(request.url ?? "/", "http://localhost");
        if (url.pathname === "/terminal") {
          wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit("connection", ws, request);
          });
        } else {
          socket.destroy();
        }
      },
    );

    wss.on("connection", (ws: WebSocket, request: import("node:http").IncomingMessage) => {
      handleTerminalConnection(ws, request);
    });
  })
  .catch((err) => {
    console.error("[bootstrap] fatal error:", err);
    process.exit(1);
  });

process.on("SIGTERM", () => process.exit(0));
process.on("SIGINT", () => process.exit(0));
