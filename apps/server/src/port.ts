/**
 * Resolve the port to listen on.
 * Priority: PORT env var → --port=N or --port N argv → 3001 default.
 * Passing PORT=0 lets the OS assign a free ephemeral port.
 */
export function resolvePort(): number {
  const fromEnv = process.env.PORT;
  if (fromEnv !== undefined) {
    return parsePort(fromEnv, "PORT env var");
  }

  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;
    const eqMatch = arg.match(/^--port=(\d+)$/);
    if (eqMatch) return parsePort(eqMatch[1]!, "--port");
    if (arg === "--port" && args[i + 1]) {
      return parsePort(args[i + 1]!, "--port");
    }
  }

  return 3001;
}

function parsePort(value: string, source: string): number {
  const n = parseInt(value, 10);
  if (isNaN(n) || n < 0 || n > 65535) {
    throw new Error(`Invalid port from ${source}: ${value}`);
  }
  return n;
}
