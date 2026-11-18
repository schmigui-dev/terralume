import { useMemo } from 'react'
import type { EarthquakeEvent } from '#/shared/types/geo'
import { magnitudeColor } from '#/shared/utils/magnitude'
import { formatRelative } from '#/shared/utils/time'
import { useApp } from '#/stores/app'

type Sort = 'time' | 'magnitude'

/** Accessible alternative to 3D picking. */
export function EventList({ events, now, sort = 'time' }: { events: EarthquakeEvent[]; now: number; sort?: Sort }) {
  const selectedId = useApp((s) => s.selectedEventId)
  const select = useApp((s) => s.select)
  const hover = useApp((s) => s.hover)
  const sorted = useMemo(
    () =>
      [...events]
        .sort((a, b) => (sort === 'time' ? b.time - a.time : b.properties.magnitude - a.properties.magnitude))
        .slice(0, 300),
    [events, sort],
  )

  if (!events.length) return <p className="px-1 py-6 text-center text-sm text-ink-soft">No events at this time.</p>

  return (
    <ul className="-mx-1 space-y-px" aria-label="Earthquakes">
      {sorted.map((e) => (
        <li key={e.id}>
          <button
            type="button"
            onClick={() => select(e.id)}
            onMouseEnter={() => hover(e.id)}
            onMouseLeave={() => hover(null)}
            aria-current={selectedId === e.id ? 'true' : undefined}
            className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-white/6 ${selectedId === e.id ? 'bg-white/10' : ''}`}
          >
            <span
              className="tabular w-8 shrink-0 font-mono text-[13px]"
              style={{ color: magnitudeColor(e.properties.magnitude) }}
            >
              {e.properties.magnitude.toFixed(1)}
            </span>
            <span className="min-w-0 flex-1 truncate text-[13px] text-ink">{e.properties.place}</span>
            <span className="tabular shrink-0 text-[11px] text-ink-faint">{formatRelative(e.time, now)}</span>
          </button>
        </li>
      ))}
    </ul>
  )
}
