import { memo } from "react"
import ReactMarkdown, { type Components } from "react-markdown"
import remarkGfm from "remark-gfm"

export const ThinkingBlock = memo(function ThinkingBlock({
  thinking,
}: {
  thinking: string
}) {
  const components: Components = {
    pre: ({ children }) => <>{children}</>,
    code: ({ className, children, ...props }) => {
      const isBlock =
        String(children).endsWith("\n") || className?.startsWith("language-")
      if (isBlock) {
        // Render fenced code blocks as plain text without styling
        return <code {...props}>{children}</code>
      }
      return (
        <code
          className="rounded bg-muted/50 px-1 py-0.5 font-mono text-xs"
          {...props}
        >
          {children}
        </code>
      )
    },
  }

  return (
    <div className="text-xs leading-relaxed text-muted-foreground/55 italic [&_li]:my-0.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {thinking}
      </ReactMarkdown>
    </div>
  )
})
