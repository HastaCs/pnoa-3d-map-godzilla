export const queryKeys = {
  cities: () => ['cities'] as const,
  monuments: (cityId?: string) => ['monuments', cityId] as const,
} as const
