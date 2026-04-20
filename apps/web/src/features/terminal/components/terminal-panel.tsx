import { useEffect, useRef, memo } from "react"
import { Terminal } from "@xterm/xterm"
import { FitAddon } from "@xterm/addon-fit"
import { X } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { useTheme } from "@/shared/components/theme-provider"
import { useTerminal } from "../context"
import { getServerUrl } from "@/shared/lib/client"
import "@xterm/xterm/css/xterm.css"
const TERMINAL_OUTPUT_FLUSH_MS = 16
const TERMINAL_IMMEDIATE_FLUSH_THRESHOLD = 8_192

const DARK_TERMINAL_THEME = {
  background: "#101010",
  foreground: "#c8c8c8",
  cursor: "#1e6ef4",
  cursorAccent: "#101010",
  selectionBackground: "#1e6ef428",
  black: "#171717",
  red: "#c86858",
  green: "#7a9a5a",
  yellow: "#c8a848",
  blue: "#1e6ef4",
  magenta: "#a898c8",
  cyan: "#4d8cf6",
  white: "#c8c8c8",
  brightBlack: "#686868",
  brightRed: "#d87868",
  brightGreen: "#90b070",
  brightYellow: "#d8b858",
  brightBlue: "#7ca9ff",
  brightMagenta: "#c0b0d8",
  brightCyan: "#9bc3ff",
  brightWhite: "#d8d8d8",
}

const LIGHT_TERMINAL_THEME = {
  background: "#f5f5f0",
  foreground: "#1a1a1a",
  cursor: "#1e6ef4",
  cursorAccent: "#f5f5f0",
  selectionBackground: "#1e6ef428",
  black: "#1a1a1a",
  red: "#b84838",
  green: "#6a8a4a",
  yellow: "#b89838",
  blue: "#1e6ef4",
  magenta: "#8878a8",
  cyan: "#5a7a92",
  white: "#d8d8d4",
  brightBlack: "#6a6a6a",
  brightRed: "#c86858",
  brightGreen: "#7a9a5a",
  brightYellow: "#c8a848",
  brightBlue: "#4d8cf6",
  brightMagenta: "#a898c8",
  brightCyan: "#7898b0",
  brightWhite: "#ffffff",
}

interface TerminalPanelProps {
  cwd: string
}

export const TerminalPanel = memo(function TerminalPanel({
  cwd,
}: TerminalPanelProps) {
  const { close } = useTerminal()
  const { resolvedTheme } = useTheme()
  const containerRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<Terminal | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const terminalTheme =
    resolvedTheme === "dark" ? DARK_TERMINAL_THEME : LIGHT_TERMINAL_THEME

  // Initialize xterm + WebSocket once
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 13,
      fontFamily:
        '"JetBrains Mono", "Menlo", "Monaco", "Courier New", monospace',
      scrollback: 500,
      theme: document.documentElement.classList.contains("dark")
        ? DARK_TERMINAL_THEME
        : LIGHT_TERMINAL_THEME,
    })

    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)
    term.open(container)
    fitAddon.fit()

    termRef.current = term
    fitAddonRef.current = fitAddon

    let cancelled = false
    let ws: WebSocket | null = null
    let pendingOutput = ""
    let flushTimeout: number | null = null

    const flushOutput = () => {
      flushTimeout = null
      if (!pendingOutput) return
      term.write(pendingOutput)
      pendingOutput = ""
    }

    const scheduleFlush = (delay = TERMINAL_OUTPUT_FLUSH_MS) => {
      if (flushTimeout !== null) {
        if (delay !== 0) return
        window.clearTimeout(flushTimeout)
      }
      flushTimeout = window.setTimeout(flushOutput, delay)
    }

    const resizeObserver = new ResizeObserver(() => {
      fitAddon.fit()
      const dims = fitAddon.proposeDimensions()
      if (dims && ws?.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({ type: "resize", cols: dims.cols, rows: dims.rows })
        )
      }
    })
    resizeObserver.observe(container)

    getServerUrl().then((serverUrl) => {
      if (cancelled) return
      const wsBase = serverUrl.replace(/^http/, "ws")
      const url = `${wsBase}/terminal?cwd=${encodeURIComponent(cwd)}`
      ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => {
        const dims = fitAddon.proposeDimensions()
        if (dims) {
          ws!.send(
            JSON.stringify({ type: "resize", cols: dims.cols, rows: dims.rows })
          )
        }
      }

      ws.onmessage = (e) => {
        if (typeof e.data !== "string") return
        pendingOutput += e.data
        scheduleFlush(
          pendingOutput.length >= TERMINAL_IMMEDIATE_FLUSH_THRESHOLD
            ? 0
            : undefined
        )
      }

      ws.onclose = () => {
        if (pendingOutput) flushOutput()
        term.write("\r\n\x1b[31m[disconnected]\x1b[0m\r\n")
      }

      term.onData((data) => {
        if (ws?.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "input", data }))
        }
      })
    })

    return () => {
      cancelled = true
      if (flushTimeout !== null) {
        window.clearTimeout(flushTimeout)
      }
      pendingOutput = ""
      resizeObserver.disconnect()
      ws?.close()
      term.dispose()
      termRef.current = null
      fitAddonRef.current = null
      wsRef.current = null
    }
  }, [cwd])

  useEffect(() => {
    const term = termRef.current
    if (!term) return

    term.options.theme = terminalTheme
  }, [terminalTheme])

  return (
    <div className="flex h-full shrink-0 flex-col border-t bg-background">
      {/* Header */}
      <div className="flex h-8 shrink-0 items-center justify-between border-b px-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">
            terminal
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          className="h-5 w-5 text-muted-foreground hover:text-foreground"
          onClick={close}
        >
          <X className="h-3 w-3" />
          <span className="sr-only">Close terminal</span>
        </Button>
      </div>

      {/* xterm container */}
      <div
        ref={containerRef}
        className="min-h-0 flex-1 overflow-hidden px-2 py-1"
      />
    </div>
  )
})
