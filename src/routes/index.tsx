import { ClientOnly, createFileRoute } from '@tanstack/react-router'
import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { AboutDialog } from '#/components/AboutDialog'
import { Toggle } from '#/components/Toggle'
import { supportsWebGL2 } from '#/features/globe/webgl'
import { EventDetails } from '#/features/layers/earthquakes/EventDetails'
import { EventList } from '#/features/layers/earthquakes/EventList'
import { MagnitudeLegend } from '#/features/layers/earthquakes/Legend'
import { useEarthquakes } from '#/features/layers/earthquakes/useEarthquakes'
import { clock } from '#/features/timeline/clock'
import { Timeline } from '#/features/timeline/Timeline'
import { useClockDriver } from '#/features/timeline/useClockDriver'
import { useCoarseTime } from '#/features/timeline/useCoarseTime'
import type { EarthquakeEvent } from '#/shared/types/geo'
import { formatUtc } from '#/shared/utils/time'
import { useApp } from '#/stores/app'

const Scene = lazy(() => import('#/features/globe/Scene'))
const EMPTY: EarthquakeEvent[] = []

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  useClockDriver()
  useKeyboardShortcuts()
  const quakes = useEarthquakes()
  const events = quakes.data?.events ?? EMPTY
  const now = useCoarseTime()
  const visible = useMemo(() => events.filter((e) => e.time <= now), [events, now])
  const selectedId = useApp((s) => s.selectedEventId)
  const select = useApp((s) => s.select)
  const selected = useMemo(() => events.find((e) => e.id === selectedId) ?? null, [events, selectedId])
  const [ready, setReady] = useState(false)
  const [webgl, setWebgl] = useState<boolean | null>(null)
  const [contextLost, setContextLost] = useState(false)
  const onReady = useCallback(() => setReady(true), [])
  const onContextLost = useCallback(() => setContextLost(true), [])

  useEffect(() => {
    setWebgl(supportsWebGL2())
    if (window.matchMedia('(max-width: 640px)').matches) useApp.getState().setPanel(null)
    if (window.matchMedia('(max-width: 640px), (pointer: coarse)').matches) useApp.getState().setQuality('low')
  }, [])

  const globeAvailable = webgl === true && !contextLost

  return (
    <main className="fixed inset-0 overflow-hidden bg-space">
      <ClientOnly>
        {globeAvailable && (
          <Suspense fallback={null}>
            <Scene events={events} onReady={onReady} onContextLost={onContextLost} />
          </Suspense>
        )}
      </ClientOnly>

      <LoadingVeil hidden={ready || webgl === false || contextLost} />

      <div className="pointer-events-none absolute inset-0 flex flex-col gap-3 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-5">
        <TopBar />

        <div className="flex min-h-0 flex-1 items-start gap-3">
          <SidePanel
            events={visible}
            allCount={events.length}
            now={now}
            webglMissing={!globeAvailable && webgl !== null}
            contextLost={contextLost}
          />
          <div className="hidden flex-1 sm:block" />
          {selected && (
            <div className="hidden sm:block">
              <EventDetails event={selected} now={now} onClose={() => select(null)} />
            </div>
          )}
        </div>

        <div className="mx-auto flex w-full max-w-3xl flex-col gap-2">
          {selected && (
            <div className="sm:hidden">
              <EventDetails event={selected} now={now} onClose={() => select(null)} />
            </div>
          )}
          <Provenance query={quakes} visibleCount={visible.length} />
          <Timeline events={events} />
        </div>
      </div>

      <AboutDialog />
    </main>
  )
}

function LoadingVeil({ hidden }: { hidden: boolean }) {
  return (
    <div
      aria-hidden={hidden}
      className={`pointer-events-none absolute inset-0 grid place-items-center transition-opacity duration-[1400ms] ${hidden ? 'opacity-0' : 'opacity-100'}`}
      style={{ background: 'radial-gradient(circle at 50% 50%, #0b1a33 0%, #020308 55%)' }}
    >
      <div className="text-center">
        <div
          className="mx-auto size-40 animate-breathe rounded-full"
          style={{
            background: 'radial-gradient(circle at 35% 35%, #2a5d8f, #0a1830 60%, transparent 72%)',
            boxShadow: '0 0 80px #1f4f8a55',
          }}
        />
        <p className="mt-6 text-xs uppercase tracking-[0.3em] text-ink-faint">Rendering the planet</p>
      </div>
    </div>
  )
}

