import type { City, Monument } from '../types'
import { fetchMonuments } from './wikidata'
import { fetchWikipediaSummary, getWikipediaTitleFromUrl } from './wikipedia'

export interface MonumentsResult {
  monuments: Monument[]
  hiddenCount: number
}

export async function loadMonumentsForCity(city: City): Promise<MonumentsResult> {
  if (!city.center) {
    return { monuments: [], hiddenCount: 0 }
  }

  const [lon, lat] = city.center
  const raw = await fetchMonuments(lon, lat)

  let visible = raw
  let hiddenCount = 0

  if (city.coverageBbox) {
    const [minLon, minLat, maxLon, maxLat] = city.coverageBbox
    visible = raw.filter(
      (m) => m.lon >= minLon && m.lon <= maxLon && m.lat >= minLat && m.lat <= maxLat
    )
    hiddenCount = raw.length - visible.length
  }

  const enriched = await Promise.all(
    visible.map(async (monument) => {
      if (!monument.wikipediaUrl) return monument
      const title = getWikipediaTitleFromUrl(monument.wikipediaUrl)
      if (!title) return monument
      const summary = await fetchWikipediaSummary(title)
      if (!summary) return monument
      return {
        ...monument,
        extract: summary.extract,
        imageUrl: monument.imageUrl || summary.thumbnail?.source,
      }
    })
  )

  return { monuments: enriched, hiddenCount }
}
