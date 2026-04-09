import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateProviders, type ProviderKeys } from "./api"
import { providersQueryKey } from "./queries"

export function useUpdateProviders() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (providers: ProviderKeys) => updateProviders(providers),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: providersQueryKey })
    },
  })
}
