const FILE_TYPE_COLORS: Record<string, string> = {
  // TypeScript
  ts: "#3178c6",
  tsx: "#3178c6",
  mts: "#3178c6",
  cts: "#3178c6",
  // JavaScript
  js: "#f0db4f",
  jsx: "#f0db4f",
  mjs: "#f0db4f",
  cjs: "#f0db4f",
  // CSS
  css: "#a855f7",
  scss: "#cc6699",
  less: "#1d365d",
  // Markup
  html: "#e34c26",
  htm: "#e34c26",
  xml: "#e37933",
  svg: "#ff9900",
  // Data
  json: "#10b981",
  jsonc: "#10b981",
  yaml: "#cb171e",
  yml: "#cb171e",
  toml: "#9c4221",
  // Docs
  md: "#6b7280",
  mdx: "#6b7280",
  txt: "#9ca3af",
  // Images
  png: "#f97316",
  jpg: "#f97316",
  jpeg: "#f97316",
  gif: "#f97316",
  webp: "#f97316",
  // Scripts
  sh: "#89e051",
  bash: "#89e051",
  zsh: "#89e051",
  // Languages
  py: "#3572a5",
  rb: "#cc0000",
  go: "#00add8",
  rs: "#dea584",
  java: "#b07219",
  kt: "#a97bff",
  swift: "#f05138",
  c: "#555555",
  cpp: "#f34b7d",
  cs: "#178600",
  // Query
  sql: "#e38c00",
  graphql: "#e10098",
  gql: "#e10098",
}

export function getFileTypeColor(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? ""
  return FILE_TYPE_COLORS[ext] ?? "#6b7280"
}
