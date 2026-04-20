import { memo } from "react"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"
import {
  ArrowDownIcon,
  ArrowUpIcon,
} from "lucide-react"

import { ToolCallBlock } from "./tool-call-block"
import { markdownComponents } from "./markdown-components"
import { UserMessageContent } from "./user-message"
import { ThinkingBlock } from "./thinking-block"
import { CopyButton } from "@/shared/components/copy-button"
import { getProviderMeta } from "@/shared/lib/provider-meta"
import type { SlashCommand } from "../api"
import { type AssistantMessage, type ErrorMessage, type Message } from "../types"

function assistantCopyText(
  message: AssistantMessage,
  includeThinking: boolean
): string {
  const sections: string[] = []

  if (includeThinking && message.thinking.trim()) {
    sections.push(
      message.content.trim()
        ? `Thinking\n${message.thinking.trim()}`
        : message.thinking.trim()
    )
  }

  if (message.content.trim()) {
    sections.push(message.content.trim())
  }

  return sections.join("\n\n")
}

function formatResponseTime(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function estimateTokens(text: string): number {
  return Math.max(1, Math.round(text.length / 4))
}

function formatTokenCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

function TokenCounter({ up, down }: { up?: number; down?: number }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground/50">
      {up != null && (
        <span className="flex items-center gap-0.5">
          <ArrowUpIcon className="h-3 w-3" />
          {formatTokenCount(up)}
        </span>
      )}
      {down != null && (
        <span className="flex items-center gap-0.5">
          <ArrowDownIcon className="h-3 w-3" />
          {formatTokenCount(down)}
        </span>
      )}
    </div>
  )
}

interface AssistantMessageBlockProps {
  message: AssistantMessage
  showThinking: boolean
  /** Render with destructive text color (for role="error" messages) */
  isError?: boolean
}

function AssistantMessageBlock({
  message,
  showThinking,
  isError = false,
}: AssistantMessageBlockProps) {
  const hasThinking = showThinking && message.thinking.trim().length > 0
  const hasContent = message.content.length > 0

  if (!hasThinking && !hasContent) return null

  const providerMeta = message.provider
    ? getProviderMeta(message.provider)
    : null
  const THINKING_LEVEL_LABELS: Record<string, string> = {
    low: "Low",
    medium: "Med",
    high: "High",
    xhigh: "Max",
  }
  const thinkingLabel = message.thinkingLevel
    ? (THINKING_LEVEL_LABELS[message.thinkingLevel] ?? message.thinkingLevel)
    : null
  const hasMeta = !!(message.model ?? message.responseTime != null)

  // Apply destructive text color when rendered as an error
  const proseClass = isError
    ? "prose prose-sm max-w-none dark:prose-invert text-destructive [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_a]:text-destructive [&_a]:underline [&_a]:underline-offset-4"
    : "prose prose-sm max-w-none dark:prose-invert [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"

  return (
    <div className="group flex animate-in flex-col gap-2 duration-300 fade-in-0 slide-in-from-bottom-1">
      {hasThinking && <ThinkingBlock thinking={message.thinking} />}

      {hasContent && (
        <div className={proseClass}>
          <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {message.content}
          </Markdown>
        </div>
      )}

      <div className="flex items-center gap-3">
        {hasMeta && (
          <div className={isError ? "text-xs text-destructive/60" : "text-xs text-muted-foreground"}>
            {providerMeta && (
              <span className="shrink-0">{providerMeta.icon}</span>
            )}
            {message.model && <span>{message.model}</span>}
            {thinkingLabel && (
              <>
                <span className="opacity-40">·</span>
                <span>{thinkingLabel}</span>
              </>
            )}
            {message.responseTime != null && (
              <>
                <span className="opacity-40">·</span>
                <span>{formatResponseTime(message.responseTime)}</span>
              </>
            )}
          </div>
        )}
        <TokenCounter
          up={
            message.thinking.length > 0
              ? estimateTokens(message.thinking)
              : undefined
          }
          down={estimateTokens(message.content)}
        />
        <CopyButton text={assistantCopyText(message, showThinking)} />
      </div>
    </div>
  )
}

export function getMessageKey(message: Message, index: number): string {
  if (message.role === "error") return message.id
  return message.role === "tool" ? message.toolCallId : `${message.role}-${index}`
}

export function estimateMessageSize(message: Message): number {
  if (message.role === "tool") {
    return message.status === "running" ? 84 : 120
  }

  if (message.role === "user") {
    return message.content.length > 220 ? 96 : 68
  }

  const contentLength =
    message.role === "error"
      ? (message as ErrorMessage).message.length
      : (message as AssistantMessage).content.length +
        (message as AssistantMessage).thinking.length
  if (contentLength > 1_200) return 320
  if (contentLength > 400) return 220
  if (contentLength > 120) return 144
  return 104
}

export interface MessageRowProps {
  message: Message
  commandsByName: ReadonlyMap<string, SlashCommand>
  showThinking: boolean
}

export const MessageRow = memo(function MessageRow({
  message,
  commandsByName,
  showThinking,
}: MessageRowProps) {
  if (message.role === "tool") {
    return <ToolCallBlock msg={message} />
  }

  if (message.role === "user") {
    return (
      <div className="group flex animate-in flex-col items-end gap-1.5 self-end duration-200 fade-in-0 slide-in-from-bottom-2">
        <div
          className="rounded-xl bg-muted px-4 py-2.5 text-sm"
          data-selectable
        >
          <UserMessageContent
            content={message.content}
            commandsByName={commandsByName}
          />
        </div>
        <div className="flex items-center gap-2">
          <CopyButton text={message.content} />
          <TokenCounter up={estimateTokens(message.content)} />
        </div>
      </div>
    )
  }

  if (message.role === "error") {
    const errorMsg = message as ErrorMessage
    const assistantLikeMessage: AssistantMessage = {
      role: "assistant",
      content: `**${errorMsg.title}**\n\n${errorMsg.message}`,
      thinking: "",
      ...(errorMsg.retryCount !== undefined
        ? { thinkingLevel: `Retry ${errorMsg.retryCount}` as AssistantMessage["thinkingLevel"] }
        : {}),
    }
    return (
      <AssistantMessageBlock
        message={assistantLikeMessage}
        showThinking={showThinking}
        isError
      />
    )
  }

  return <AssistantMessageBlock message={message} showThinking={showThinking} />
})
