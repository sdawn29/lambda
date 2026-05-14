import { useState, useEffect, useLayoutEffect, useCallback, useRef, useMemo } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type { AssistantMessage, ErrorAction } from "../types"
import {
  ArrowDownIcon,
  Code2Icon,
  BugIcon,
  TestTubeIcon,
  PlugZapIcon,
  Wand2Icon,
  FileSearchIcon,
  GitBranchIcon,
} from "lucide-react"

import { useShortcutHandler } from "@/shared/components/keyboard-shortcuts-provider"
import { SHORTCUT_ACTIONS } from "@/shared/lib/keyboard-shortcuts"
import { ChatTextbox, type ChatTextboxHandle } from "./chat-textbox"
import { MessageRow, getMessageKey } from "./message-row"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/shared/ui/alert-dialog"
import { Button } from "@/shared/ui/button"
import { useSlashCommands, useSessionStats, chatKeys } from "../queries"
import { useBranch } from "@/features/git/queries"
import { useBranches } from "@/features/git/queries"
import { useCheckoutBranch } from "@/features/git/mutations"
import { useAbortSession, useGenerateTitle, useSendPrompt } from "../mutations"
import { useModels } from "../queries"
import { useConfigureProvider } from "@/features/settings"
import { ThinkingIndicator } from "./thinking-indicator"
import { CompactingIndicator } from "./compacting-indicator"
import { useShowThinkingSetting } from "@/shared/lib/thinking-visibility"
import {
  useUpdateThreadModel,
  useUpdateThreadStopped,
  useUpdateThreadTitle,
} from "@/features/workspace/mutations"
import { useChatStream } from "../use-chat-stream"
import { getChatSyncEngine } from "../hooks/use-chat-sync-engine"
import { FileChangesCard } from "./file-changes-card"
import { useMainTabs } from "@/features/main-tabs"

const PROMPT_SUGGESTIONS = [
  { icon: Code2Icon, text: "Explain this codebase", description: "Walk me through the project structure and key patterns" },
  { icon: BugIcon, text: "Debug an issue", description: "Describe a bug and let me investigate the root cause" },
  { icon: TestTubeIcon, text: "Write tests", description: "Add unit, integration, or end-to-end test coverage" },
  { icon: Wand2Icon, text: "Refactor code", description: "Improve readability, structure, or performance" },
  { icon: FileSearchIcon, text: "Find something", description: "Locate a function, component, or pattern" },
  { icon: GitBranchIcon, text: "Review changes", description: "Explain recent git changes in plain language" },
] as const

interface ChatViewProps {
  sessionId: string
  workspaceId: string
  threadId: string
  initialModelId: string | null
  initialIsStopped: boolean
}

