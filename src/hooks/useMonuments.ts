import { useQuery } from '@tanstack/react-query'
import type { City } from '../types'
import { loadMonumentsForCity } from '../services/monuments'
import { queryKeys } from '../lib/queryKeys'

export function useMonuments(city: City | null) {
  const { data, isPending, error } = useQuery({
    queryKey: queryKeys.monuments(city?.id),
    queryFn: () => loadMonumentsForCity(city!),
    enabled: !!city?.center,
    staleTime: 30 * 60 * 1000,
  })

  return {
    monuments: data?.monuments ?? [],
    hiddenCount: data?.hiddenCount ?? 0,
    loading: isPending,
    error: error?.message ?? null,
  }
}
