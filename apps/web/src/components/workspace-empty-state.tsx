import { FolderOpen } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useWorkspace } from "@/hooks/workspace-context"

export function WorkspaceEmptyState() {
  const { createWorkspace } = useWorkspace()

  async function handleCreateWorkspace() {
    const folderPath = await window.electronAPI?.selectFolder()
    if (folderPath) {
      const folderName = folderPath.split(/[/\\]/).pop() || folderPath
      createWorkspace(folderName, folderPath)
    }
  }

  return (
    <div className="flex h-full items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
            <FolderOpen className="size-6 text-muted-foreground" />
          </div>
          <CardTitle>No workspace selected</CardTitle>
          <CardDescription>
            Create or select a workspace to get started.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button onClick={handleCreateWorkspace}>Create Workspace</Button>
        </CardContent>
      </Card>
    </div>
  )
}
