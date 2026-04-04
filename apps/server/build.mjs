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
  external: ["@silvia-odwyer/photon-node"],
  minify: false,
  sourcemap: true,
});

// Copy the native addon so dist/server.cjs can require() it at runtime
const addonSrc = resolve("node_modules/@silvia-odwyer/photon-node");
const addonDest = resolve("dist/node_modules/@silvia-odwyer/photon-node");
mkdirSync(resolve("dist/node_modules"), { recursive: true });
cpSync(addonSrc, addonDest, { recursive: true });

console.log("Build complete → dist/server.cjs");
