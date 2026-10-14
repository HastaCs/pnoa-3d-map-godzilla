import type { City } from '../types'
import { parseCitiesFromRootTileset, fetchPnoaRootTileset } from './pnoa'
import { haversineDistance } from '../utils/geo'

const WIKIDATA_ENDPOINT = 'https://query.wikidata.org/sparql'

const SPANISH_CITIES_QUERY = `
  SELECT ?item ?itemLabel ?coord ?population
  WHERE {
    ?item wdt:P31/wdt:P279* wd:Q515 ;
          wdt:P17 wd:Q29 ;
          wdt:P1082 ?population ;
          wdt:P625 ?coord .
    FILTER(?population >= 50000)
    SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en" }
  }
  ORDER BY DESC(?population)
  LIMIT 300
`

interface WikidataCity {
  id: string
  name: string
  lon: number
  lat: number
  population: number
}

function parseWktPoint(wkt: string): { lat: number; lon: number } | null {
  const match = wkt.match(/Point\s*\(\s*([\d.\-]+)\s+([\d.\-]+)\s*\)/i)
  if (!match) return null
  return { lon: parseFloat(match[1]), lat: parseFloat(match[2]) }
}

async function fetchWikidataCities(): Promise<WikidataCity[]> {
  const url = `${WIKIDATA_ENDPOINT}?query=${encodeURIComponent(SPANISH_CITIES_QUERY)}&format=json`

  const response = await fetch(url, {
    headers: {
      Accept: 'application/sparql-results+json',
      'User-Agent': 'PNOA-Cities-Explorer/1.0',
    },
  })

  if (!response.ok) {
    throw new Error(`Wikidata cities error: ${response.status}`)
  }

  const data = await response.json()
  const results: WikidataCity[] = []
  const seen = new Set<string>()

  for (const binding of data.results.bindings) {
    const id = binding.item.value.split('/').pop() || binding.item.value
    if (seen.has(id)) continue
    seen.add(id)

    const coords = parseWktPoint(binding.coord.value)
    if (!coords) continue

    results.push({
      id,
      name: binding.itemLabel?.value || id,
      lon: coords.lon,
      lat: coords.lat,
      population: parseInt(binding.population.value, 10),
    })
  }

  return results
}

function normalizeCityName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

function dedupeCitiesByName(cities: WikidataCity[]): WikidataCity[] {
  const bestByName = new Map<string, WikidataCity>()
  for (const city of cities) {
    const key = normalizeCityName(city.name)
    const existing = bestByName.get(key)
    if (!existing || city.population > existing.population) {
      bestByName.set(key, city)
    }
  }
  return Array.from(bestByName.values())
}

