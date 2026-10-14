/**
 * Convierte coordenadas ECEF (EPSG:4978) a geodésicas WGS84 (lon, lat, alt).
 * El resultado es [longitud, latitud, altitud] en grados/metros.
 */
export function ecefToLngLatAlt(x: number, y: number, z: number): [number, number, number] {
  const a = 6378137.0 // WGS84 semi-major axis
  const e2 = 0.00669437999013 // WGS84 first eccentricity squared

  const p = Math.sqrt(x * x + y * y)
  const theta = Math.atan2(z * a, p * (1 - e2) * a)

  const lon = Math.atan2(y, x)
  const lat = Math.atan2(
    z + ((e2 * (1 - e2) * a * Math.pow(Math.sin(theta), 3)) / (1 - e2 * Math.pow(Math.sin(theta), 2))),
    p - ((e2 * a * Math.pow(Math.cos(theta), 3)) / (1 - e2 * Math.pow(Math.sin(theta), 2)))
  )
  const N = a / Math.sqrt(1 - e2 * Math.sin(lat) * Math.sin(lat))
  const alt = p / Math.cos(lat) - N

  return [lon * (180 / Math.PI), lat * (180 / Math.PI), alt]
}

/**
 * Extrae el centro aproximado de un bounding box en formato box de 3D Tiles.
 * box = [centerX, centerY, centerZ, axisX..., axisY..., axisZ...]
 */
export function boxCenter(box: number[]): [number, number, number] {
  return [box[0], box[1], box[2]]
}

/**
 * Convierte un bounding box orientado de 3D Tiles (ECEF) a un bbox geográfico
 * aproximado [minLon, minLat, maxLon, maxLat] en grados.
 */
export function boxToLngLatBounds(box: number[]): [number, number, number, number] {
  const cx = box[0]
  const cy = box[1]
  const cz = box[2]
  const ax = [box[3], box[4], box[5]]
  const ay = [box[6], box[7], box[8]]
  const az = [box[9], box[10], box[11]]

  let minLon = Infinity
  let minLat = Infinity
  let maxLon = -Infinity
  let maxLat = -Infinity

  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const x = cx + sx * ax[0] + sy * ay[0] + sz * az[0]
        const y = cy + sx * ax[1] + sy * ay[1] + sz * az[1]
        const z = cz + sx * ax[2] + sy * ay[2] + sz * az[2]

        const [lon, lat] = ecefToLngLatAlt(x, y, z)
        minLon = Math.min(minLon, lon)
        minLat = Math.min(minLat, lat)
        maxLon = Math.max(maxLon, lon)
        maxLat = Math.max(maxLat, lat)
      }
    }
  }

  return [minLon, minLat, maxLon, maxLat]
}
