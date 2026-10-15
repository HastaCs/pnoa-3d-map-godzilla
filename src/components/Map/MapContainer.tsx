import { useEffect, useRef, useState, useCallback } from 'react'
import * as maplibregl from 'maplibre-gl'
import type { StyleSpecification } from 'maplibre-gl'
import { MapLibreOverlay } from '@deck.gl/maplibre'
import { LightingEffect, AmbientLight, DirectionalLight } from '@deck.gl/core'
import { ScenegraphLayer } from '@deck.gl/mesh-layers'

// Configurar worker de MapLibre para evitar errores en Vite
maplibregl.setWorkerUrl(
  new URL('maplibre-gl/dist/maplibre-gl-worker.mjs', import.meta.url).href
)
import { Tile3DLayer } from '@deck.gl/geo-layers'
import { ScatterplotLayer, LineLayer, TextLayer } from '@deck.gl/layers'
import { Tiles3DLoader } from '@loaders.gl/3d-tiles'
import { RotateCcw, RotateCw, Orbit } from 'lucide-react'
import type { City, Monument, ViewState } from '../../types'
import { MonumentTooltip } from '../UI/MonumentTooltip'
import 'maplibre-gl/dist/maplibre-gl.css'

interface MapContainerProps {
  selectedCity: City | null
  monuments: Monument[]
  selectedMonument: Monument | null
  onMonumentSelect: (monument: Monument | null) => void
}

const INITIAL_VIEW: ViewState = {
  longitude: -3.7,
  latitude: 40.4,
  zoom: 5,
  pitch: 0,
  bearing: 0,
}

// Iluminación para el modelo GLB de Godzilla (ScenegraphLayer con _lighting: 'pbr')
const ambientLight = new AmbientLight({ color: [255, 255, 255], intensity: 1.2 })
const godzillaSunLight = new DirectionalLight({
  color: [255, 255, 255],
  intensity: 1.8,
  direction: [-3, -9, -2],
})
const lightingEffect = new LightingEffect({ ambientLight, godzillaSunLight })

const PNOA_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    'pnoa-orto': {
      type: 'raster',
      tiles: [
        'https://www.ign.es/wmts/pnoa-ma?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=OI.OrthoimageCoverage&STYLE=default&TILEMATRIXSET=GoogleMapsCompatible&FORMAT=image/jpeg&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}',
      ],
      tileSize: 256,
      maxzoom: 20,
    },
  },
  layers: [
    {
      id: 'pnoa-orto',
      type: 'raster',
      source: 'pnoa-orto',
    },
  ],
}

