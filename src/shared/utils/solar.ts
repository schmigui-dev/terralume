const DEG = Math.PI / 180

/**
 * Subsolar point (where the Sun is at zenith) for a UTC instant.
 * NOAA low-precision algorithm; accurate to ~0.1° for visualization.
 */
export function subsolarPoint(timeMs: number): { lat: number; lon: number } {
  const jd = timeMs / 86_400_000 + 2_440_587.5
  const n = jd - 2_451_545.0
  const L = (280.46 + 0.9856474 * n) % 360
  const g = ((357.528 + 0.9856003 * n) % 360) * DEG
  const lambda = (L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * DEG
  const epsilon = (23.439 - 0.0000004 * n) * DEG
  const declination = Math.asin(Math.sin(epsilon) * Math.sin(lambda))
  const ra = Math.atan2(Math.cos(epsilon) * Math.sin(lambda), Math.cos(lambda))
  // Equation of time in minutes
  let eot = (L * DEG - ra) / DEG
  eot = ((((eot + 180) % 360) + 360) % 360) - 180
  const eotMinutes = eot * 4
  const d = new Date(timeMs)
  const utcMinutes = d.getUTCHours() * 60 + d.getUTCMinutes() + d.getUTCSeconds() / 60 + d.getUTCMilliseconds() / 60000
  let lon = -(utcMinutes + eotMinutes - 720) / 4
  lon = ((((lon + 180) % 360) + 360) % 360) - 180
  return { lat: declination / DEG, lon }
}