function TopBar() {
  const quality = useApp((s) => s.quality)
  const setQuality = useApp((s) => s.setQuality)
  const reset = useApp((s) => s.resetCamera)
  const setAbout = useApp((s) => s.setAboutOpen)
  const panel = useApp((s) => s.panel)
  const setPanel = useApp((s) => s.setPanel)
  const btn =
    'glass pointer-events-auto rounded-full px-3 py-1.5 text-xs text-ink-soft transition-colors hover:text-ink hover:border-line-strong'
  return (
    <header className="flex items-start justify-between gap-3">
      <div className="pointer-events-auto animate-fade-up">
        <h1 className="font-display text-[28px] leading-none tracking-tight text-ink sm:text-[34px]">Terralume</h1>
        <p className="mt-1 text-[11px] tracking-wide text-ink-soft">A living portrait of our planet</p>
      </div>
      <nav aria-label="View controls" className="flex flex-wrap justify-end gap-1.5">
        <button
          type="button"
          className={`${btn} sm:hidden`}
          onClick={() => setPanel(panel ? null : 'layers')}
          aria-expanded={panel !== null}
        >
          Layers
        </button>
        <button type="button" className={btn} onClick={reset} aria-label="Reset view">
          Reset view
        </button>
        <button
          type="button"
          className={btn}
          onClick={() => setQuality(quality === 'high' ? 'low' : 'high')}
          aria-label={`Display quality: ${quality}. Switch to ${quality === 'high' ? 'low' : 'high'}`}
        >
          Quality: {quality === 'high' ? 'High' : 'Low'}
        </button>
        <button type="button" className={btn} onClick={() => setAbout(true)}>
          About
        </button>
      </nav>
    </header>
  )
}

function SidePanel({
  events,
  allCount,
  now,
  webglMissing,
  contextLost,
}: {
  events: EarthquakeEvent[]
  allCount: number
  now: number
  webglMissing: boolean
  contextLost: boolean
}) {
  const panel = useApp((s) => s.panel)
  const setPanel = useApp((s) => s.setPanel)
  const layers = useApp((s) => s.layers)
  const toggleLayer = useApp((s) => s.toggleLayer)
  const minMagnitude = useApp((s) => s.minMagnitude)
  const setMinMagnitude = useApp((s) => s.setMinMagnitude)
  const [sort, setSort] = useState<'time' | 'magnitude'>('time')
  // Without a globe, the list *is* the experience.
  const tab = webglMissing ? 'events' : panel
  if (!tab) return null

  const tabBtn = (id: 'layers' | 'events', label: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={tab === id}
      onClick={() => setPanel(id)}
      className={`flex-1 rounded-lg px-3 py-1 text-xs ${tab === id ? 'bg-white/10 text-ink' : 'text-ink-soft hover:text-ink'}`}
    >
      {label}
    </button>
  )

  return (
    <aside
      aria-label="Layers and events"
      className="glass animate-fade-up pointer-events-auto flex max-h-full w-full flex-col rounded-2xl sm:w-80"
    >
      {webglMissing && (
        <div className="m-3 mb-0 rounded-lg border border-warn/30 bg-warn/10 p-2.5 text-xs leading-relaxed text-warn">
          {contextLost
            ? 'The 3D view stopped (graphics context lost). Reload to restore it — data below is still live.'
            : 'Your browser does not support WebGL2, so the 3D globe is unavailable. All observations are listed below.'}
        </div>
      )}
      <div role="tablist" aria-label="Panel" className="m-2 mb-0 flex gap-1 rounded-xl bg-black/20 p-1">
        {!webglMissing && tabBtn('layers', 'Layers')}
        {tabBtn('events', `Events · ${events.length}`)}
      </div>

      <div role="tabpanel" className="min-h-0 flex-1 overflow-y-auto p-4 pt-3">
        {tab === 'layers' ? (
          <div className="space-y-5">
            <section className="space-y-3">
              <Toggle
                checked={layers.earthquakes}
                onChange={() => toggleLayer('earthquakes')}
                label="Earthquakes"
                hint="USGS · observed epicenters"
              />
              {layers.earthquakes && (
                <div className="space-y-4 pl-11">
                  <label className="block">
                    <span className="flex justify-between text-[11px] text-ink-faint">
                      <span>Minimum magnitude</span>
                      <span className="tabular font-mono text-ink-soft">M{minMagnitude.toFixed(1)}+</span>
                    </span>
                    <select
                      value={minMagnitude}
                      onChange={(e) => setMinMagnitude(Number(e.target.value))}
                      className="mt-1 w-full rounded-lg border border-line bg-transparent px-2 py-1 text-sm"
                    >
                      {[1, 2.5, 4, 5, 6].map((m) => (
                        <option key={m} value={m} className="bg-space">
                          M{m.toFixed(1)}+
                        </option>
                      ))}
                    </select>
                  </label>
                  <MagnitudeLegend />
                </div>
              )}
            </section>
            <section className="border-t border-line pt-4">
              <Toggle
                checked={layers.clouds}
                onChange={() => toggleLayer('clouds')}
                label="Clouds"
                hint={
                  <>
                    Static texture — <strong className="font-medium text-ink-soft">illustrative, not live weather</strong>
                  </>
                }
              />
            </section>
            <section className="border-t border-line pt-4 text-[11px] leading-relaxed text-ink-faint">
              Day/night shading follows the timeline's UTC time. Coming later: aviation, wildfires, weather.
            </section>
          </div>
        ) : (
          <div>
            <div className="mb-2 flex items-center justify-between text-[11px] text-ink-faint">
              <span>
                {events.length} of {allCount} up to timeline time
              </span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as 'time' | 'magnitude')}
                aria-label="Sort events"
                className="rounded-md border border-line bg-transparent px-1.5 py-0.5"
              >
                <option value="time" className="bg-space">
                  Newest
                </option>
                <option value="magnitude" className="bg-space">
                  Largest
                </option>
              </select>
            </div>
            <EventList events={events} now={now} sort={sort} />
          </div>
        )}
      </div>
    </aside>
  )
}

