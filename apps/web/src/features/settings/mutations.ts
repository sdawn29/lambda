import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  abortOAuthLogin,
  oauthLogout,
  openOAuthEventSource,
  respondToOAuthPrompt,
  startOAuthLogin,
  updateProviders,
  type ProviderKeys,
} from "./api"
import { oauthProvidersQueryKey, providersQueryKey } from "./queries"

export function useUpdateProviders() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (providers: ProviderKeys) => updateProviders(providers),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: providersQueryKey })
    },
  })
}

export function useStartOAuthLogin() {
  return useMutation({
    mutationFn: (providerId: string) => startOAuthLogin(providerId),
  })
}

export function useOpenOAuthEventSource() {
  return useMutation({
    mutationFn: (loginId: string) => openOAuthEventSource(loginId),
  })
}

export function useRespondToOAuthPrompt() {
  return useMutation({
    mutationFn: ({
      loginId,
      promptId,
      value,
    }: {
      loginId: string
      promptId: string
      value: string
    }) => respondToOAuthPrompt(loginId, promptId, value),
  })
}

export function useAbortOAuthLogin() {
  return useMutation({
    mutationFn: (loginId: string) => abortOAuthLogin(loginId),
  })
}

export function useOAuthLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (providerId: string) => oauthLogout(providerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: oauthProvidersQueryKey })
    },
  })
}
