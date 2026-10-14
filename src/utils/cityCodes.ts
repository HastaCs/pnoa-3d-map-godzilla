export interface CityCodeInfo {
  name: string
  region: string
}

/**
 * Diccionario estático de códigos IGN → ciudad.
 * El formato es `{CCAA}_{AÑO}_{PROVMUN}_{ABREV}`.
 * Se usa como fallback; en el futuro se puede enriquecer desde Wikidata.
 */
const CITY_CODES: Record<string, CityCodeInfo> = {
  AND_2025_11004_ALG: { name: 'Algeciras', region: 'Andalucía' },
  AND_2025_11012_CAD: { name: 'Cádiz', region: 'Andalucía' },
  AND_2025_11020_JER: { name: 'Jerez de la Frontera', region: 'Andalucía' },
  AND_2025_11031_SANF: { name: 'San Fernando', region: 'Andalucía' },
  AND_2025_14021_COR: { name: 'Córdoba', region: 'Andalucía' },
  AND_2025_21041_HUE: { name: 'Huelva', region: 'Andalucía' },
  AND_2025_23091_UBE: { name: 'Úbeda', region: 'Andalucía' },
  AND_2025_29051_EST: { name: 'Estepona', region: 'Andalucía' },
  AND_2025_29054_FUE: { name: 'Fuengirola', region: 'Andalucía' },
  AND_2025_29069_MAR: { name: 'Marbella', region: 'Andalucía' },
  AND_2025_41091_SEV: { name: 'Sevilla', region: 'Andalucía' },
  EXT_2025_06015_BAD: { name: 'Badajoz', region: 'Extremadura' },
  EXT_2025_10037_CAC: { name: 'Cáceres', region: 'Extremadura' },
  MUR_2025_30016_CAR: { name: 'Cartagena', region: 'Región de Murcia' },
  MUR_2025_30030_MUR: { name: 'Murcia', region: 'Región de Murcia' },
}

export function getCityInfo(code: string): CityCodeInfo | undefined {
  return CITY_CODES[code]
}

export function parseCityCode(uri: string): { code: string; abbr: string } | null {
  // uri = "../AND_2025_11004_ALG/tileset.json"
  const match = uri.match(/\.\.\/([A-Z]{3}_\d{4}_\d{5}_[A-Z]+)\/tileset\.json$/)
  if (!match) return null
  const code = match[1]
  const abbr = code.split('_').pop() || code
  return { code, abbr }
}
