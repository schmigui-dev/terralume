import { z } from 'zod'

/** Subset of USGS GeoJSON we rely on. Unknown fields are ignored. */
export const UsgsFeatureSchema = z.object({
  id: z.string().min(1),
  properties: z.object({
    mag: z.number().nullable(),
    place: z.string().nullable(),
    time: z.number(),
    updated: z.number().nullable().optional(),
    url: z.string().url().nullable().optional(),
    status: z.string().nullable().optional(),
    tsunami: z.number().nullable().optional(),
    magType: z.string().nullable().optional(),
    type: z.string().nullable().optional(),
  }),
  geometry: z.object({
    type: z.literal('Point'),
    coordinates: z.tuple([z.number(), z.number(), z.number().nullable()]).or(z.tuple([z.number(), z.number()])),
  }),
})

export const UsgsCollectionSchema = z.object({
  type: z.literal('FeatureCollection'),
  metadata: z.object({ generated: z.number().optional(), count: z.number().optional() }).optional(),
  features: z.array(z.unknown()),
})

export type UsgsFeature = z.infer<typeof UsgsFeatureSchema>