export function MapContainer({
  selectedCity,
  monuments,
  selectedMonument,
  onMonumentSelect,
}: MapContainerProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const overlayRef = useRef<MapLibreOverlay | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [hoveredMonument, setHoveredMonument] = useState<Monument | null>(null)
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null)
  const orbitFrameRef = useRef<number | null>(null)
  const markerFrameRef = useRef<number | null>(null)
  const baseLayersRef = useRef<any[]>([])
  const activeTilesetsRef = useRef<Set<string>>(new Set())
  const selectedMonumentRef = useRef<Monument | null>(null)
  const hoveredIdRef = useRef<string | null>(null)
  const [isOrbiting, setIsOrbiting] = useState(false)
  const [orbitPaused, setOrbitPaused] = useState(false)
  const lastOrbitedMonumentRef = useRef<string | null>(null)
  const godzillaLayerRef = useRef<any>(null)
  const godzillaTimeRef = useRef<number | null>(null)

  // Inicializar mapa
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: PNOA_STYLE,
      center: [INITIAL_VIEW.longitude, INITIAL_VIEW.latitude],
      zoom: INITIAL_VIEW.zoom,
      pitch: INITIAL_VIEW.pitch,
      bearing: INITIAL_VIEW.bearing,
      maxPitch: 85,
      maxZoom: 22,
      dragPan: false,
      dragRotate: false,
      scrollZoom: false,
      doubleClickZoom: false,
      touchZoomRotate: false,
      keyboard: false,
      boxZoom: false,
      canvasContextAttributes: { antialias: true },
    })

    map.addControl(
      new maplibregl.AttributionControl({
        compact: true,
        customAttribution: '© IGN/CNIG - PNOA Máxima Actualidad',
      })
    )

    const overlay = new MapLibreOverlay({
      interleaved: true,
      layers: [],
      effects: [lightingEffect],
    })
    map.addControl(overlay)

    map.on('load', () => {
      setMapLoaded(true)
      // Zoom de entrada lento y lineal hasta 16 para dar dinamismo.
      // Se cancela automáticamente al volar a una ciudad (flyTo detiene la animación).
      map.easeTo({ zoom: 16, duration: 90000, easing: (t) => t })
    })

    mapRef.current = map
    overlayRef.current = overlay

    return () => {
      map.remove()
      mapRef.current = null
      overlayRef.current = null
    }
  }, [])

  // Cámara libre estilo Google Maps: activa pan, zoom y rotación con el ratón,
  // pero solo cuando NO hay órbita automática en curso (durante la órbita mandan los frames).
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapLoaded) return

    const free = !isOrbiting
    if (free) {
      map.dragPan.enable()
      map.dragRotate.enable()
      map.scrollZoom.enable()
      map.doubleClickZoom.enable()
      map.touchZoomRotate.enable()
      map.keyboard.enable()
      map.boxZoom.enable()
    } else {
      map.dragPan.disable()
      map.dragRotate.disable()
      map.scrollZoom.disable()
      map.doubleClickZoom.disable()
      map.touchZoomRotate.disable()
      map.keyboard.disable()
      map.boxZoom.disable()
    }
    map.getCanvas().style.cursor = free ? 'grab' : ''
  }, [isOrbiting, mapLoaded])

  // Manejar selección de ciudad con animación
  const flyToCity = useCallback((city: City) => {
    const map = mapRef.current
    if (!map || !city.center) return

    map.stop() // cancela el easeTo de entrada para que no derive la cámara
    const [lon, lat] = city.center
    map.flyTo({
      center: [lon, lat],
      zoom: city.zoom || 14,
      pitch: 55,
      bearing: 15,
      duration: 2500,
      essential: true,
    })
  }, [])

  // Órbita lenta alrededor de un monumento
  const stopOrbit = useCallback(() => {
    if (orbitFrameRef.current !== null) {
      cancelAnimationFrame(orbitFrameRef.current)
      orbitFrameRef.current = null
    }
    setIsOrbiting(false)
  }, [])

  const startOrbit = useCallback((center: [number, number]) => {
    const map = mapRef.current
    if (!map) return

    // Asegurar que el punto de interés esté exactamente en el centro antes de rotar
    map.jumpTo({ center })

    setIsOrbiting(true)
    let lastTime = performance.now()
    const speed = 6 // grados por segundo

    const animate = (time: number) => {
      const delta = Math.min((time - lastTime) / 1000, 1 / 30)
      lastTime = time

      const bearing = map.getBearing()
      map.setBearing(bearing + speed * delta)

      orbitFrameRef.current = requestAnimationFrame(animate)
    }

    orbitFrameRef.current = requestAnimationFrame(animate)
  }, [])

  // Pausar la órbita y pasar a control manual
  const handleStopOrbit = useCallback(() => {
    stopOrbit()
    setOrbitPaused(true)
  }, [stopOrbit])

  // Reanudar la órbita automática
  const handleResumeOrbit = useCallback(() => {
    const marker = selectedMonumentRef.current
    if (!marker) return
    setOrbitPaused(false)
    startOrbit([marker.lon, marker.lat])
  }, [startOrbit])

  // Girar en pasos (p. ej. ±45º)
  const handleRotate = useCallback((delta: number) => {
    const map = mapRef.current
    if (!map) return
    map.easeTo({ bearing: map.getBearing() + delta, duration: 400 })
  }, [])

  const flyToAndOrbitMonument = useCallback(
    (monument: Monument) => {
      const map = mapRef.current
      if (!map) return

      setOrbitPaused(false)
      stopOrbit()
      map.stop() // corta cualquier animación de cámara previa antes del vuelo

      map.flyTo({
        center: [monument.lon, monument.lat],
        zoom: 17.5,
        pitch: 65,
        bearing: 0,
        duration: 1800,
        essential: true,
      })

      map.once('moveend', () => {
        startOrbit([monument.lon, monument.lat])
      })
    },
    [startOrbit, stopOrbit]
  )

  useEffect(() => {
    return () => {
      stopOrbit()
    }
  }, [stopOrbit])

  // Manejar selección de ciudad con animación
  useEffect(() => {
    if (selectedCity) {
      setOrbitPaused(false)
      stopOrbit()
      flyToCity(selectedCity)
    }
  }, [selectedCity, flyToCity, stopOrbit])

  // Cuando cambia el monumento seleccionado desde el panel, orbitar sobre él
  useEffect(() => {
    if (selectedMonument && selectedMonument.id !== lastOrbitedMonumentRef.current) {
      lastOrbitedMonumentRef.current = selectedMonument.id
      flyToAndOrbitMonument(selectedMonument)
    }
  }, [selectedMonument, flyToAndOrbitMonument])

  // Sincronizar ref del monumento seleccionado para la animación sin re-render
  useEffect(() => {
    selectedMonumentRef.current = selectedMonument
    if (!selectedMonument) setOrbitPaused(false)
  }, [selectedMonument])

  // Actualizar capas base de DeckGL (3D + monumentos). No incluye la animación del marcador.
  useEffect(() => {
    if (!overlayRef.current) return

    const layers: any[] = []

    if (selectedCity?.tilesetUrl) {
      activeTilesetsRef.current.add(selectedCity.tilesetUrl)
    }
    activeTilesetsRef.current.forEach((url) => {
      layers.push(get3DTilesLayer(url, isOrbiting))
    })

    // Invocar a Godzilla junto al edificio que se está viendo
    if (selectedMonument) {
      const godzilla = createGodzillaLayer(selectedMonument)
      godzillaLayerRef.current = godzilla
      godzillaTimeRef.current = null
      layers.push(godzilla)
    } else {
      godzillaLayerRef.current = null
      godzillaTimeRef.current = null
    }

    if (monuments.length > 0) {
      layers.push(
        createMonumentsLayer(monuments, selectedMonument, {
          onHover: (info: any) => {
            const monument = info.object ? (info.object as Monument) : null
            const id = monument?.id ?? null
            if (id === hoveredIdRef.current) return
            hoveredIdRef.current = id

            if (monument) {
              setHoveredMonument(monument)
              setHoverPosition(info.pixel ? { x: info.pixel[0], y: info.pixel[1] } : null)
            } else {
              setHoveredMonument(null)
              setHoverPosition(null)
            }
          },
          onClick: (info: any) => {
            if (info.object) {
              onMonumentSelect(info.object as Monument)
            }
          },
        })
      )
    }

    baseLayersRef.current = layers

    // Incluir marcador estático inicial si hay monumento seleccionado
    const marker = selectedMonumentRef.current
    overlayRef.current.setProps({
      layers: marker
        ? [...layers, ...createMonumentMarkerLayers(marker, performance.now())]
        : layers,
    })
  }, [selectedCity, monuments, selectedMonument, isOrbiting, onMonumentSelect])

  // Animación del marcador 3D: actualiza deck.gl directamente sin tocar React
  useEffect(() => {
    if (!selectedMonument || !overlayRef.current) return

    const animate = () => {
      const marker = selectedMonumentRef.current
      if (marker && overlayRef.current) {
        // En modo interleaved MapLibre controla el render y el timeline de deck no
        // avanza, así que avanzamos el animador del glTF a mano (delta en segundos).
        const animator = godzillaLayerRef.current?.state?.animator
        if (animator) {
          const now = performance.now()
          const delta = godzillaTimeRef.current === null ? 0 : (now - godzillaTimeRef.current) / 1000
          godzillaTimeRef.current = now
          animator.getAnimations?.().forEach((animation: any) => {
            if (!animation.playing) animation.playing = true
          })
          animator.update?.(delta)
        }

        overlayRef.current.setProps({
          layers: [...baseLayersRef.current, ...createMonumentMarkerLayers(marker, performance.now())],
        })
        // Con la órbita parada MapLibre deja de repintar; forzamos el frame para que
        // se apliquen la animación del glTF y el pulso del marcador.
        mapRef.current?.triggerRepaint()
      }
      markerFrameRef.current = requestAnimationFrame(animate)
    }
    markerFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (markerFrameRef.current !== null) {
        cancelAnimationFrame(markerFrameRef.current)
        markerFrameRef.current = null
      }
    }
  }, [selectedMonument])

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="absolute inset-0" />
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-obsidian-loam z-50">
          <div className="flex flex-col items-center gap-3">
            <div className="w-7 h-7 border border-drift-ash border-t-lime-surveyor rounded-full animate-spin" />
            <span className="font-jetbrains-mono text-caption uppercase tracking-[0.15em] text-drift-ash">
              Cargando mapa
            </span>
          </div>
        </div>
      )}

      {hoveredMonument && hoverPosition && (
        <MonumentTooltip monument={hoveredMonument} x={hoverPosition.x} y={hoverPosition.y} />
      )}

      {isOrbiting && (
        <button
          onClick={handleStopOrbit}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-[18px] py-[14px] bg-lime-surveyor text-obsidian-loam rounded-md font-jetbrains-mono text-[14px] uppercase tracking-[0.15em] hover:bg-marsh-olive"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-obsidian-loam animate-pulse" />
          Detener órbita
        </button>
      )}

      {!isOrbiting && orbitPaused && selectedMonument && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
          <button
            onClick={() => handleRotate(-45)}
            className="flex items-center gap-2 px-[18px] py-[14px] bg-lime-surveyor text-obsidian-loam rounded-md font-jetbrains-mono text-[14px] uppercase tracking-[0.15em] hover:bg-marsh-olive"
          >
            <RotateCcw className="w-4 h-4" />
            45°
          </button>
          <button
            onClick={() => handleRotate(45)}
            className="flex items-center gap-2 px-[18px] py-[14px] bg-lime-surveyor text-obsidian-loam rounded-md font-jetbrains-mono text-[14px] uppercase tracking-[0.15em] hover:bg-marsh-olive"
          >
            45°
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleResumeOrbit}
            className="flex items-center gap-3 px-[18px] py-[14px] bg-lime-surveyor text-obsidian-loam rounded-md font-jetbrains-mono text-[14px] uppercase tracking-[0.15em] hover:bg-marsh-olive"
          >
            <Orbit className="w-4 h-4" />
            Orbitar
          </button>
        </div>
      )}
    </div>
  )
}

