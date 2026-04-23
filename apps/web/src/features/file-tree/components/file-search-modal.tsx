import { useState, useEffect, useCallback } from "react"
import { Loader2 } from "lucide-react"
import {
  CommandDialog,
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/shared/ui/command"
import { getFileIcon } from "@/shared/ui/file-icon"
import { fetchDirectory } from "../queries"

const IGNORED_DIRS = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  ".next",
  ".nuxt",
  ".turbo",
  ".cache",
  "coverage",
  "out",
  ".svelte-kit",
])

interface FileEntry {
  name: string
  path: string
  relativePath: string
}

async function collectFiles(
  dir: string,
  rootPath: string,
  depth = 0,
  acc: FileEntry[] = []
): Promise<FileEntry[]> {
  if (depth > 8 || acc.length >= 3000) return acc
  const entries = await fetchDirectory(dir)
  for (const entry of entries) {
    if (entry.type === "directory") {
      if (!IGNORED_DIRS.has(entry.name)) {
        await collectFiles(entry.path, rootPath, depth + 1, acc)
      }
    } else {
      acc.push({
        name: entry.name,
        path: entry.path,
        relativePath: entry.path.slice(rootPath.length).replace(/^[/\\]/, ""),
      })
    }
  }
  return acc
}

interface FileSearchModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rootPath: string
  onSelect: (filePath: string) => void
}

export function FileSearchModal({
  open,
  onOpenChange,
  rootPath,
  onSelect,
}: FileSearchModalProps) {
  const [files, setFiles] = useState<FileEntry[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoading(true)
    setFiles([])

    collectFiles(rootPath, rootPath).then((result) => {
      if (!cancelled) {
        setFiles(result)
        setLoading(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [open, rootPath])

  const handleSelect = useCallback(
    (file: FileEntry) => {
      onSelect(file.path)
      onOpenChange(false)
    },
    [onSelect, onOpenChange]
  )

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Open File"
      description="Search for a file to open"
      className="sm:max-w-xl"
    >
      <Command shouldFilter>
        <CommandInput placeholder="Search files…" autoFocus />
        <CommandList className="max-h-96">
          {loading && (
            <div className="flex items-center gap-2 px-3 py-6 text-xs text-muted-foreground">
              <Loader2 className="size-3 animate-spin" />
              Indexing workspace…
            </div>
          )}
          {!loading && <CommandEmpty>No files found.</CommandEmpty>}
          {!loading && files.length > 0 && (
            <CommandGroup>
              {files.map((file) => {
                const FileIcon = getFileIcon(file.name)
                const dir = file.relativePath
                  .split(/[/\\]/)
                  .slice(0, -1)
                  .join("/")
                return (
                  <CommandItem
                    key={file.path}
                    value={file.relativePath}
                    onSelect={() => handleSelect(file)}
                    className=""
                  >
                    <FileIcon className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate">
                      <span className="font-medium">{file.name}</span>
                      {dir && (
                        <span className="text-muted-foreground/50">
                          {" "}
                          — {dir}
                        </span>
                      )}
                    </span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
