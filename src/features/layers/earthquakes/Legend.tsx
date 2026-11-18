import { MAGNITUDE_STOPS, magnitudeRadius } from '#/shared/utils/magnitude'

export function MagnitudeLegend() {
  const stops = MAGNITUDE_STOPS.slice(0, 5).reverse()
  const mags = [3, 4.5, 5.5, 6.5, 7.5]
  return (
    <figure aria-label="Magnitude legend">
      <div className="flex items-end justify-between gap-1">
        {stops.map((s, i) => {
          const d = Math.max(4, magnitudeRadius(mags[i]) * 900)
          return (
            <div key={s.label} className="flex flex-1 flex-col items-center gap-1.5">
              <span
                className="rounded-full"
                style={{ width: d, height: d, background: s.color, boxShadow: `0 0 10px ${s.color}66` }}
              />
              <span className="tabular font-mono text-[10px] text-ink-soft">{s.label}</span>
            </div>
          )
        })}
      </div>
      <figcaption className="mt-2 text-[10.5px] leading-relaxed text-ink-faint">
        Dot size &amp; color encode magnitude. Pulse rings mark events from the last 6 h of the timeline —{' '}
        <em>illustrative, not seismic waves</em>.
      </figcaption>
    </figure>
  )
}
