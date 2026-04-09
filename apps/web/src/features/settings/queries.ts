import { useQuery } from "@tanstack/react-query"
import { fetchProviders, fetchOAuthProviders } from "./api"

export const providersQueryKey = ["providers"] as const

export function useProviders() {
  return useQuery({
    queryKey: providersQueryKey,
    queryFn: ({ signal }) => fetchProviders(signal),
    staleTime: 30 * 1000,
  })
}

export const oauthProvidersQueryKey = ["oauth-providers"] as const

export function useOAuthProviders() {
  return useQuery({
    queryKey: oauthProvidersQueryKey,
    queryFn: ({ signal }) => fetchOAuthProviders(signal),
    staleTime: 10 * 1000,
  })
}