function Provenance({ query, visibleCount }: { query: ReturnType<typeof useEarthquakes>; visibleCount: number }) {
  const enabled = useApp((s) => s.layers.earthquakes)
  const minMagnitude = useApp((s) => s.minMagnitude)
  if (!enabled) return null
  const { data, isPending, isError, error, isFetching } = query
  let content: React.ReactNode
  let tone = 'text-ink-soft'
  if (isPending) content = 'Loading USGS observations…'
  else if (isError && !data) {
    tone = 'text-danger'
    content = `Earthquake data unavailable (${error.message}). The globe still works; retrying.`
  } else if (data) {
    content = (
      <>
        <span className="text-ink">{visibleCount}</span> earthquakes M{minMagnitude}+ · Source{' '}
        <a
          href="https://earthquake.usgs.gov/earthquakes/feed/"
          target="_blank"
          rel="noreferrer"
          className="underline-offset-2 hover:underline"
        >
          USGS
        </a>
        {' · '}retrieved {formatUtc(Date.parse(data.retrievedAt))}
        {data.stale && <span className="text-warn"> · stale (upstream unavailable)</span>}
        {isError && <span className="text-warn"> · refresh failed</span>}
        {isFetching && <span className="text-ink-faint"> · updating…</span>}
      </>
    )
  }
  return (
    <p
      role="status"
      aria-live="polite"
      className={`pointer-events-auto self-center rounded-full bg-black/40 px-3 py-1 text-center text-[11px] backdrop-blur ${tone}`}
    >
      {content}
    </p>
  )
}

function useKeyboardShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t.closest('input, select, textarea, dialog[open]') || e.metaKey || e.ctrlKey || e.altKey) return
      const app = useApp.getState()
      if (e.key === ' ' && !t.closest('button')) {
        e.preventDefault()
        clock.getState().toggle()
      } else if (e.key === 'Escape') app.select(null)
      else if (e.key.toLowerCase() === 'r') app.resetCamera()
      else if (e.key.toLowerCase() === 'l') app.setPanel(app.panel === 'events' ? 'layers' : 'events')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
