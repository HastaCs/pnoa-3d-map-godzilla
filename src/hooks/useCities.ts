import { useQuery } from '@tanstack/react-query'
import { loadAllCities } from '../services/cities'
import { queryKeys } from '../lib/queryKeys'

export function useCities() {
  const { data, isPending, error } = useQuery({
    queryKey: queryKeys.cities(),
    queryFn: loadAllCities,
    staleTime: 60 * 60 * 1000,
  })

  return {
    cities: data ?? [],
    loading: isPending,
    error: error?.message ?? null,
  }
}
