import { describe, expect, it, vi } from 'vitest'
import { MemoryCache } from '#/server/cache/memory'
import { buildUsgsUrl, fetchUsgsRange, normalizeUsgs, UpstreamError } from '#/server/providers/usgs'
import { EarthquakeQuerySchema } from '#/shared/schemas/earthquakes'
import fixture from './fixtures/usgs-sample.json'

const RETRIEVED = '2026-11-18T00:00:00.000Z'

describe('normalizeUsgs', () => {
  it('normalizes a real USGS payload', () => {
    const { events, rejected } = normalizeUsgs(fixture, RETRIEVED)
    expect(rejected).toBe(0)
    expect(events).toHaveLength(fixture.features.length)
    const e = events[0]
    expect(e.type).toBe('earthquake')
    expect(e.id).toMatch(/^usgs:/)
    expect(e.timestamp).toBe(new Date(e.time).toISOString())
    expect(e.source).toMatchObject({ provider: 'usgs', retrievedAt: RETRIEVED })
    expect(e.source.url).toMatch(/^https:\/\/earthquake\.usgs\.gov\//)
    expect(typeof e.properties.magnitude).toBe('number')
    expect(typeof e.properties.depthKm).toBe('number')
  })

  it('sorts ascending by time', () => {
    const { events } = normalizeUsgs(fixture, RETRIEVED)
    for (let i = 1; i < events.length; i++) expect(events[i].time).toBeGreaterThanOrEqual(events[i - 1].time)
  })

  const feature = (over: Record<string, unknown> = {}, coords: unknown = [10, 20, 5]) => ({
    type: 'Feature',
    id: 'x1',
    properties: { mag: 4.2, place: 'Somewhere', time: 1000, updated: 1000, status: 'reviewed', type: 'earthquake', ...over },
    geometry: { type: 'Point', coordinates: coords },
  })

  it('drops invalid features without failing the batch', () => {
    const payload = {
      type: 'FeatureCollection',
      features: [
        feature(),
        feature({ mag: null }, [1, 2, 3]),
        { ...feature(), id: 'bad-coords', geometry: { type: 'Point', coordinates: [500, 20, 1] } },
        { ...feature({ type: 'quarry blast' }), id: 'blast' },
        { ...feature({ status: 'deleted' }), id: 'deleted' },
        { garbage: true },
      ],
    }
    const { events, rejected } = normalizeUsgs(payload, RETRIEVED)
    expect(events.map((e) => e.id)).toEqual(['usgs:x1'])
    expect(rejected).toBe(5)
  })

  it('deduplicates by id keeping the latest revision', () => {
    const payload = {
      type: 'FeatureCollection',
      features: [
        feature({ mag: 4.0, updated: 1000 }),
        feature({ mag: 4.4, updated: 2000 }),
        feature({ mag: 4.1, updated: 1500 }),
      ],
    }
    const { events } = normalizeUsgs(payload, RETRIEVED)
    expect(events).toHaveLength(1)
    expect(events[0].properties.magnitude).toBe(4.4)
  })

  it('handles missing depth and maps lon/lat order correctly', () => {
    const { events } = normalizeUsgs({ type: 'FeatureCollection', features: [feature({}, [-70.5, 18.2])] }, RETRIEVED)
    expect(events[0].position).toEqual({ latitude: 18.2, longitude: -70.5 })
    expect(events[0].properties.depthKm).toBe(0)
  })

  it('throws upstream_invalid for non-collections', () => {
    expect(() => normalizeUsgs({ hello: 'world' }, RETRIEVED)).toThrow(UpstreamError)
  })
})

describe('fetchUsgsRange', () => {
  const range = { start: Date.parse('2026-11-17T00:00:00Z'), end: Date.parse('2026-11-17T06:00:00Z') }

  it('only calls the fixed USGS host', () => {
    const url = new URL(buildUsgsUrl(range, 2.5))
    expect(url.origin).toBe('https://earthquake.usgs.gov')
    expect(url.searchParams.get('starttime')).toBe('2026-11-17T00:00:00.000Z')
    expect(url.searchParams.get('minmagnitude')).toBe('2.5')
  })

  it('retries once on network failure, then succeeds', async () => {
    const fetchImpl = vi
      .fn()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce(new Response(JSON.stringify(fixture), { status: 200 }))
    const { events } = await fetchUsgsRange(range, 2.5, fetchImpl as unknown as typeof fetch)
    expect(fetchImpl).toHaveBeenCalledTimes(2)
    expect(events.length).toBe(fixture.features.length)
  })

  it('maps 5xx to upstream_unavailable', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response('nope', { status: 503 }))
    await expect(fetchUsgsRange(range, 2.5, fetchImpl as unknown as typeof fetch)).rejects.toMatchObject({
      code: 'upstream_unavailable',
    })
  })

  it('does not retry 4xx', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response('bad', { status: 400 }))
    await expect(fetchUsgsRange(range, 2.5, fetchImpl as unknown as typeof fetch)).rejects.toMatchObject({
      code: 'upstream_invalid',
    })
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })
})

describe('EarthquakeQuerySchema', () => {
  it('accepts ms and ISO timestamps', () => {
    const q = EarthquakeQuerySchema.parse({ from: '2026-11-17T00:00:00Z', to: String(Date.parse('2026-11-18T00:00:00Z')) })
    expect(q.to - q.from).toBe(86_400_000)
    expect(q.minMagnitude).toBe(2.5)
  })

  it('rejects reversed, oversized, and junk ranges', () => {
    expect(EarthquakeQuerySchema.safeParse({ from: '2000', to: '1000' }).success).toBe(false)
    expect(EarthquakeQuerySchema.safeParse({ from: '0', to: String(30 * 86_400_000) }).success).toBe(false)
    expect(EarthquakeQuerySchema.safeParse({ from: 'yesterday', to: 'today' }).success).toBe(false)
    expect(EarthquakeQuerySchema.safeParse({ from: '1000', to: '2000', minMagnitude: '42' }).success).toBe(false)
  })
})

describe('MemoryCache', () => {
  it('reports freshness and evicts past max staleness', () => {
    let now = 0
    const cache = new MemoryCache<string>(1000, 5000, 10, () => now)
    cache.set('a', 'x')
    expect(cache.get('a')).toEqual({ value: 'x', fresh: true })
    now = 2000
    expect(cache.get('a')).toEqual({ value: 'x', fresh: false })
    now = 6000
    expect(cache.get('a')).toBeUndefined()
  })

  it('bounds entry count', () => {
    const cache = new MemoryCache<number>(1000, 1000, 2, () => 0)
    cache.set('a', 1)
    cache.set('b', 2)
    cache.set('c', 3)
    expect(cache.get('a')).toBeUndefined()
    expect(cache.get('c')?.value).toBe(3)
  })
})