function getTiles3dLoadOptions(isOrbiting: boolean) {
  return {
    '3d-tiles': {
      loadGLTF: true,
      maximumScreenSpaceError: isOrbiting ? Infinity : 16,
    },
  }
}

const tileLayerCache = new Map<string, Tile3DLayer>()

function get3DTilesLayer(tilesetUrl: string, isOrbiting: boolean): Tile3DLayer {
  const layer = new Tile3DLayer({
    id: `pnoa-3d-${tilesetUrl}`,
    data: tilesetUrl,
    loader: Tiles3DLoader,
    loadOptions: getTiles3dLoadOptions(isOrbiting),
    pickable: false,
    onTilesetLoad: handleTilesetLoad,
    onTileError: handleTileError,
  })
  tileLayerCache.set(tilesetUrl, layer)
  return layer
}

function handleTilesetLoad(tileset: unknown) {
  console.log('Tileset cargado:', tileset)
}

function handleTileError(error: unknown) {
  console.error('Error cargando tile:', error)
}

// Godzilla: el GLB tiene ~112 unidades de alto en su pose base (Y arriba).
const GODZILLA_MODEL_HEIGHT = 112
const GODZILLA_HEIGHT_M = 1040
const GODZILLA_OFFSET_M = 0
// El glTF viene con Y hacia arriba; deck.gl trabaja con Z hacia arriba.
// En ScenegraphLayer el giro que endereza el modelo es el "roll" (3er valor), no el pitch.
const GODZILLA_ROLL = 90
const GODZILLA_YAW = 0

