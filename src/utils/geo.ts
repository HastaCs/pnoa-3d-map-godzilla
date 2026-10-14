/**
 * Calcula la distancia entre dos puntos geodésicos usando la fórmula de Haversine.
 * Devuelve la distancia en kilómetros.
 */
export function haversineDistance(
  lon1: number,
  lat1: number,
  lon2: number,
  lat2: number
): number {
  const R = 6371 // Radio de la Tierra en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Convierte grados decimales a formato DMS (grados, minutos, segundos).
 */
export function toDMS(value: number, isLatitude: boolean): string {
  const absolute = Math.abs(value)
  const degrees = Math.floor(absolute)
  const minutesFloat = (absolute - degrees) * 60
  const minutes = Math.floor(minutesFloat)
  const seconds = ((minutesFloat - minutes) * 60).toFixed(1)

  const direction = isLatitude
    ? value >= 0
      ? 'N'
      : 'S'
    : value >= 0
    ? 'E'
    : 'W'

  return `${degrees}° ${minutes}' ${seconds}" ${direction}`
}
