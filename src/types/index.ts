export interface City {
  id: string
  code: string
  name: string
  region: string
  tilesetUrl?: string
  center?: [number, number, number]
  zoom?: number
  population?: number
  coverageBbox?: [number, number, number, number] // [minLon, minLat, maxLon, maxLat]
}

export interface Monument {
  id: string
  name: string
  lat: number
  lon: number
  type: string
  imageUrl?: string
  wikipediaUrl?: string
  extract?: string
  wikidataId: string
}

export interface ViewState {
  longitude: number
  latitude: number
  zoom: number
  pitch: number
  bearing: number
  transitionDuration?: number
}

export interface PnoaRootTileset {
  asset: { version: string }
  geometricError: number
  root: {
    boundingVolume: {
      box: number[]
    }
    children?: PnoaCityNode[]
  }
}

export interface PnoaCityNode {
  boundingVolume: {
    box: number[]
  }
  content?: {
    uri: string
  }
  geometricError: number
  refine?: string
}

export interface PnoaCityTileset {
  asset: { version: string }
  geometricError: number
  root: {
    boundingVolume: {
      box: number[]
    }
    content?: {
      uri: string
    }
    children?: PnoaCityNode[]
  }
}
