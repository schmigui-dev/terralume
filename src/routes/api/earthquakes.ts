import { createFileRoute } from '@tanstack/react-router'
import { apiError, json } from '#/server/http'
import { UpstreamError } from '#/server/providers/usgs'
import { EARTHQUAKE_CACHE_TTL_S, getEarthquakes, RangeError400 } from '#/server/services/earthquakes'
import { EarthquakeQuerySchema } from '#/shared/schemas/earthquakes'

export const Route = createFileRoute('/api/earthquakes')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const params = Object.fromEntries(new URL(request.url).searchParams)
        const parsed = EarthquakeQuerySchema.safeParse(params)
        if (!parsed.success) {
          return apiError(
            'invalid_params',
            parsed.error.issues.map((i) => `${i.path.join('.') || 'query'}: ${i.message}`).join('; '),
          )
        }
        try {
          const data = await getEarthquakes(parsed.data)
          return json(data, { maxAge: data.stale ? 30 : EARTHQUAKE_CACHE_TTL_S })
        } catch (err) {
          if (err instanceof RangeError400) return apiError('invalid_params', err.message)
          if (err instanceof UpstreamError) return apiError(err.code, err.message)
          console.error('earthquakes route failed', err)
          return apiError('internal', 'Unexpected error')
        }
      },
    },
  },
})
