import type { Monument } from '../types'

const WIKIDATA_ENDPOINT = 'https://query.wikidata.org/sparql'

const EMBLEMATIC_TYPES = [
  'wd:Q11303',      // skyscraper
  'wd:Q483110',     // stadium
  'wd:Q16560',      // palace
  'wd:Q23413',      // castle
  'wd:Q56242215',   // cathedral
  'wd:Q641226',     // town hall
  'wd:Q16970',      // church building
  'wd:Q33506',      // museum
  'wd:Q44613',      // monastery
  'wd:Q4989906',    // monument
  'wd:Q12518',      // tower
  'wd:Q12280',      // bridge
  'wd:Q12493',      // basilica
  'wd:Q32815',      // mosque
  'wd:Q34627',      // synagogue
  'wd:Q109607',     // arch
  'wd:Q570116',     // architectural structure
]

function buildHeritageQuery(lon: number, lat: number, radiusKm: number = 8): string {
  return `
    SELECT DISTINCT ?item ?itemLabel ?coord ?image ?type ?typeLabel ?sitelink
    WHERE {
      SERVICE wikibase:around {
        ?item wdt:P625 ?coord .
        bd:serviceParam wikibase:center "Point(${lon} ${lat})"^^geo:wktLiteral .
        bd:serviceParam wikibase:radius "${radiusKm}" .
      }
      OPTIONAL { ?item wdt:P18 ?image }
      OPTIONAL { ?item wdt:P31 ?type }
      OPTIONAL {
        ?sitelink schema:about ?item ;
                  schema:isPartOf <https://es.wikipedia.org/> .
      }
      ?item wdt:P1435 [] .
      SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en" }
    }
    LIMIT 80
  `
}

function buildEmblematicQuery(lon: number, lat: number, radiusKm: number = 8): string {
  return `
    SELECT DISTINCT ?item ?itemLabel ?coord ?image ?type ?typeLabel ?sitelink
    WHERE {
      SERVICE wikibase:around {
        ?item wdt:P625 ?coord .
        bd:serviceParam wikibase:center "Point(${lon} ${lat})"^^geo:wktLiteral .
        bd:serviceParam wikibase:radius "${radiusKm}" .
      }
      OPTIONAL { ?item wdt:P18 ?image }
      OPTIONAL {
        ?sitelink schema:about ?item ;
                  schema:isPartOf <https://es.wikipedia.org/> .
      }
      VALUES ?type { ${EMBLEMATIC_TYPES.join(' ')} }
      ?item wdt:P31 ?type .
      SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en" }
    }
    LIMIT 80
  `
}

function parseWktPoint(wkt: string): { lat: number; lon: number } | null {
  const match = wkt.match(/Point\s*\(\s*([\d.\-]+)\s+([\d.\-]+)\s*\)/i)
  if (!match) return null
  return { lon: parseFloat(match[1]), lat: parseFloat(match[2]) }
}

async function executeQuery(query: string): Promise<any> {
  const url = `${WIKIDATA_ENDPOINT}?query=${encodeURIComponent(query)}&format=json`

  const response = await fetch(url, {
    headers: {
      Accept: 'application/sparql-results+json',
      'User-Agent': 'PNOA-Cities-Explorer/1.0',
    },
  })

  if (!response.ok) {
    throw new Error(`Wikidata error: ${response.status}`)
  }

  return response.json()
}

function parseMonuments(data: any): Monument[] {
  const results: Monument[] = []

  for (const binding of data.results.bindings) {
    const id = binding.item.value.split('/').pop() || binding.item.value
    const coords = parseWktPoint(binding.coord.value)
    if (!coords) continue

    const name = binding.itemLabel?.value || id
    const imageUrl = binding.image?.value
    const sitelink = binding.sitelink?.value
    const wikipediaUrl = sitelink
      ? `https://es.wikipedia.org/wiki/${sitelink.split('/').pop()}`
      : undefined

    const typeLabel = binding.typeLabel?.value || binding.type?.value.split('/').pop() || 'Monumento'

    results.push({
      id,
      name,
      lat: coords.lat,
      lon: coords.lon,
      type: typeLabel,
      imageUrl,
      wikipediaUrl,
      wikidataId: id,
    })
  }

  return results
}

export async function fetchMonuments(lon: number, lat: number): Promise<Monument[]> {
  const [heritageData, emblematicData] = await Promise.all([
    executeQuery(buildHeritageQuery(lon, lat)),
    executeQuery(buildEmblematicQuery(lon, lat)).catch(() => ({ results: { bindings: [] } })),
  ])

  const seen = new Set<string>()
  const results: Monument[] = []

  for (const monument of [...parseMonuments(heritageData), ...parseMonuments(emblematicData)]) {
    if (seen.has(monument.id)) continue
    seen.add(monument.id)
    results.push(monument)
  }

  return results
}
