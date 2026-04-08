import { useQuery } from "@tanstack/react-query"
import { fetchOAuthProviders } from "@/api/oauth"

export const oauthProvidersQueryKey = ["oauth-providers"] as const

export function useOAuthProviders() {
  return useQuery({
    queryKey: oauthProvidersQueryKey,
    queryFn: ({ signal }) => fetchOAuthProviders(signal),
    staleTime: 10 * 1000,
  })
}