function metersToLon(meters: number, lat: number): number {
  return meters / (111320 * Math.cos((lat * Math.PI) / 180))
}

function metersToLat(meters: number): number {
  return meters / 111320
}

function createGodzillaLayer(monument: Monument) {
  const lon = monument.lon + metersToLon(GODZILLA_OFFSET_M, monument.lat)
  const lat = monument.lat + metersToLat(GODZILLA_OFFSET_M * 0.4)

  return new ScenegraphLayer({
    id: 'godzilla-layer',
    data: [monument],
    scenegraph: `${import.meta.env.BASE_URL}models/godzilla.glb`,
    sizeScale: GODZILLA_HEIGHT_M / GODZILLA_MODEL_HEIGHT,
    sizeMinPixels: 0,
    getPosition: () => [lon, lat, 0],
    getOrientation: () => [0, GODZILLA_YAW, GODZILLA_ROLL],
    pickable: false,
    _lighting: 'pbr',
  })
}

interface MonumentsCallbacks {
  onHover: (info: any) => void
  onClick: (info: any) => void
}

function createMonumentsLayer(
  monuments: Monument[],
  selectedMonument: Monument | null,
  callbacks: MonumentsCallbacks
) {
  return new ScatterplotLayer({
    id: 'monuments-layer',
    data: monuments,
    pickable: true,
    opacity: 0.9,
    stroked: true,
    filled: true,
    radiusScale: 1,
    radiusMinPixels: 8,
    radiusMaxPixels: selectedMonument ? 24 : 20,
    lineWidthMinPixels: 2,
    getPosition: (d: Monument) => [d.lon, d.lat],
    getRadius: (d: Monument) => (d.id === selectedMonument?.id ? 90 : 60),
    getFillColor: (d: Monument) =>
      d.id === selectedMonument?.id ? [235, 252, 114, 255] : [235, 252, 114, 150],
    getLineColor: [244, 243, 232, 255],
    onHover: callbacks.onHover,
    onClick: callbacks.onClick,
  })
}

