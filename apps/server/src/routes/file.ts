import { Hono } from "hono";
import { readFile, stat } from "node:fs/promises";
import { extname } from "node:path";

const BINARY_MIME_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".bmp": "image/bmp",
  ".ico": "image/x-icon",
  ".tiff": "image/tiff",
  ".tif": "image/tiff",
  ".avif": "image/avif",
}

const file = new Hono();

file.get("/file", async (c) => {
  const path = c.req.query("path");
  if (!path) {
    return c.json({ error: "path query param is required" }, 400);
  }

  try {
    const fileStats = await stat(path);
    if (fileStats.isDirectory()) {
      return c.json({ error: "path is a directory, not a file" }, 400);
    }

    const mimeType = BINARY_MIME_TYPES[extname(path).toLowerCase()];
    if (mimeType) {
      const buffer = await readFile(path);
      return c.body(buffer, 200, { "Content-Type": mimeType });
    }

    const content = await readFile(path, "utf-8");
    return c.text(content);
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});

export default file;
