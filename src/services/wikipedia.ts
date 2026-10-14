export interface WikipediaSummary {
  title: string
  extract: string
  thumbnail?: {
    source: string
    width: number
    height: number
  }
  content_urls?: {
    desktop?: {
      page: string
    }
  }
}

export async function fetchWikipediaSummary(title: string): Promise<WikipediaSummary | null> {
  const encodedTitle = encodeURIComponent(title.replace(/ /g, '_'))
  const url = `https://es.wikipedia.org/api/rest_v1/page/summary/${encodedTitle}`

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'PNOA-Cities-Explorer/1.0',
      },
    })

    if (!response.ok) {
      return null
    }

    return response.json()
  } catch {
    return null
  }
}

export function getWikipediaTitleFromUrl(url: string): string | null {
  try {
    const pathname = new URL(url).pathname
    return decodeURIComponent(pathname.split('/').pop() || '').replace(/_/g, ' ')
  } catch {
    return null
  }
}
