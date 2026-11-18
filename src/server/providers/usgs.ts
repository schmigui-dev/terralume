import { HISTORY_WINDOW_MS, MAX_RANGE_MS } from '#/shared/schemas/earthquakes'
import { UsgsCollectionSchema, UsgsFeatureSchema } from '#/shared/schemas/usgs'
import type { EarthquakeEvent, LayerMetadata, TimeRange } from '#/shared/types/geo'
import { isValidCoordinate } from '#/shared/utils/geo'

export const USGS_PROVIDER_ID = 'usgs'
/** Fixed upstream host — never build URLs from user input. */
const USGS_QUERY_ENDPOINT = 'https://earthquake.usgs.gov/fdsnws/event/1/query'
const UPSTREAM_TIMEOUT_MS = 8_000

export const earthquakeLayerMetadata: LayerMetadata = {
  id: 'earthquakes',
  name: 'Earthquakes',
  provider: 'USGS Earthquake Hazards Program',
  providerUrl: 'https://earthquake.usgs.gov/earthquakes/feed/',
  attribution: 'U.S. Geological Survey',
  license: 'Public domain (U.S. Government work)',
  limitations: [
    'Automatic solutions may be revised or deleted after analyst review.',
    'Global completeness varies by region; small events outside the U.S. are under-reported.',
    'Pulse rings are illustrative and do not depict seismic-wave propagation.',
  ],
  capabilities: {
    supportsHistoricalData: true,
    supportsLiveData: true,
    supportsGeographicFiltering: false,
    refreshIntervalSeconds: 300,
    maxRangeMs: MAX_RANGE_MS,
    historyWindowMs: HISTORY_WINDOW_MS,
    interpolation: 'none',
    coverage: 'Global',
  },
}

export class UpstreamError extends Error {
  constructor(
    readonly code: 'upstream_unavailable' | 'upstream_invalid',
    message: string,
  ) {
    super(message)
  }
}

export interface NormalizeResult {
  events: EarthquakeEvent[]
  rejected: number
}

/** Validate a USGS GeoJSON payload and normalize it. Invalid features are dropped, not fatal. */
export function normalizeUsgs(payload: unknown, retrievedAt: string): NormalizeResult {
  const collection = UsgsCollectionSchema.safeParse(payload)
  if (!collection.success) throw new UpstreamError('upstream_invalid', 'USGS payload is not a FeatureCollection')

  const byId = new Map<string, EarthquakeEvent>()
  let rejected = 0
  for (const raw of collection.data.features) {
    const parsed = UsgsFeatureSchema.safeParse(raw)
    if (!parsed.success) {
      rejected++
      continue
    }
    const f = parsed.data
    const [lon, lat, depth] = f.geometry.coordinates
    const p = f.properties
    if (p.mag == null || !isValidCoordinate(lat, lon) || p.status === 'deleted') {
      rejected++
      continue
    }
    if (p.type && p.type !== 'earthquake') {
      rejected++
      continue
    }
    const event: EarthquakeEvent = {
      id: `${USGS_PROVIDER_ID}:${f.id}`,
      type: 'earthquake',
      timestamp: new Date(p.time).toISOString(),
      time: p.time,
      position: { latitude: lat, longitude: lon },
      source: { provider: USGS_PROVIDER_ID, url: p.url ?? undefined, retrievedAt },
      properties: {
        magnitude: p.mag,
        magnitudeType: p.magType ?? undefined,
        depthKm: depth ?? 0,
        place: p.place ?? 'Unknown location',
        status: p.status ?? 'automatic',
        tsunami: p.tsunami === 1,
        updated: p.updated ?? p.time,
      },
    }
    // Deduplicate: keep the most recently updated revision.
    const existing = byId.get(event.id)
    if (!existing || existing.properties.updated < event.properties.updated) byId.set(event.id, event)
  }
  const events = [...byId.values()].sort((a, b) => a.time - b.time)
  return { events, rejected }
}

export function buildUsgsUrl(range: TimeRange, minMagnitude: number): string {
  const url = new URL(USGS_QUERY_ENDPOINT)
  url.searchParams.set('format', 'geojson')
  url.searchParams.set('starttime', new Date(range.start).toISOString())
  url.searchParams.set('endtime', new Date(range.end).toISOString())
  url.searchParams.set('minmagnitude', String(minMagnitude))
  url.searchParams.set('orderby', 'time-asc')
  url.searchParams.set('limit', '20000')
  return url.toString()
}

export async function fetchUsgsRange(
  range: TimeRange,
  minMagnitude: number,
  fetchImpl: typeof fetch = fetch,
): Promise<NormalizeResult> {
  const url = buildUsgsUrl(range, minMagnitude)
  let lastError: unknown
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetchImpl(url, {
        signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
        headers: { accept: 'application/json', 'user-agent': 'terralume/0.1' },
      })
      if (res.status >= 500) throw new UpstreamError('upstream_unavailable', `USGS responded ${res.status}`)
      if (!res.ok) throw new UpstreamError('upstream_invalid', `USGS responded ${res.status}`)
      return normalizeUsgs(await res.json(), new Date().toISOString())
    } catch (err) {
      lastError = err
      if (err instanceof UpstreamError && err.code === 'upstream_invalid') break
      if (attempt === 0) await new Promise((r) => setTimeout(r, 400))
    }
  }
  if (lastError instanceof UpstreamError) throw lastError
  throw new UpstreamError('upstream_unavailable', lastError instanceof Error ? lastError.message : 'USGS unreachable')
}
