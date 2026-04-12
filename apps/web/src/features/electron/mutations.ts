import { useMutation } from "@tanstack/react-query"

import {
  openExternal,
  openPath,
  openWorkspaceWithApp,
  selectFolder,
  type SelectFolderOptions,
} from "./api"

export function useSelectFolder() {
  return useMutation({
    mutationFn: (options?: SelectFolderOptions) => selectFolder(options),
  })
}

export function useOpenPath() {
  return useMutation({
    mutationFn: (path: string) => openPath(path),
  })
}

export function useOpenWorkspaceWithApp() {
  return useMutation({
    mutationFn: ({
      workspacePath,
      appId,
    }: {
      workspacePath: string
      appId?: string
    }) => openWorkspaceWithApp(workspacePath, appId),
  })
}

export function useOpenExternal() {
  return useMutation({
    mutationFn: (url: string) => openExternal(url),
  })
}
