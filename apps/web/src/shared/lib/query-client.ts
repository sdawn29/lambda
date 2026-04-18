import { QueryClient } from "@tanstack/react-query"

import { isServerUnreachableError } from "./client"

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 2 * 60 * 1000,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (isServerUnreachableError(error)) return false
        return failureCount < 1
      },
    },
  },
})
