import type { EarthquakeEvent } from '#/shared/types/geo'
import { magnitudeColor } from '#/shared/utils/magnitude'
import { formatRelative, formatUtc } from '#/shared/utils/time'

export function EventDetails({ event, now, onClose }: { event: EarthquakeEvent; now: number; onClose: () => void }) {
  const p = event.properties
  return (
    <article aria-labelledby="event-title" className="glass animate-fade-up pointer-events-auto w-full rounded-2xl p-4 sm:w-80">
      <div className="flex items-start gap-3">
        <div
          className="tabular grid size-12 shrink-0 place-items-center rounded-xl font-mono text-lg font-medium text-space"
          style={{ background: magnitudeColor(p.magnitude) }}
          aria-hidden
        >
          {p.magnitude.toFixed(1)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">Earthquake</p>
          <h2 id="event-title" className="mt-0.5 text-[15px] leading-snug text-ink">
            {p.place}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close event details"
          className="-m-1 rounded-lg p-1 text-ink-soft hover:text-ink"
        >
          <svg viewBox="0 0 16 16" className="size-4" aria-hidden>
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <div>
          <dt className="text-[11px] text-ink-faint">Magnitude</dt>
          <dd className="tabular font-mono">
            {p.magnitude.toFixed(1)} {p.magnitudeType && <span className="text-ink-soft">{p.magnitudeType}</span>}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] text-ink-faint">Depth</dt>
          <dd className="tabular font-mono">{p.depthKm.toFixed(1)} km</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-[11px] text-ink-faint">Origin time</dt>
          <dd className="tabular font-mono">
            {formatUtc(event.time, true)} <span className="text-ink-soft">· {formatRelative(event.time, now)}</span>
          </dd>
        </div>
        <div>
          <dt className="text-[11px] text-ink-faint">Coordinates</dt>
          <dd className="tabular font-mono text-[13px]">
            {event.position.latitude.toFixed(3)}, {event.position.longitude.toFixed(3)}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] text-ink-faint">Review status</dt>
          <dd className="capitalize">{p.status}</dd>
        </div>
      </dl>

      {p.tsunami && (
        <p className="mt-3 rounded-lg border border-warn/30 bg-warn/10 px-2.5 py-1.5 text-xs text-warn">
          USGS tsunami flag set. This is not a warning — consult official tsunami centers.
        </p>
      )}

      <div className="mt-4 border-t border-line pt-3 text-[11px] leading-relaxed text-ink-soft">
        Source: USGS · retrieved {formatUtc(Date.parse(event.source.retrievedAt))}
        {event.source.url && (
          <>
            {' · '}
            <a
              href={event.source.url}
              target="_blank"
              rel="noreferrer"
              className="text-accent underline-offset-2 hover:underline"
            >
              Event page ↗
            </a>
          </>
        )}
      </div>
    </article>
  )
}
