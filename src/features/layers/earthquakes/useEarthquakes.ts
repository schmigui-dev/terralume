import { useQuery } from '@tanstack/react-query'
import { useClock } from '#/features/timeline/clock'
import type { ApiError, EarthquakeResponse } from '#/shared/types/geo'
import { DAY, floorTo, MINUTE } from '#/shared/utils/time'
import { useApp } from '#/stores/app'

export class ApiRequestError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message)
  }
}

async function fetchEarthquakes(from: number, to: number, minMagnitude: number): Promise<EarthquakeResponse> {
  const qs = new URLSearchParams({ from: String(from), to: String(to), minMagnitude: String(minMagnitude) })
  const res = await fetch(`/api/earthquakes?${qs}`)
  const body = (await res.json()) as EarthquakeResponse | ApiError
  if (!res.ok || 'error' in body) {
    const e = 'error' in body ? body.error : { code: 'internal', message: `HTTP ${res.status}` }
    throw new ApiRequestError(e.code, e.message)
  }
  return body
}

/**
 * Fetches the whole visible range once; playback filters client-side.
 * The window end is bucketed to 5 minutes so the clock ticking never triggers refetches.
 */
export function useEarthquakes() {
  const enabled = useApp((s) => s.layers.earthquakes)
  const minMagnitude = useApp((s) => s.minMagnitude)
  const rangeDays = useApp((s) => s.rangeDays)
  const end = useClock((s) => floorTo(s.rangeEnd, 5 * MINUTE) + 5 * MINUTE)
  const isLive = useClock((s) => s.mode === 'live')
  const start = end - rangeDays * DAY - 5 * MINUTE

  return useQuery({
    queryKey: ['earthquakes', start, end, minMagnitude],
    queryFn: () => fetchEarthquakes(start, end, minMagnitude),
    enabled,
    staleTime: 2 * MINUTE,
    refetchInterval: isLive ? 5 * MINUTE : false,
    placeholderData: (prev) => prev,
    retry: 2,
  })
}
