import { useState, useEffect, useCallback, useRef } from "react"

import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"

import { ChatTextbox } from "@/components/chat-textbox"
import { sendPrompt, getBranch, generateTitle } from "@/api/sessions"
import { apiUrl } from "@/api/client"
import { useWorkspace } from "@/hooks/workspace-context"

interface Message {
  role: "user" | "assistant"
  content: string
}

interface ChatViewProps {
  sessionId: string
  workspaceName: string
  workspaceId: string
  threadId: string
}

export function ChatView({
  sessionId,
  workspaceName,
  workspaceId,
  threadId,
}: ChatViewProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [branch, setBranch] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const hasTitledRef = useRef(false)

  const { setThreadTitle } = useWorkspace()

  useEffect(() => {
    getBranch(sessionId)
      .then((r) => setBranch(r.branch))
      .catch(() => {})
  }, [sessionId])

  useEffect(() => {
    let active = true
    const es = new EventSource(apiUrl(`/session/${sessionId}/events`))

    es.addEventListener("message_start", () => {
      if (!active) return
      setMessages((prev) => [...prev, { role: "assistant", content: "" }])
    })

    es.addEventListener("message_update", (e: MessageEvent) => {
      if (!active) return
      const data = JSON.parse(e.data) as {
        assistantMessageEvent?: { type: string; delta: string }
      }
      if (data.assistantMessageEvent?.type === "text_delta") {
        const delta = data.assistantMessageEvent.delta
        setMessages((prev) => {
          const next = [...prev]
          const last = next[next.length - 1]
          if (last?.role === "assistant") {
            next[next.length - 1] = { ...last, content: last.content + delta }
          }
          return next
        })
      }
    })

    es.addEventListener("agent_end", () => {
      if (!active) return
      setIsLoading(false)
    })

    return () => {
      active = false
      es.close()
    }
  }, [sessionId])

  // Scroll to bottom whenever messages change or loading indicator appears
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  const handleSend = useCallback(
    (text: string) => {
      if (!hasTitledRef.current) {
        hasTitledRef.current = true
        generateTitle(text)
          .then(({ title }) => setThreadTitle(workspaceId, threadId, title))
          .catch(() => {})
      }
      setMessages((prev) => [...prev, { role: "user", content: text }])
      setIsLoading(true)
      sendPrompt(sessionId, text).catch(() => setIsLoading(false))
    },
    [sessionId, workspaceId, threadId, setThreadTitle]
  )

  const footerLabel = `${workspaceName}${branch ? ` / ${branch}` : ""}`

  return (
    <div className="flex h-full flex-col">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 overflow-y-auto px-6 pt-6 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={
              msg.role === "user"
                ? "self-end rounded-xl bg-muted px-4 py-2 text-sm"
                : "prose prose-sm self-start dark:prose-invert"
            }
          >
            {msg.role === "user" ? (
              msg.content
            ) : (
              <Markdown
                remarkPlugins={[remarkGfm]}
                components={{
                  table: ({ children }) => (
                    <div className="my-2 overflow-x-auto rounded-lg border border-border">
                      <table className="w-full border-collapse text-sm">
                        {children}
                      </table>
                    </div>
                  ),
                  thead: ({ children }) => (
                    <thead className="bg-muted/50">{children}</thead>
                  ),
                  th: ({ children }) => (
                    <th className="border-b border-border px-4 py-2 text-left font-medium">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="border-b border-border/50 px-4 py-2 last:border-0">
                      {children}
                    </td>
                  ),
                  tr: ({ children }) => (
                    <tr className="transition-colors hover:bg-muted/30">
                      {children}
                    </tr>
                  ),
                }}
              >
                {msg.content}
              </Markdown>
            )}
          </div>
        ))}
        {isLoading &&
          !(
            messages[messages.length - 1]?.role === "assistant" &&
            messages[messages.length - 1]?.content.length > 0
          ) && (
            <p className="animate-pulse self-start text-sm text-muted-foreground">
              Thinking…
            </p>
          )}
        <div ref={bottomRef} />
      </div>

      <div className="mx-auto w-full max-w-2xl px-6 pb-6">
        <ChatTextbox
          onSend={handleSend}
          isLoading={isLoading}
          footerLabel={footerLabel}
        />
      </div>
    </div>
  )
}
