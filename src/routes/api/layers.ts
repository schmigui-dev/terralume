import { createFileRoute } from '@tanstack/react-router'
import { json } from '#/server/http'
import { earthquakeLayerMetadata } from '#/server/providers/usgs'

export const Route = createFileRoute('/api/layers')({
  server: {
    handlers: {
      GET: () => json({ layers: [earthquakeLayerMetadata] }, { maxAge: 3600 }),
    },
  },
})
