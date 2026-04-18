import { electronServerPortQueryOptions } from "@/features/electron"

import { queryClient } from "./query-client"

let resolvedServerUrl: string | null = null

export function resetServerUrl(): void {
  resolvedServerUrl = null
}

export class ServerUnreachableError extends Error {
  readonly isServerUnreachable = true

  constructor(message: string) {
    super(message)
    this.name = "ServerUnreachableError"
  }
}

export function isServerUnreachableError(
  error: unknown
): error is ServerUnreachableError {
  return (
    error instanceof Error &&
    (error as { isServerUnreachable?: boolean }).isServerUnreachable === true
  )
}

export async function getServerUrl(): Promise<string> {
  if (resolvedServerUrl) return resolvedServerUrl

  if (import.meta.env.VITE_SERVER_URL) {
    resolvedServerUrl = import.meta.env.VITE_SERVER_URL as string
    return resolvedServerUrl
  }

  const port = await queryClient.ensureQueryData(
    electronServerPortQueryOptions()
  )
  if (port === null || port === undefined) {
    throw new ServerUnreachableError(
      "Server is not available — port has not been assigned."
    )
  }
  resolvedServerUrl = `http://localhost:${port}`
  return resolvedServerUrl
}

export function apiUrl(path: string): string {
  if (resolvedServerUrl) return `${resolvedServerUrl}${path}`
  const envUrl = import.meta.env.VITE_SERVER_URL as string | undefined
  if (envUrl) return `${envUrl}${path}`
  throw new ServerUnreachableError(
    "apiUrl called before server URL was resolved."
  )
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const base = await getServerUrl()
  let res: Response
  try {
    res = await fetch(`${base}${path}`, init)
  } catch (err) {
    throw new ServerUnreachableError(
      err instanceof Error
        ? `Server unreachable: ${err.message}`
        : "Server unreachable"
    )
  }
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`API ${res.status}: ${text}`)
  }
  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return undefined as T
  }
  return res.json() as Promise<T>
}
