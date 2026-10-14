import type { City, PnoaRootTileset, PnoaCityTileset } from '../types'
import { ecefToLngLatAlt, boxCenter, boxToLngLatBounds } from '../utils/ecef'
import { getCityInfo, parseCityCode } from '../utils/cityCodes'

const PNOA_BASE_URL = 'https://servicios3d.idee.es/pnoa-ma'

export async function fetchPnoaRootTileset(): Promise<PnoaRootTileset> {
  const response = await fetch(`${PNOA_BASE_URL}/json/tileset.json`)
  if (!response.ok) {
    throw new Error(`Error cargando tileset raíz: ${response.status}`)
  }
  return response.json()
}

export async function fetchCityTileset(url: string): Promise<PnoaCityTileset> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Error cargando tileset de ciudad: ${response.status}`)
  }
  return response.json()
}

export function resolveTilesetUrl(uri: string): string {
  // uri = "../AND_2025_41091_SEV/tileset.json"
  const relative = uri.replace(/^\.\.\//, '')
  return `${PNOA_BASE_URL}/${relative}`
}

export function parseCitiesFromRootTileset(tileset: PnoaRootTileset): City[] {
  const children = tileset.root.children || []

  return children
    .filter((child) => child.content?.uri)
    .map((child) => {
      const uri = child.content!.uri
      const parsed = parseCityCode(uri)
      if (!parsed) return null

      const { code, abbr } = parsed
      const info = getCityInfo(code)
      const centerEcef = boxCenter(child.boundingVolume.box)
      const [lon, lat, alt] = ecefToLngLatAlt(centerEcef[0], centerEcef[1], centerEcef[2])

      // Estimación de zoom basada en geometricError
      const zoom = Math.min(16, Math.max(12, 18 - Math.log2(child.geometricError / 100)))

      return {
        id: code,
        code,
        name: info?.name || abbr,
        region: info?.region || 'Desconocida',
        tilesetUrl: resolveTilesetUrl(uri),
        center: [lon, lat, alt],
        zoom,
        coverageBbox: boxToLngLatBounds(child.boundingVolume.box),
      } as City
    })
    .filter((city): city is City => city !== null)
}

export async function loadCities(): Promise<City[]> {
  const root = await fetchPnoaRootTileset()
  return parseCitiesFromRootTileset(root)
}
