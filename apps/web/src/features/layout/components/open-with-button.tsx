import { useMemo, useState } from "react"
import { Check, ChevronDown, ExternalLink, Loader2 } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import {
  useElectronPlatform,
  useOpenWithAppIcons,
  useOpenWithApps,
  useOpenWorkspaceWithApp,
} from "@/features/electron"
import { Button } from "@/shared/ui/button"
import { ButtonGroup } from "@/shared/ui/button-group"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu"
import {
  OPEN_WITH_LEGACY_STORAGE_KEYS,
  OPEN_WITH_STORAGE_KEY,
  readStorageValue,
  writeStorageValue,
} from "@/shared/lib/storage-keys"

type StoredSelections = {
  version: 1
  workspaceSelections: Record<string, string>
}

function readStoredSelections(): Record<string, string> {
  if (typeof window === "undefined") return {}

  try {
    const raw = readStorageValue(
      OPEN_WITH_STORAGE_KEY,
      OPEN_WITH_LEGACY_STORAGE_KEYS
    )
    if (!raw) return {}

    const parsed = JSON.parse(raw) as Partial<StoredSelections>
    if (
      parsed.version !== 1 ||
      typeof parsed.workspaceSelections !== "object" ||
      parsed.workspaceSelections === null
    ) {
      return {}
    }

    return Object.fromEntries(
      Object.entries(parsed.workspaceSelections).filter(
        (entry): entry is [string, string] => typeof entry[1] === "string"
      )
    )
  } catch {
    return {}
  }
}

function writeStoredSelections(selections: Record<string, string>) {
  if (typeof window === "undefined") return

  writeStorageValue(
    OPEN_WITH_STORAGE_KEY,
    JSON.stringify({
      version: 1,
      workspaceSelections: selections,
    } satisfies StoredSelections),
    OPEN_WITH_LEGACY_STORAGE_KEYS
  )
}

function AppIcon({
  appName,
  iconDataUrl,
  className,
}: {
  appName: string
  iconDataUrl: string | null
  className?: string
}) {
  const [failedIconDataUrl, setFailedIconDataUrl] = useState<string | null>(
    null
  )
  const hasLoadError = iconDataUrl !== null && failedIconDataUrl === iconDataUrl

  if (iconDataUrl && !hasLoadError) {
    return (
      <img
        alt=""
        aria-hidden="true"
        className={cn("size-4 shrink-0 rounded-lg object-contain", className)}
        draggable={false}
        onError={() => {
          setFailedIconDataUrl(iconDataUrl)
        }}
        src={iconDataUrl}
      />
    )
  }

  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex size-4 shrink-0 items-center justify-center rounded-lg bg-muted text-[0.625rem] font-semibold text-muted-foreground",
        className
      )}
    >
      {appName.slice(0, 1).toUpperCase()}
    </div>
  )
}

export function OpenWithButton({ workspacePath }: { workspacePath?: string }) {
  const { data: platform } = useElectronPlatform()
  const isMac = platform === "darwin"
  const { data: apps = [], isLoading: isLoadingApps } = useOpenWithApps(isMac)
  const { data: iconsByAppId = {}, isLoading: isLoadingIcons } =
    useOpenWithAppIcons(
      apps.map((app) => app.id),
      isMac && apps.length > 0
    )
  const openWorkspaceMutation = useOpenWorkspaceWithApp()
  const [storedSelections, setStoredSelections] = useState<
    Record<string, string>
  >(() => readStoredSelections())

  const selectedAppId = workspacePath
    ? storedSelections[workspacePath]
    : undefined
  const selectedApp = useMemo(() => {
    if (apps.length === 0) return null
    return apps.find((editorApp) => editorApp.id === selectedAppId) ?? apps[0]
  }, [apps, selectedAppId])

  const persistSelection = (appId: string) => {
    if (!workspacePath) return

    setStoredSelections((currentSelections) => {
      if (currentSelections[workspacePath] === appId) {
        return currentSelections
      }

      const nextSelections = {
        ...currentSelections,
        [workspacePath]: appId,
      }
      writeStoredSelections(nextSelections)
      return nextSelections
    })
  }

  const openWorkspace = async (appId?: string) => {
    if (!workspacePath) return

    const targetApp = appId
      ? (apps.find((editorApp) => editorApp.id === appId) ?? null)
      : selectedApp
    if (!targetApp) return

    try {
      const opened = await openWorkspaceMutation.mutateAsync({
        workspacePath,
        appId: targetApp.id,
      })
      if (!opened) return
      persistSelection(targetApp.id)
    } catch (error) {
      console.error("Failed to open workspace with external editor", error)
    }
  }

  if (!isMac || !workspacePath) {
    return null
  }

  if (!isLoadingApps && apps.length === 0) {
    return null
  }

  const disabled =
    openWorkspaceMutation.isPending || isLoadingApps || !selectedApp
  const selectedAppName = selectedApp?.name ?? "Editor"
  const selectedAppIconDataUrl = selectedApp
    ? (iconsByAppId[selectedApp.id] ?? selectedApp.iconDataUrl)
    : null

  return (
    <ButtonGroup aria-label="Open workspace in app">
      <Button
        className="max-w-44 min-w-0 justify-start overflow-hidden"
        disabled={disabled}
        onClick={() => {
          void openWorkspace()
        }}
        type="button"
        variant="outline"
      >
        {openWorkspaceMutation.isPending || isLoadingApps || isLoadingIcons ? (
          <Loader2
            className="animate-spin text-muted-foreground"
            data-icon="inline-start"
          />
        ) : (
          <AppIcon
            appName={selectedAppName}
            iconDataUrl={selectedAppIconDataUrl}
          />
        )}
        <span className="truncate text-xs">{selectedAppName}</span>
        <ExternalLink
          className="text-muted-foreground"
          data-icon="inline-end"
        />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Choose app"
          disabled={disabled}
          render={
            <Button size="icon" variant="outline">
              <ChevronDown className="text-muted-foreground" />
            </Button>
          }
        >
          <span className="sr-only">Choose editor</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-max! min-w-0!">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Open workspace in</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {apps.map((editorApp) => (
              <DropdownMenuItem
                key={editorApp.id}
                onClick={() => {
                  void openWorkspace(editorApp.id)
                }}
              >
                <AppIcon
                  appName={editorApp.name}
                  className="size-4"
                  iconDataUrl={
                    iconsByAppId[editorApp.id] ?? editorApp.iconDataUrl
                  }
                />
                <span className="whitespace-nowrap">{editorApp.name}</span>
                <Check
                  className={cn(
                    "ml-auto size-3.5 text-foreground/70",
                    selectedApp?.id === editorApp.id
                      ? "opacity-100"
                      : "opacity-0"
                  )}
                />
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  )
}