export function ChatView({
  sessionId,
  workspaceId,
  threadId,
  initialModelId,
  initialIsStopped,
}: ChatViewProps) {
  const queryClient = useQueryClient()
  const syncEngine = getChatSyncEngine()
  const showThinkingSetting = useShowThinkingSetting()
  const { data: models, isLoading: modelsLoading } = useModels()
  const { openConfigure } = useConfigureProvider()
  const noProvider = !modelsLoading && !models?.models?.length

  const {
    visibleMessages,
    hasConversationHistory,
    isLoading,
    isCompacting,
    startUserPrompt,
    markStopped,
    markSendFailed,
    dismissError,
  } = useChatStream({
    sessionId,
    threadId,
    initialIsStopped,
  })

  const [gitError, setGitError] = useState<string | null>(null)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [selectedModelId, setSelectedModelId] = useState<string | null>(
    initialModelId
  )
  const updateThreadModel = useUpdateThreadModel()
  const updateThreadStopped = useUpdateThreadStopped()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const pinnedRef = useRef(false)
  const initialScrollDoneRef = useRef(false)
  const chatTextboxRef = useRef<ChatTextboxHandle>(null)
  // Messages present on the first non-empty render (from cache) skip entry animations.
  // Only messages that arrive after the initial snapshot get animate-in treatment.
  // State (not a ref) so it can be safely read during render.
  const [initialSnapshot, setInitialSnapshot] = useState<{ sessionId: string; keys: Set<string> } | null>(null)
  // Tracks the last-rendered session so we can detect switches during render.
  const [localSessionId, setLocalSessionId] = useState(sessionId)
  const scrollSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const updateTitleMutation = useUpdateThreadTitle()
  const { confirmThread } = useMainTabs()

  // React's "adjusting state while rendering" pattern — reset all session-local
  // state in one batched pass when the active session changes, avoiding the
  // setState-inside-effect cascade that React 19 rejects.
  if (localSessionId !== sessionId) {
    setLocalSessionId(sessionId)
    setGitError(null)
    setShowScrollButton(false)
    setSelectedModelId(initialModelId)
  }

  // Capture initial keys for this session as soon as messages are available,
  // also during render so isNewMessage is correct on the very same frame.
  if (
    visibleMessages.length > 0 &&
    (initialSnapshot === null || initialSnapshot.sessionId !== sessionId)
  ) {
    setInitialSnapshot({
      sessionId,
      keys: new Set(visibleMessages.map((m, i) => getMessageKey(m, i))),
    })
  }

  // Focus textbox whenever the active session changes (imperative DOM op — effect is correct here).
  useEffect(() => {
    chatTextboxRef.current?.focus()
  }, [sessionId])

  // Flush any pending scroll-to-localStorage write on unmount.
  useEffect(() => {
    return () => {
      if (scrollSaveTimeoutRef.current !== null) {
        clearTimeout(scrollSaveTimeoutRef.current)
      }
    }
  }, [])

  // ── Queries ───────────────────────────────────────────────────────────────────
  const { data: commandsData } = useSlashCommands(sessionId)
  const { data: branchData } = useBranch(sessionId)
  const { data: branchesData } = useBranches(sessionId)
  const branch = branchData?.branch ?? null
  const branches = branchesData?.branches ?? []

  // ── Mutations ─────────────────────────────────────────────────────────────────
  const checkoutBranchMutation = useCheckoutBranch(sessionId)
  const abortSessionMutation = useAbortSession(sessionId)
  const generateTitleMutation = useGenerateTitle()
  const sendPromptMutation = useSendPrompt(sessionId)

  const handleErrorAction = useCallback(
    (action: ErrorAction, id: string) => {
      if (action.type === "dismiss") {
        dismissError(id)
      } else if (action.type === "retry" && action.prompt) {
        dismissError(id)
        startUserPrompt(action.prompt)
        sendPromptMutation.mutate(
          { text: action.prompt },
          { onError: markSendFailed }
        )
      }
    },
    [dismissError, startUserPrompt, sendPromptMutation, markSendFailed]
  )

  // ── Session stats ─────────────────────────────────────────────────────────────
  // Fetch detailed token stats from the server
  const { data: sessionStats } = useSessionStats(sessionId)

  // ── Auto-scroll ───────────────────────────────────────────────────────────────
  // During streaming, smooth scrolling is called on every delta and the browser
  // interrupts each animation before it finishes, causing the view to lag behind
  // the final content. Rapid smooth-scroll calls also fire onScroll mid-animation,
  // which can flip pinnedRef to false and stop further scrolls entirely.
  // Fix: use instant scrollTop assignment while loading so every update reliably
  // lands at the bottom; only use smooth scroll once the stream is stable.
  const commandsByName = useMemo(
    () => new Map((commandsData ?? []).map((command) => [command.name, command])),
    [commandsData]
  )

  // ── Scroll position persistence via query cache & localStorage ──────────────────
  // Scroll positions are stored in both TanStack Query cache and localStorage.
  // localStorage persists across garbage collection and page reloads.
  const saveScrollPosition = useCallback(
    (scrollTop: number) => {
      const meta = {
        scrollTop,
        isPinned: pinnedRef.current,
        visited: true,
      }
      // Update in-memory cache immediately (cheap, O(1))
      queryClient.setQueryData(chatKeys.scroll(sessionId), meta)
      // Debounce the synchronous localStorage write (fires 150ms after last scroll)
      if (scrollSaveTimeoutRef.current !== null) {
        clearTimeout(scrollSaveTimeoutRef.current)
      }
      scrollSaveTimeoutRef.current = setTimeout(() => {
        scrollSaveTimeoutRef.current = null
        syncEngine.saveScrollMeta(sessionId, {
          scrollTop,
          isPinned: pinnedRef.current,
          visited: true,
        })
      }, 150)
    },
    [queryClient, sessionId, syncEngine]
  )

  // ── Restore scroll position or scroll to bottom on thread change ──────────────
  // If the thread has been visited before and has a saved position, restore it.
  // Otherwise, scroll to bottom (new thread behavior).
  // useLayoutEffect runs before the browser paints, so scroll position is
  // applied atomically with the DOM update — no one-frame flash of wrong position.
  useLayoutEffect(() => {
    initialScrollDoneRef.current = false
    pinnedRef.current = true

    const el = scrollContainerRef.current
    if (!el) return

    // Check if this thread has been visited before
    // First check query cache, then localStorage
    let savedMeta = queryClient.getQueryData<{
      scrollTop: number
      isPinned: boolean
      visited?: boolean
    }>(chatKeys.scroll(sessionId))

    // If not in cache, check localStorage (persisted across sessions)
    if (!savedMeta?.visited) {
      const localMeta = syncEngine.getScrollMeta(sessionId)
      if (localMeta) {
        savedMeta = localMeta
      }
    }

    if (savedMeta?.visited) {
      // Restore previous scroll position
      el.scrollTop = savedMeta.scrollTop
      pinnedRef.current = savedMeta.isPinned
    } else {
      // New thread - scroll to bottom and mark as visited
      el.scrollTop = el.scrollHeight
      // Mark as visited so next time we restore this position
      const visitedMeta = {
        scrollTop: el.scrollTop,
        isPinned: pinnedRef.current,
        visited: true,
      }
      queryClient.setQueryData(chatKeys.scroll(sessionId), visitedMeta)
      syncEngine.saveScrollMeta(sessionId, visitedMeta)
    }

    // Sync scroll button visibility with the restored position (no setState needed
    // here since pinnedRef drives the auto-scroll effect, not showScrollButton).
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    setShowScrollButton(distanceFromBottom >= 80)
  }, [threadId, sessionId, queryClient, syncEngine])

  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return
    const frame = requestAnimationFrame(() => {
      // Guard inside the RAF so it's checked after useLayoutEffect has already
      // set pinnedRef to the restored value for this thread. If we checked
      // pinnedRef before the RAF, we'd always read `true` (set at the top of
      // the layout effect) and incorrectly scroll to bottom on every switch.
      if (!pinnedRef.current) return
      el.scrollTop = el.scrollHeight
    })

    return () => cancelAnimationFrame(frame)
  }, [isLoading, visibleMessages])

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current
    if (!el) return
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    pinnedRef.current = distanceFromBottom < 80
    setShowScrollButton(distanceFromBottom >= 80)
    saveScrollPosition(el.scrollTop)
  }, [saveScrollPosition])

  const scrollToBottom = useCallback(() => {
    const el = scrollContainerRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" })
    pinnedRef.current = true
  }, [])

  const handleModelChange = useCallback(
    (id: string) => {
      setSelectedModelId(id)
      updateThreadModel.mutate({ threadId, modelId: id })
    },
    [threadId, updateThreadModel]
  )

  const handleGitError = useCallback((message: string) => {
    setGitError(message)
  }, [])

  const handleBranchSelect = useCallback(
    (selectedBranch: string) => {
      checkoutBranchMutation.mutate(selectedBranch, {
        onError: (err) => {
          const msg = err instanceof Error ? err.message : String(err)
          const stripped = msg.replace(/^API \d+:\s*/, "")
          try {
            const parsed = JSON.parse(stripped) as { error?: string }
            handleGitError(parsed.error ?? stripped)
          } catch {
            handleGitError(stripped)
          }
        },
      })
    },
    [checkoutBranchMutation, handleGitError]
  )

  const handleStop = useCallback(() => {
    abortSessionMutation.mutate(undefined, {
      onSuccess: () => {
        markStopped()
        updateThreadStopped.mutate({ threadId, stopped: true })
      },
      onError: (err: unknown) => {
        console.error("[abort]", err)
        toast.error("Failed to stop", {
          description: "Could not stop the agent. It may still be running.",
          duration: 5000,
        })
      },
    })
  }, [abortSessionMutation, markStopped, threadId, updateThreadStopped])

  useShortcutHandler(SHORTCUT_ACTIONS.FOCUS_CHAT, () => {
    chatTextboxRef.current?.focus()
  })
  useShortcutHandler(
    SHORTCUT_ACTIONS.STOP_GENERATION,
    isLoading ? handleStop : null
  )
  useShortcutHandler(SHORTCUT_ACTIONS.SCROLL_TO_BOTTOM, scrollToBottom)

  const handleSend = useCallback(
    (
      text: string,
      modelId: string,
      provider: string,
      thinkingLevel?: string
    ) => {
      if (!hasConversationHistory) {
        generateTitleMutation.mutate(text, {
          onSuccess: ({ title }) => {
            updateTitleMutation.mutate({ workspaceId, threadId, title })
            confirmThread(threadId)
          },
          onError: () => confirmThread(threadId),
        })
      }
      pinnedRef.current = true
      updateThreadStopped.mutate({ threadId, stopped: false })
      startUserPrompt(text, thinkingLevel)

      // Scroll immediately when sending
      const el = scrollContainerRef.current
      if (el) {
        el.scrollTop = el.scrollHeight
      }

      const model = modelId && provider ? { provider, modelId } : undefined
      sendPromptMutation.mutate(
        { text, model, thinkingLevel },
        { onError: markSendFailed }
      )
    },
    [
      hasConversationHistory,
      markSendFailed,
      sendPromptMutation,
      generateTitleMutation,
      startUserPrompt,
      workspaceId,
      threadId,
      updateTitleMutation,
      updateThreadStopped,
      confirmThread,
    ]
  )

  return (
    <>
      <AlertDialog
        open={gitError !== null}
        onOpenChange={(open) => {
          if (!open) setGitError(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Git Error</AlertDialogTitle>
            <AlertDialogDescription>{gitError}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setGitError(null)}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="relative flex h-full min-w-0 flex-col overflow-hidden">
        {noProvider && (
          <div className="flex shrink-0 items-center gap-3 border-b border-amber-500/20 bg-amber-500/5 px-4 py-2.5">
            <PlugZapIcon className="h-4 w-4 shrink-0 text-amber-500" />
            <p className="min-w-0 flex-1 text-xs text-amber-600 dark:text-amber-400">
              No model provider configured. Add an API key or sign in to start
              chatting.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="h-7 shrink-0 border-amber-500/30 text-xs hover:bg-amber-500/10"
              onClick={() => openConfigure("subscriptions")}
            >
              Configure provider
            </Button>
          </div>
        )}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex w-full flex-1 flex-col overflow-y-auto pt-6 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {visibleMessages.length === 0 && !isLoading && (
            <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-8 px-6 text-center select-none">
              <div className="flex flex-col items-center gap-3">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-[#1c1c1e] ring-1 ring-white/5 shadow-md">
                  <span className="font-black text-3xl leading-none" style={{ color: "#d4a017" }}>Λ</span>
                </div>
                <div className="space-y-1.5">
                  <p className="text-lg font-semibold tracking-tight">How can I help?</p>
                  <p className="text-xs text-muted-foreground">
                    Use{" "}
                    <kbd className="rounded border border-border/60 bg-muted px-1 py-0.5 font-mono text-[10px] text-foreground">
                      @
                    </kbd>{" "}
                    for files and{" "}
                    <kbd className="rounded border border-border/60 bg-muted px-1 py-0.5 font-mono text-[10px] text-foreground">
                      /
                    </kbd>{" "}
                    for commands
                  </p>
                </div>
              </div>
              <div className="grid w-full max-w-lg grid-cols-3 gap-2">
                {PROMPT_SUGGESTIONS.map(({ icon: Icon, text, description }) => (
                  <button
                    key={text}
                    type="button"
                    onClick={() => chatTextboxRef.current?.setValue(text)}
                    className="group flex flex-col items-start gap-2 rounded-xl border bg-card/60 p-3 text-left transition-colors hover:border-primary/20 hover:bg-card"
                  >
                    <div className="flex size-7 items-center justify-center rounded-lg bg-primary/8 text-primary/70 transition-colors group-hover:bg-primary/15">
                      <Icon className="size-3.5" />
                    </div>
                    <div>
                      <p className="text-[11px] font-medium leading-tight text-foreground/80">{text}</p>
                      <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">{description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          {visibleMessages.length > 0 && (
            <div className="mx-auto w-full max-w-3xl px-6">
              {visibleMessages.map((message, index) => {
                if (
                  message.role === "assistant" &&
                  !message.content.trim() &&
                  !message.thinking.trim() &&
                  !message.errorMessage
                )
                  return null
                const key = getMessageKey(message, index)
                // Only animate messages that arrived after the initial cache snapshot
                // for this session. A missing or stale snapshot (wrong sessionId) means
                // we haven't captured initial keys yet → no animation for existing messages.
                const isNewMessage =
                  initialSnapshot !== null &&
                  initialSnapshot.sessionId === sessionId &&
                  !initialSnapshot.keys.has(key)
                // Only show the metadata bar (time + copy) on the last assistant
                // block in a turn — i.e. when no further assistant message follows
                // before the next user/error/abort message.
                let isLastInTurn = true
                let turnMessages: AssistantMessage[] | undefined
                if (message.role === "assistant") {
                  for (let j = index + 1; j < visibleMessages.length; j++) {
                    if (visibleMessages[j].role !== "tool") {
                      isLastInTurn = visibleMessages[j].role !== "assistant"
                      break
                    }
                  }
                  if (isLastInTurn) {
                    turnMessages = []
                    for (let j = index; j >= 0; j--) {
                      const m = visibleMessages[j]
                      if (m.role === "user" || m.role === "abort") break
                      if (m.role === "assistant") turnMessages.unshift(m as AssistantMessage)
                    }
                  }
                }
                return (
                  <div key={key} className="pb-3">
                    <MessageRow
                      message={message}
                      commandsByName={commandsByName}
                      showThinking={showThinkingSetting}
                      onAction={handleErrorAction}
                      isNewMessage={isNewMessage}
                      isLastInTurn={isLastInTurn}
                      turnMessages={turnMessages}
                    />
                  </div>
                )
              })}
            </div>
          )}
          <div className="mx-auto w-full max-w-3xl px-6">
            {isLoading && <ThinkingIndicator className="py-0.5" />}
            {isCompacting && <CompactingIndicator />}
          </div>

          {/* File changes card - shown after chat completion */}
          {!isLoading && visibleMessages.some((m) => m.role !== "error") && (
            <FileChangesCard sessionId={sessionId} />
          )}
        </div>

        {showScrollButton && (
          <div className="pointer-events-none absolute inset-x-0 bottom-40 z-10 flex justify-center">
            <Button
              size="sm"
              variant="secondary"
              onClick={scrollToBottom}
              className="pointer-events-auto rounded-full shadow-md"
            >
              <ArrowDownIcon className="h-4 w-4" /> Scroll to bottom
            </Button>
          </div>
        )}

        <div className="mx-auto w-full max-w-3xl shrink-0 bg-background px-6 py-2">
          <ChatTextbox
            ref={chatTextboxRef}
            onSend={handleSend}
            onStop={handleStop}
            isLoading={isLoading}
            isAborting={abortSessionMutation.isPending}
            branch={branch}
            branches={branches}
            onBranchSelect={handleBranchSelect}
            onBranchError={handleGitError}
            sessionId={sessionId}
            workspaceId={workspaceId}
            selectedModelId={selectedModelId}
            onModelChange={handleModelChange}
            sessionStats={sessionStats}
          />
        </div>
      </div>
    </>
  )
}
