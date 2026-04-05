import { build } from "esbuild";
import { cpSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

await build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "cjs",
  outfile: "dist/server.cjs",
  // Cannot bundle native .node addons — externalize and copy alongside bundle
  external: ["@silvia-odwyer/photon-node", "better-sqlite3"],
  minify: false,
  sourcemap: true,
});

// Copy native addons so dist/server.cjs can require() them at runtime
mkdirSync(resolve("dist/node_modules"), { recursive: true });

const addonSrc = resolve("node_modules/@silvia-odwyer/photon-node");
const addonDest = resolve("dist/node_modules/@silvia-odwyer/photon-node");
cpSync(addonSrc, addonDest, { recursive: true });

const bsq3Src = resolve("node_modules/better-sqlite3");
const bsq3Dest = resolve("dist/node_modules/better-sqlite3");
cpSync(bsq3Src, bsq3Dest, { recursive: true });

console.log("Build complete → dist/server.cjs");
