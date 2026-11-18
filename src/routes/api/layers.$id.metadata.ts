import { createFileRoute } from '@tanstack/react-router'
import { apiError, json } from '#/server/http'
import { earthquakeLayerMetadata } from '#/server/providers/usgs'

const LAYERS = { [earthquakeLayerMetadata.id]: earthquakeLayerMetadata }

export const Route = createFileRoute('/api/layers/$id/metadata')({
  server: {
    handlers: {
      GET: ({ params }) => {
        const layer = LAYERS[params.id]
        return layer ? json(layer, { maxAge: 3600 }) : apiError('invalid_params', `Unknown layer: ${params.id}`)
      },
    },
  },
})
