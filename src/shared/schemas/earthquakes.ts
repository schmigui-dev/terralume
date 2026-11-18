import { z } from 'zod'

export const MAX_RANGE_MS = 7 * 24 * 3600_000
export const HISTORY_WINDOW_MS = 30 * 24 * 3600_000

const isoOrMs = z
  .union([z.coerce.number().int().positive(), z.string().datetime()])
  .transform((v) => (typeof v === 'number' ? v : Date.parse(v)))

export const EarthquakeQuerySchema = z
  .object({
    from: isoOrMs,
    to: isoOrMs,
    minMagnitude: z.coerce.number().min(-1).max(10).default(2.5),
  })
  .refine((q) => q.to > q.from, { message: '`to` must be after `from`' })
  .refine((q) => q.to - q.from <= MAX_RANGE_MS, { message: 'range may not exceed 7 days' })

export type EarthquakeQuery = z.infer<typeof EarthquakeQuerySchema>
