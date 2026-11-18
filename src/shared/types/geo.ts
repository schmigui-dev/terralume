export interface TimeRange {
  /** Unix ms, inclusive */
  start: number
  /** Unix ms, exclusive */
  end: number
}

export interface GeoEvent<TType extends string, TProps> {
  id: string
  type: TType
  /** ISO 8601 UTC */
  timestamp: string
  /** Unix ms, mirrors timestamp for cheap comparisons */
  time: number
  position: {
    latitude: number
    longitude: number
    altitudeMeters?: number
  }
  source: {
    provider: string
    url?: string
    retrievedAt: string
  }
  properties: TProps
}

export type EarthquakeEvent = GeoEvent<
  'earthquake',
  {
    magnitude: number
    magnitudeType?: string
    depthKm: number
    place: string
    status: 'automatic' | 'reviewed' | 'deleted' | string
    tsunami: boolean
    updated: number
  }
>

export type InterpolationPolicy = 'none' | 'linear-between-samples'

export interface ProviderCapabilities {
  supportsHistoricalData: boolean
  supportsLiveData: boolean
  supportsGeographicFiltering: boolean
  refreshIntervalSeconds: number | null
  /** Max range a single request may cover, ms */
  maxRangeMs: number
  /** How far back history is offered in this app, ms */
  historyWindowMs: number
  interpolation: InterpolationPolicy
  coverage: string
}

export interface LayerMetadata {
  id: string
  name: string
  provider: string
  providerUrl: string
  attribution: string
  license: string
  limitations: string[]
  capabilities: ProviderCapabilities
}

export interface EarthquakeResponse {
  events: EarthquakeEvent[]
  range: TimeRange
  minMagnitude: number
  retrievedAt: string
  /** true when served from cache after upstream failure */
  stale: boolean
  provider: string
}

export type ApiErrorCode = 'invalid_params' | 'upstream_unavailable' | 'upstream_invalid' | 'internal'

export interface ApiError {
  error: { code: ApiErrorCode; message: string }
}