function createMonumentMarkerLayers(monument: Monument, tick: number) {
  const position: [number, number, number] = [monument.lon, monument.lat, 12]
  const topPosition: [number, number, number] = [monument.lon, monument.lat, 110]
  const phase = (tick % 1800) / 1800
  const pulseRadius = 40 + phase * 80
  const pulseOpacity = Math.round(255 * (1 - phase))

  const ringLayer = new ScatterplotLayer({
    id: 'monument-marker-ring',
    data: [monument],
    pickable: false,
    stroked: true,
    filled: false,
    radiusScale: 1,
    radiusMinPixels: 2,
    lineWidthMinPixels: 2,
    getPosition: () => position,
    getRadius: () => 55,
    getLineColor: [235, 252, 114, 255],
  })

  const pulseLayer = new ScatterplotLayer({
    id: 'monument-marker-pulse',
    data: [monument],
    pickable: false,
    stroked: true,
    filled: false,
    radiusScale: 1,
    radiusMinPixels: 2,
    lineWidthMinPixels: 2,
    getPosition: () => position,
    getRadius: () => pulseRadius,
    getLineColor: [235, 252, 114, pulseOpacity],
  })

  const columnLayer = new LineLayer({
    id: 'monument-marker-column',
    data: [monument],
    pickable: false,
    getSourcePosition: () => position,
    getTargetPosition: () => topPosition,
    getColor: [235, 252, 114, 200],
    getWidth: 3,
  })

  const labelLayer = new TextLayer({
    id: 'monument-marker-label',
    data: [monument],
    pickable: false,
    getPosition: () => topPosition,
    getText: (d: Monument) => d.name,
    getSize: 14,
    getColor: [244, 243, 232, 255],
    getAngle: 0,
    getTextAnchor: 'middle',
    getAlignmentBaseline: 'bottom',
    billboard: true,
    fontWeight: 600,
    getPixelOffset: [0, -8],
    fontSettings: { sdf: true },
    outlineWidth: 3,
    outlineColor: [19, 20, 14, 255],
  })

  return [ringLayer, pulseLayer, columnLayer, labelLayer]
}