function getRegionFromName(name: string): string {
  // Asignación aproximada por nombre; se puede mejorar con datos de provincia/CCAA
  const regionMap: Record<string, string> = {
    Barcelona: 'Cataluña',
    'L\'Hospitalet de Llobregat': 'Cataluña',
    'Santa Coloma de Gramenet': 'Cataluña',
    Badalona: 'Cataluña',
    Terrassa: 'Cataluña',
    Sabadell: 'Cataluña',
    Lleida: 'Cataluña',
    Tarragona: 'Cataluña',
    Madrid: 'Comunidad de Madrid',
    'Móstoles': 'Comunidad de Madrid',
    'Alcalá de Henares': 'Comunidad de Madrid',
    Fuenlabrada: 'Comunidad de Madrid',
    Leganés: 'Comunidad de Madrid',
    Getafe: 'Comunidad de Madrid',
    Alcorcón: 'Comunidad de Madrid',
    Valencia: 'Comunidad Valenciana',
    Alicante: 'Comunidad Valenciana',
    Elche: 'Comunidad Valenciana',
    'Castellón de la Plana': 'Comunidad Valenciana',
    Sevilla: 'Andalucía',
    Málaga: 'Andalucía',
    Córdoba: 'Andalucía',
    Granada: 'Andalucía',
    'Jerez de la Frontera': 'Andalucía',
    Almería: 'Andalucía',
    Huelva: 'Andalucía',
    Cádiz: 'Andalucía',
    Marbella: 'Andalucía',
    Jaén: 'Andalucía',
    Algeciras: 'Andalucía',
    Zaragoza: 'Aragón',
    Huesca: 'Aragón',
    Teruel: 'Aragón',
    Bilbao: 'País Vasco',
    Vitoria: 'País Vasco',
    'San Sebastián': 'País Vasco',
    'Donostia-San Sebastián': 'País Vasco',
    Murcia: 'Región de Murcia',
    Cartagena: 'Región de Murcia',
    Palma: 'Illes Balears',
    'Las Palmas de Gran Canaria': 'Canarias',
    'Santa Cruz de Tenerife': 'Canarias',
    Valladolid: 'Castilla y León',
    Burgos: 'Castilla y León',
    Salamanca: 'Castilla y León',
    León: 'Castilla y León',
    Vigo: 'Galicia',
    'A Coruña': 'Galicia',
    Ourense: 'Galicia',
    Lugo: 'Galicia',
    'Santiago de Compostela': 'Galicia',
    Gijón: 'Asturias',
    Oviedo: 'Asturias',
    Pamplona: 'Navarra',
    Logroño: 'La Rioja',
    Santander: 'Cantabria',
    Badajoz: 'Extremadura',
    Cáceres: 'Extremadura',
    Albacete: 'Castilla-La Mancha',
    Toledo: 'Castilla-La Mancha',
    Guadalajara: 'Castilla-La Mancha',
    'Ciudad Real': 'Castilla-La Mancha',
    Cuenca: 'Castilla-La Mancha',
    Ceuta: 'Ceuta',
    Melilla: 'Melilla',
  }

  return regionMap[name] || 'España'
}

export async function loadAllCities(): Promise<City[]> {
  const [rawWikidataCities, pnoaTileset] = await Promise.all([
    fetchWikidataCities(),
    fetchPnoaRootTileset(),
  ])

  const wikidataCities = dedupeCitiesByName(rawWikidataCities)
  const pnoaCities = parseCitiesFromRootTileset(pnoaTileset)

  // Fusionar: asignar tilesetUrl a ciudades de Wikidata que coincidan con PNOA
  const cities: City[] = wikidataCities.map((wdCity) => {
    // Buscar ciudad PNOA más cercana dentro de 10 km
    let bestMatch: City | null = null
    let bestDistance = Infinity

    for (const pnoaCity of pnoaCities) {
      if (!pnoaCity.center) continue
      const dist = haversineDistance(
        wdCity.lon,
        wdCity.lat,
        pnoaCity.center[0],
        pnoaCity.center[1]
      )
      if (dist < bestDistance) {
        bestDistance = dist
        bestMatch = pnoaCity
      }
    }

    const has3D = bestMatch !== null && bestDistance < 10

    return {
      id: wdCity.id,
      code: has3D ? bestMatch!.code : wdCity.id,
      name: wdCity.name,
      region: getRegionFromName(wdCity.name),
      tilesetUrl: has3D ? bestMatch!.tilesetUrl : undefined,
      center: [wdCity.lon, wdCity.lat, 0],
      zoom: has3D ? bestMatch!.zoom : 13,
      population: wdCity.population,
      coverageBbox: has3D ? bestMatch!.coverageBbox : undefined,
    } as City
  })

  // Añadir ciudades PNOA que no estén en Wikidata (por si acaso)
  const existingIds = new Set(cities.map((c) => c.id))
  for (const pnoaCity of pnoaCities) {
    if (!existingIds.has(pnoaCity.id)) {
      cities.push(pnoaCity)
    }
  }

  return cities.sort((a, b) => a.name.localeCompare(b.name))
}
