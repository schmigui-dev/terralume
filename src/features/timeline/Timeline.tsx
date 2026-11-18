import { useHydrated } from '@tanstack/react-router'
import { useEffect, useMemo, useRef } from 'react'
import type { EarthquakeEvent } from '#/shared/types/geo'
import { magnitudeColor } from '#/shared/utils/magnitude'
import { DAY, formatUtc, HOUR } from '#/shared/utils/time'
import { useApp } from '#/stores/app'
import { clock, SPEEDS, useClock } from './clock'

const BINS = 96

function speedLabel(s: number) {
  return s >= 3600 ? `${s / 3600} h/s` : `${s / 60} min/s`
}

export function Timeline({ events }: { events: EarthquakeEvent[] }) {
  const input = useRef<HTMLInputElement>(null)
  const label = useRef<HTMLSpanElement>(null)
  const progress = useRef<HTMLDivElement>(null)
  const mode = useClock((s) => s.mode)
  const isPlaying = useClock((s) => s.isPlaying)
  const speed = useClock((s) => s.speed)
  const rangeStart = useClock((s) => Math.floor(s.rangeStart / 60_000) * 60_000)
  const rangeEnd = useClock((s) => Math.floor(s.rangeEnd / 60_000) * 60_000)
  const rangeDays = useApp((s) => s.rangeDays)
  const setRangeDays = useApp((s) => s.setRangeDays)
  // Clock values differ between server render and client; draw time-derived marks after hydration.
  const hydrated = useHydrated()

  // Imperative 60 Hz updates; no React re-render per frame.
  useEffect(() => {
    let raf = 0
    const loop = () => {
      const s = clock.getState()
      const frac = (s.currentTime - s.rangeStart) / Math.max(s.rangeEnd - s.rangeStart, 1)
      if (input.current && document.activeElement !== input.current) input.current.value = String(Math.round(frac * 1000))
      if (input.current) input.current.setAttribute('aria-valuetext', formatUtc(s.currentTime))
      if (label.current) label.current.textContent = formatUtc(s.currentTime, true)
      if (progress.current) progress.current.style.transform = `scaleX(${frac})`
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  const histogram = useMemo(() => {
    const bins = Array.from({ length: BINS }, () => ({ count: 0, maxMag: -Infinity }))
    const span = rangeEnd - rangeStart
    for (const e of events) {
      const i = Math.floor(((e.time - rangeStart) / span) * BINS)
      if (i < 0 || i >= BINS) continue
      bins[i].count++
      bins[i].maxMag = Math.max(bins[i].maxMag, e.properties.magnitude)
    }
    const max = Math.max(1, ...bins.map((b) => b.count))
    return bins.map((b) => ({ ...b, h: b.count ? 0.15 + 0.85 * Math.sqrt(b.count / max) : 0 }))
  }, [events, rangeStart, rangeEnd])

  const ticks = useMemo(() => {
    const step = rangeDays === 1 ? 6 * HOUR : DAY
    const out: number[] = []
    if (!hydrated) return out
    for (let t = Math.ceil(rangeStart / step) * step; t < rangeEnd; t += step) out.push(t)
    return out
  }, [rangeStart, rangeEnd, rangeDays, hydrated])

  const onScrub = (v: number) => {
    const s = clock.getState()
    s.pause()
    s.seek(s.rangeStart + (v / 1000) * (s.rangeEnd - s.rangeStart))
  }

  return (
    <section aria-label="Timeline" className="glass pointer-events-auto rounded-2xl px-3 pt-2.5 pb-2 sm:px-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <button
          type="button"
          onClick={() => clock.getState().toggle()}
          className="grid size-9 shrink-0 place-items-center rounded-full bg-ink text-space transition-transform hover:scale-105 active:scale-95"
          aria-label={isPlaying ? 'Pause playback' : 'Play history'}
        >
          {isPlaying ? (
            <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden>
              <rect x="3" y="2" width="3.5" height="12" rx="1" fill="currentColor" />
              <rect x="9.5" y="2" width="3.5" height="12" rx="1" fill="currentColor" />
            </svg>
          ) : (
            <svg viewBox="0 0 16 16" className="ml-0.5 size-3.5" aria-hidden>
              <path d="M4 2.5v11a.6.6 0 0 0 .9.5l9-5.5a.6.6 0 0 0 0-1l-9-5.5a.6.6 0 0 0-.9.5Z" fill="currentColor" />
            </svg>
          )}
        </button>

        <div className="flex min-w-0 flex-col leading-tight">
          <span ref={label} className="tabular font-mono text-[13px] text-ink" />
          <span className="text-[11px] text-ink-soft">
            {mode === 'live' ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="size-1.5 animate-breathe rounded-full bg-[#4ade80]" />
                Live · latest available
              </span>
            ) : (
              `History · ${speedLabel(speed)}`
            )}
          </span>
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <label className="sr-only" htmlFor="speed">
            Playback speed
          </label>
          <select
            id="speed"
            value={speed}
            onChange={(e) => clock.getState().setSpeed(Number(e.target.value))}
            className="rounded-lg border border-line bg-transparent px-2 py-1 text-xs text-ink-soft hover:border-line-strong"
          >
            {SPEEDS.map((s) => (
              <option key={s} value={s} className="bg-space">
                {speedLabel(s)}
              </option>
            ))}
          </select>
          <fieldset aria-label="Time range" className="m-0 flex rounded-lg border border-line p-0.5 text-xs">
            {([1, 7] as const).map((d) => (
              <button
                key={d}
                type="button"
                aria-pressed={rangeDays === d}
                onClick={() => {
                  setRangeDays(d)
                  clock.getState().setRange(d * DAY, Date.now())
                }}
                className={`rounded-md px-2 py-0.5 ${rangeDays === d ? 'bg-white/12 text-ink' : 'text-ink-soft hover:text-ink'}`}
              >
                {d === 1 ? '24h' : '7d'}
              </button>
            ))}
          </fieldset>
          <button
            type="button"
            onClick={() => clock.getState().goLive(Date.now())}
            disabled={mode === 'live'}
            className="rounded-lg border border-line px-2.5 py-1 text-xs text-ink-soft enabled:hover:border-line-strong enabled:hover:text-ink disabled:opacity-40"
          >
            Live
          </button>
        </div>
      </div>

      <div className="relative mt-2">
        <div className="pointer-events-none absolute inset-x-[8px] bottom-[13px] flex h-7 items-end gap-px" aria-hidden>
          {histogram.map((b, i) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed-size bins
              key={i}
              className="flex-1 rounded-t-[1px] opacity-70"
              style={{ height: `${b.h * 100}%`, background: b.count ? magnitudeColor(b.maxMag) : 'transparent' }}
            />
          ))}
        </div>
        <div className="pointer-events-none absolute inset-x-[8px] bottom-[13px] h-[2px] overflow-hidden" aria-hidden>
          <div ref={progress} className="h-full origin-left bg-accent" />
        </div>
        <input
          ref={input}
          type="range"
          min={0}
          max={1000}
          step={1}
          defaultValue={1000}
          aria-label="Visualization time"
          className="timeline-range relative"
          onChange={(e) => onScrub(Number(e.target.value))}
        />
        <div className="relative mx-[8px] h-4 text-[10px] text-ink-faint" aria-hidden>
          {ticks.map((t) => (
            <span
              key={t}
              className="tabular absolute -translate-x-1/2 font-mono"
              style={{ left: `${((t - rangeStart) / (rangeEnd - rangeStart)) * 100}%` }}
            >
              {rangeDays === 1 ? new Date(t).toISOString().slice(11, 16) : new Date(t).toISOString().slice(5, 10)}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
