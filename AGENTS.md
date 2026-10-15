# AGENTS.md

PNOA Ciudades 3D — visor web (solo cliente) que superpone tiles 3D del PNOA sobre la ortofoto del IGN, con monumentos de Wikidata/Wikipedia. No hay backend ni API keys.

## Comandos

- `npm run dev` — Vite dev server en http://localhost:5173
- `npm run build` — `tsc -b && vite build` (aquí ocurre el typecheck real) → `dist/`
- `npm run lint` — oxlint (config `.oxlintrc.json`)
- `npm run preview` — sirve el build

Verificación recomendada: `npm run lint` y luego `npm run build`. No hay script de typecheck aparte; usa `npx tsc -b`.

## Testing

**No hay tests ni runner configurado.** `playwright` está en devDependencies pero no se usa en ningún sitio: no asumas tests existentes ni `npm test`.

## Toolchain (versiones bleeding-edge)

React 19, Vite 8, TypeScript ~6.0, Tailwind CSS 4, deck.gl 9.4, maplibre-gl 6, TanStack Query 5. Consulta `package.json` antes de usar APIs; no apliques patrones de versiones anteriores.

- `tsconfig.app.json`: `verbatimModuleSyntax` + `erasableSyntaxOnly` → importa tipos con `import type`; prohibido `enum`, `namespace` y parameter properties. `noUnusedLocals`/`noUnusedParameters` hacen fallar el build por variables sin usar.
- Tailwind v4: **no** hay `tailwind.config.js`. El tema se define con `@theme` en `src/index.css` y genera tokens como `bg-obsidian-loam`, `text-bone-vellum`, `text-heading`, `font-jetbrains-mono`. No inventes colores; añade el token en `@theme`.

## Arquitectura

Flujo: `src/main.tsx` (QueryClientProvider) → `src/App.tsx` (estado de ciudad/monumento) → `src/components/Map/MapContainer.tsx` (MapLibre + deck.gl).

- `src/services/` — fetch de datos externos; `src/hooks/` — wrappers de React Query; `src/lib/queryClient.ts` + `queryKeys.ts` — config y claves de caché; `src/utils/` — `ecef.ts` (proyección ECEF→WGS84), `geo.ts` (haversine), `cityCodes.ts` (diccionario estático de códigos IGN).
- Datos en tiempo de ejecución desde servicios externos: Wikidata SPARQL (`query.wikidata.org`), tileset raíz de IDEE (`servicios3d.idee.es/pnoa-ma`), WMTS del IGN, y API REST de Wikipedia (es). Sin variables de entorno.
- La lista de ciudades se construye fusionando municipios de Wikidata (población ≥50.000) con las ciudades del tileset raíz por cercanía haversine <10 km (`services/cities.ts`). Las zonas nuevas del catálogo PNOA aparecen solas; no hay lista hardcodeada que actualizar.
- Cobertura 3D actual: Andalucía, Extremadura y Región de Murcia (vuelo 2025). El resto de ciudades existe sin `tilesetUrl` y se filtra en `App.tsx`.

## Gotchas de render

- `MapContainer.tsx` registra el worker de MapLibre con `maplibregl.setWorkerUrl(new URL('maplibre-gl/dist/maplibre-gl-worker.mjs', import.meta.url).href)`. Es imprescindible para Vite; no lo elimines.
- `MapLibreOverlay` se usa con `interleaved: true`.
- La órbita y el marcador animan con `requestAnimationFrame` + `overlay.setProps(...)` directamente, fuera del ciclo de React (rendimiento deliberado). No lo conviertas en estado de React.
- Mientras orbita, el LOD se congela con `maximumScreenSpaceError: Infinity` (`getTiles3dLoadOptions`).
- Interacción con el mapa deshabilitada a propósito (`dragPan`, `scrollZoom`, `dragRotate`…); la navegación es guiada por vuelos (`flyTo`).

## Convenciones

- UI, comentarios y los SPARQL están en **español**. Mantén el idioma.
- Sistema visual *INVERSA*: superficie oscura, tipografía editorial y un único acento lima. Usa los tokens de `index.css`, no colores ad-hoc.
- `tileLayerCache` en `MapContainer.tsx` se rellena pero nunca se lee (código muerto conocido).

## Deploy

Vercel (demo: `pnoa-3d-map.vercel.app`). No hay `vercel.json`; detecta el build estático de Vite automáticamente. No hay CI ni workflows en el repo.
