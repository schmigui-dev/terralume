import { MemoryCache } from '#/server/cache/memory'
import { fetchUsgsRange, UpstreamError, USGS_PROVIDER_ID } from '#/server/providers/usgs'
import type { EarthquakeQuery } from '#/shared/schemas/earthquakes'
import { HISTORY_WINDOW_MS } from '#/shared/schemas/earthquakes'
import type { EarthquakeResponse } from '#/shared/types/geo'
import { floorTo, MINUTE } from '#/shared/utils/time'

export const EARTHQUAKE_CACHE_TTL_S = 120
const cache = new MemoryCache<EarthquakeResponse>(EARTHQUAKE_CACHE_TTL_S * 1000, 6 * 3600_000)

export class RangeError400 extends Error {}

export async function getEarthquakes(q: EarthquakeQuery, now = Date.now()): Promise<EarthquakeResponse> {
  if (q.from < now - HISTORY_WINDOW_MS) throw new RangeError400('`from` is older than the supported 30-day window')
  // Normalize to minute buckets so nearby requests share a cache entry; never query the future.
  const range = { start: floorTo(q.from, MINUTE), end: Math.min(floorTo(q.to, MINUTE) + MINUTE, now) }
  const key = `${range.start}:${range.end}:${q.minMagnitude}`

  const cached = cache.get(key)
  if (cached?.fresh) return cached.value

  try {
    const { events } = await fetchUsgsRange(range, q.minMagnitude)
    const response: EarthquakeResponse = {
      events,
      range,
      minMagnitude: q.minMagnitude,
      retrievedAt: new Date().toISOString(),
      stale: false,
      provider: USGS_PROVIDER_ID,
    }
    cache.set(key, response)
    return response
  } catch (err) {
    if (cached && err instanceof UpstreamError) return { ...cached.value, stale: true }
    throw err
  }
}
