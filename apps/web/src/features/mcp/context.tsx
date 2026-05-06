import React, { createContext, useContext } from "react"
import type { McpServerConfig } from "./types"

/**
 * MCP feature context
 * Provides workspace-specific MCP state
 */
interface McpContextValue {
  workspaceId: string
  servers: McpServerConfig[]
  isLoading: boolean
}

const McpContext = createContext<McpContextValue | null>(null)

interface McpProviderProps {
  workspaceId: string
  children: React.ReactNode
}

export function McpProvider({ workspaceId, children }: McpProviderProps) {
  // Context value will be populated by hooks
  const value: McpContextValue = {
    workspaceId,
    servers: [],
    isLoading: false,
  }

  return (
    <McpContext.Provider value={value}>{children}</McpContext.Provider>
  )
}

export function useMcpContext() {
  const context = useContext(McpContext)
  if (!context) {
    throw new Error("useMcpContext must be used within an McpProvider")
  }
  return context
}
