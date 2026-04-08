import { rebuild } from "@electron/rebuild";
import { build } from "esbuild";
import { readFileSync } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.resolve(__dirname, "../..");
const serverDir = path.resolve(__dirname, "../server");
const desktopPackageJson = JSON.parse(
  readFileSync(path.join(__dirname, "package.json"), "utf8"),
);
const electronVersion = String(
  desktopPackageJson.devDependencies.electron,
).replace(/^[^\d]*/, "");
const bundleOnly = process.argv.includes("--bundle-only");

function run(command, args, cwd = monorepoRoot) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: "inherit",
      env: process.env,
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(`${command} ${args.join(" ")} failed with exit code ${code}`),
      );
    });
  });
}

await run("npm", ["run", "build", "-w", "web"]);

await rebuild({
  buildPath: serverDir,
  electronVersion,
  arch: "arm64",
  platform: "darwin",
  onlyModules: ["better-sqlite3", "node-pty", "@silvia-odwyer/photon-node"],
});

await run("npm", ["run", "build", "-w", "@lambda/server"]);

await build({
  entryPoints: [path.join(__dirname, "src/main.ts")],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  outfile: path.join(__dirname, "dist/main.js"),
  minify: true,
  sourcemap: false,
  external: ["electron", "esbuild"],
});

await build({
  entryPoints: [path.join(__dirname, "src/preload.ts")],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "cjs",
  outfile: path.join(__dirname, "dist/preload.cjs"),
  minify: true,
  sourcemap: false,
  external: ["electron"],
});

if (!bundleOnly) {
  await run(
    path.join(monorepoRoot, "node_modules", ".bin", "electron-builder"),
    ["--mac", "dmg", "zip", "--arm64", "--publish", "never"],
    __dirname,
  );
}
