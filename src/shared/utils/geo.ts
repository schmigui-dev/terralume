const DEG = Math.PI / 180

/**
 * Geographic → unit-sphere cartesian, matching three.js SphereGeometry UV layout
 * with an equirectangular texture (lon 0 at +X, north at +Y, lon +90 at -Z).
 */
export function latLonToVector(latDeg: number, lonDeg: number, radius = 1): [number, number, number] {
  const lat = latDeg * DEG
  const lon = lonDeg * DEG
  const c = Math.cos(lat)
  return [radius * c * Math.cos(lon), radius * Math.sin(lat), -radius * c * Math.sin(lon)]
}

export function vectorToLatLon(x: number, y: number, z: number): { lat: number; lon: number } {
  const r = Math.hypot(x, y, z)
  return { lat: Math.asin(y / r) / DEG, lon: Math.atan2(-z, x) / DEG }
}

export function isValidCoordinate(lat: number, lon: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180
}
