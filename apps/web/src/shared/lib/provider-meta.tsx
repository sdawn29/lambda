import * as React from "react"

const PROVIDER_META: Record<string, { label: string; icon: React.ReactNode }> =
  {
    anthropic: {
      label: "Anthropic",
      icon: (
        <svg
          viewBox="0 0 24 24"
          className="size-3.5 shrink-0 fill-current"
          aria-hidden
        >
          <path d="M13.827 3.52h3.603L24 20h-3.603l-6.57-16.48zm-3.654 0H6.57L0 20h3.603l1.732-4.355h5.698l-1.853-4.584-3.19 8.063H6.57L10.173 3.52z" />
        </svg>
      ),
    },
    openai: {
      label: "OpenAI",
      icon: (
        <svg
          viewBox="0 0 24 24"
          className="size-3.5 shrink-0 fill-current"
          aria-hidden
        >
          <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08-4.778 2.758a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5Z" />
        </svg>
      ),
    },
    google: {
      label: "Google",
      icon: (
        <svg viewBox="0 0 24 24" className="size-3.5 shrink-0" aria-hidden>
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
      ),
    },
    mistral: {
      label: "Mistral",
      icon: (
        <svg
          viewBox="0 0 24 24"
          className="size-3.5 shrink-0 fill-current text-orange-500"
          aria-hidden
        >
          <path d="M0 0h4v4H0zm6.667 0h4v4h-4zM0 6.667h4v4H0zm6.667 0h4v4h-4zm6.666 0h4v4h-4zM0 13.333h4v4H0zm6.667 0h4v4h-4zm6.666 0h4v4h-4zm6.667 0h4v4h-4zM13.333 0h4v4h-4zm6.667 0h4v4h-4z" />
        </svg>
      ),
    },
    groq: {
      label: "Groq",
      icon: (
        <svg
          viewBox="0 0 24 24"
          className="size-3.5 shrink-0 fill-current text-red-500"
          aria-hidden
        >
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 4a8 8 0 1 1-8 8 8 8 0 0 1 8-8zm0 3a5 5 0 0 0-5 5h3a2 2 0 0 1 4 0h3a5 5 0 0 0-5-5z" />
        </svg>
      ),
    },
    xai: {
      label: "xAI",
      icon: (
        <svg
          viewBox="0 0 24 24"
          className="size-3.5 shrink-0 fill-current"
          aria-hidden
        >
          <path d="M2 2L9.5 12.5 2 22h3l5.75-7.5L16.5 22H22l-7.75-10L22 2h-3l-5.5 7-5.5-7z" />
        </svg>
      ),
    },
    openrouter: {
      label: "OpenRouter",
      icon: (
        <svg
          viewBox="0 0 24 24"
          className="size-3.5 shrink-0 fill-current text-violet-500"
          aria-hidden
        >
          <path d="M12.001 1.5a.75.75 0 0 1 .648.372l9 15.75A.75.75 0 0 1 21 18.75H3a.75.75 0 0 1-.649-1.128l9-15.75A.75.75 0 0 1 12 1.5z" />
        </svg>
      ),
    },
    "vercel-ai-gateway": {
      label: "Vercel AI Gateway",
      icon: (
        <svg
          viewBox="0 0 24 24"
          className="size-3.5 shrink-0 fill-current"
          aria-hidden
        >
          <path d="M12 1L24 22H0L12 1z" />
        </svg>
      ),
    },
    "amazon-bedrock": {
      label: "Amazon Bedrock",
      icon: (
        <svg
          viewBox="0 0 24 24"
          className="size-3.5 shrink-0 fill-current text-orange-400"
          aria-hidden
        >
          <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18L20 8.5v7L12 19.82 4 15.5v-7l8-4.32z" />
        </svg>
      ),
    },
    "google-vertex": {
      label: "Google Vertex AI",
      icon: (
        <svg viewBox="0 0 24 24" className="size-3.5 shrink-0" aria-hidden>
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
      ),
    },
    "azure-openai-responses": {
      label: "Azure OpenAI",
      icon: (
        <svg
          viewBox="0 0 24 24"
          className="size-3.5 shrink-0 fill-current text-blue-500"
          aria-hidden
        >
          <path d="M11.5 2L2 19.5h5l4.5-8.5 4.5 8.5H22L12.5 2z" />
        </svg>
      ),
    },
    deepseek: {
      label: "DeepSeek",
      icon: (
        <svg
          viewBox="0 0 24 24"
          className="size-3.5 shrink-0 fill-current text-cyan-500"
          aria-hidden
        >
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
          <path d="M8 12l3 3 5-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    "github-copilot": {
      label: "GitHub Copilot",
      icon: (
        <svg
          viewBox="0 0 24 24"
          className="size-3.5 shrink-0 fill-current"
          aria-hidden
        >
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
        </svg>
      ),
    },
    "openai-codex": {
      label: "OpenAI Codex",
      icon: (
        <svg
          viewBox="0 0 24 24"
          className="size-3.5 shrink-0 fill-current"
          aria-hidden
        >
          <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08-4.778 2.758a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5Z" />
        </svg>
      ),
    },
    cerebras: {
      label: "Cerebras",
      icon: (
        <svg
          viewBox="0 0 24 24"
          className="size-3.5 shrink-0 fill-current text-orange-500"
          aria-hidden
        >
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9h10v2H7z" />
        </svg>
      ),
    },
    zai: {
      label: "ZAI",
      icon: (
        <svg
          viewBox="0 0 24 24"
          className="size-3.5 shrink-0 fill-current text-violet-500"
          aria-hidden
        >
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      ),
    },
    "opencode-zen": {
      label: "OpenCode Zen",
      icon: (
        <svg
          viewBox="0 0 24 24"
          className="size-3.5 shrink-0 fill-current text-cyan-500"
          aria-hidden
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm4 18H6V2h7v5h5v11z" />
        </svg>
      ),
    },
    "opencode-go": {
      label: "OpenCode Go",
      icon: (
        <svg
          viewBox="0 0 24 24"
          className="size-3.5 shrink-0 fill-current text-emerald-500"
          aria-hidden
        >
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
        </svg>
      ),
    },
    huggingface: {
      label: "Hugging Face",
      icon: (
        <svg
          viewBox="0 0 24 24"
          className="size-3.5 shrink-0 fill-current text-orange-400"
          aria-hidden
        >
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.38.6.1.82-.26.82-.58v-2.04c-3.34.72-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.09 1.84 1.23 1.84 1.23 1.07 1.83 2.81 1.3 3.49 1 .11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 3-.4c1.02.01 2.04.14 3 .4 2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.21.69.82.57C20.56 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z" />
        </svg>
      ),
    },
    fireworks: {
      label: "Fireworks",
      icon: (
        <svg
          viewBox="0 0 24 24"
          className="size-3.5 shrink-0 fill-current text-red-500"
          aria-hidden
        >
          <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
        </svg>
      ),
    },
    "kimi-for-coding": {
      label: "Kimi For Coding",
      icon: (
        <svg
          viewBox="0 0 24 24"
          className="size-3.5 shrink-0 fill-current text-blue-500"
          aria-hidden
        >
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
        </svg>
      ),
    },
    minimax: {
      label: "MiniMax",
      icon: (
        <svg
          viewBox="0 0 24 24"
          className="size-3.5 shrink-0 fill-current text-pink-500"
          aria-hidden
        >
          <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 16L4 14l8-4 8 4-8 4z" />
        </svg>
      ),
    },
  }

export function getProviderMeta(providerId: string) {
  return (
    PROVIDER_META[providerId] ?? {
      label: providerId
        .split(/[-_]/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" "),
      icon: (
        <span className="flex size-3.5 shrink-0 items-center justify-center rounded-sm bg-muted text-[9px] leading-none font-bold text-muted-foreground uppercase">
          {providerId.charAt(0)}
        </span>
      ),
    }
  )
}
