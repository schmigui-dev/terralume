# Terralume — Product & Technical Specification

**Version:** 0.1 (planning)  
**Date:** 2026-11-17  
**Tagline:** A living portrait of our planet.  
**Status:** Proposed, not yet implemented

## 1. Product vision

Terralume is a cinematic, interactive 3D portrait of Earth powered by authentic, attributed geospatial observations. It is a public creative-technology showcase, not a conventional SaaS dashboard. Visitors can freely explore the planet, enable data layers, inspect events, rewind time where historical data exists, and experience guided stories.

### Product principles

- **Experience first, accuracy always:** beautiful animations must not imply measurements that were never observed.
- **Source transparency:** show provider, observation time, last retrieval time, coverage, and limitations.
- **Progressive disclosure:** full-screen Earth first; minimal controls; detail on demand.
- **No account required:** open access to exploration.
- **Modular layers:** each dataset can be added without rewriting the globe.
- **Graceful degradation:** mobile quality tiers, accessible alternatives, and useful error states.

### Audience and success

Target curious internet users, educators, geospatial enthusiasts, and developers. Primary success is a memorable, shareable experience, not signups. Track initial render success, time to interactive, exploration engagement, event inspection, story completion, share actions, and rendering errors without invasive tracking.

## 2. Scope and priorities

**P0 / v0.1:** cinematic 3D Earth, orbit/zoom/touch controls, day/night lighting, atmospheric glow, cloud presentation with honest timestamp labeling, earthquake layer using USGS, event selection/details, 24-hour historical timeline and playback, layer toggle, provider attribution/freshness, responsive UI, fallback for unsupported WebGL.

**P1:** location search, aviation and wildfire layers, richer historical ranges, cinematic guided stories, shareable URLs, accessible event list, enhanced mobile controls.

**P2:** weather visualization, satellite orbits, exported visual cards, advanced layer combinations, optional AI-assisted guided journeys.

### Explicit non-goals for v0.1

Authentication, payments, social accounts, user-generated datasets, unrestricted historical archives, physically accurate earthquake wave propagation, global real-time flight coverage guarantees, full weather forecasting, and a general-purpose GIS editor.

## 3. Functional requirements

| ID    | Requirement              | Priority | Acceptance criteria                                                          |
| ----- | ------------------------ | -------- | ---------------------------------------------------------------------------- |
| FR-01 | Interactive 3D Earth     | P0       | User can rotate, zoom, and reset view with mouse and touch.                  |
| FR-02 | Planet lighting          | P0       | Solar illumination follows a selected UTC timestamp.                         |
| FR-03 | Atmosphere and clouds    | P0       | Atmospheric effects render; cloud source/time is disclosed.                  |
| FR-04 | Earthquake observations  | P0       | Validated events are displayed at correct coordinates.                       |
| FR-05 | Earthquake event detail  | P0       | Selecting an event shows magnitude, depth, place, UTC time, and source link. |
| FR-06 | Event pulses             | P0       | Size/intensity convey magnitude with legend; rings labeled illustrative.     |
| FR-07 | Time controls            | P0       | Seek, play, pause, speed, and range selection work on historical data.       |
| FR-08 | Layer management         | P0       | Layers can be enabled/disabled without resetting camera or time.             |
| FR-09 | Freshness and provenance | P0       | Source, observed-at, retrieved-at, and availability are visible.             |
| FR-10 | Geographic search        | P1       | Search and focus a named location with a clear camera transition.            |
| FR-11 | Aviation                 | P1       | Aircraft observations show positions/headings and distinguish interpolation. |
| FR-12 | Wildfires                | P1       | Thermal detections show time and limitations; no unsupported fire claims.    |
| FR-13 | Guided stories           | P1       | Configured chapters control camera/time/layers and allow skip/exit.          |
| FR-14 | Deep links               | P1       | URLs restore camera, time, selected event, and enabled layers.               |
| FR-15 | Weather                  | P2       | Show timestamped observed or forecast fields with legend.                    |
| FR-16 | Satellites               | P2       | Render calculated or observed positions with model/source disclosure.        |
| FR-17 | Export/share card        | P2       | User can generate a credited image of a view.                                |

## 4. UX and interaction requirements

### First five seconds

A dark, cinematic full-viewport scene reveals Earth, illuminated with night-side city lights, subtle atmosphere, and restrained motion. A minimal overlay offers **Explore**, **Layers**, and **Time**. Loading is progressive: show a lightweight preview/loading state before heavy assets are ready. Never block basic navigation on a data-provider outage.

### Desktop layout

- Upper-left: wordmark, minimal navigation.
- Left: collapsible layer selector and legends.
- Right: contextual event details, source and freshness.
- Bottom: live/history/story mode and timeline controls.
- Upper-right: search, display quality, help.

### Mobile layout

Touch rotation and pinch zoom; bottom sheets for event details; compact layer selector; timeline optimized for small screens; reduced quality defaults when needed.

### Playback modes

- **Live:** latest available observations, each with independent freshness; not a promise of instantaneous streaming.
- **History:** selected time range and authoritative simulation clock; unavailable periods clearly indicated.
- **Stories:** declarative chapter sequences that control camera, time, highlighted data, and narrative overlays.

The global clock is authoritative. Layers report coverage and interpolation support. Pausing playback pauses visualization time, not necessarily network ingestion. Changing time must not trigger a network request every frame.

### Accessibility

Keyboard-operable controls, meaningful labels and focus states, event list as an alternative to 3D picking, sufficient contrast, reduced-motion support, screen-reader accessible details, and non-WebGL fallback.

## 5. Data layers

### Earthquakes — first production layer

Use USGS earthquake feeds and/or query APIs as allowed. Normalize provider ID, UTC timestamp, lat/lon, depth (km), magnitude, magnitude type, location description, status, source URL, retrieval time, and optional tsunami flag. Filter by range and magnitude. Visualize epicenters using instanced markers where appropriate. Magnitude encoding must be documented; rings are illustrative, **not physical seismic-wave simulations**. Deduplicate and handle updated events.

### Aviation — P1

Use an appropriately licensed aircraft-position feed; verify rate limits and coverage. Render last observed positions and optional short trails; interpolate only between valid samples and mark estimates as such. Do not imply complete worldwide coverage.

### Wildfires — P1

Use available NASA FIRMS or other licensed hotspot datasets. Represent satellite thermal anomalies, not guaranteed active fire perimeters. Show detection time, confidence/quality where supplied, and known limitations.

### Weather — P2

Use NOAA or other suitable observation/forecast sources. Keep observations, nowcasts, and forecasts separate. Provide units, valid timestamps, legends, and source metadata. Cloud textures must not be mislabeled live if static.

### Satellites — P2

Use orbital element datasets with proper attribution and propagation libraries. Distinguish computed trajectories from directly measured positions and communicate uncertainty/age of orbital data.

### Provider capability metadata

Each layer exposes geographic coverage, available temporal ranges, refresh interval, historical/live support, interpolation policy, attribution, data licensing notes, and availability/error state.

## 6. Framework decision: TanStack Start vs Hono

### Option A — recommended: TanStack Start on Cloudflare Workers

React 19 + TanStack Start (TanStack Router, Vite) deployed to Cloudflare Workers. Use Start server functions/routes for public data APIs, normalization, and caching. Server-render informational pages; mount the WebGL scene client-side. A separate Hono app is **not required**. Benefits: one codebase, fewer deployments, SSR where useful, and straightforward server functionality.

### Option B — React SPA + Hono API

React 19 SPA (Vite + React Router or TanStack Router) with a separate Hono Worker API. Benefits: independently deployable/reusable API, clearer separation for future consumers. Costs: more deployment and integration overhead. Prefer only if a standalone API or multi-client architecture becomes a real requirement.

**Decision:** Start with Option A. Keep provider adapters and domain services independent of TanStack Start so they can move to Hono later without major rewrites. Validate current Cloudflare/TanStack Start compatibility with a deployable spike before building the globe.

## 7. Rendering and animation choices

### Two 3D/geospatial library options

1. **Recommended: Three.js + React Three Fiber v9 + Drei.** Best for custom cinematic Earth, atmosphere shaders, camera control, instancing, and composable React scenes. Use raw Three.js for GPU-heavy operations and custom materials.
2. **Alternative: deck.gl + MapLibre GL JS.** Best for dense geospatial layers and map-first analysis. Less natural as the primary renderer for a highly customized space-based globe; consider later for specialized 2D/map views.

### Two animation library options

1. **Recommended: GSAP.** Use for authored camera journeys, storytelling transitions, and complex sequenced motion.
2. **Alternative: Motion.** Excellent for declarative UI transitions and interactive effects, with Three.js-related integrations; evaluate if motion design becomes predominantly UI-focused.

**Rule:** The authoritative playback clock belongs to the time engine, not GSAP or Motion. Continuous movement, uniforms, and object transforms should update in the Three.js render loop without high-frequency React re-renders.

## 8. UI system

- **React 19** and **TypeScript**.
- **Tailwind CSS v4** for styling and tokens.
- **shadcn/ui configured with Base UI** for accessible UI components and primitives.
- **UI SDK (https://ui-sdk.dev/docs)** as an experimental option for custom interaction behaviors. Evaluate it on one complex control, such as the timeline, against Base UI; do not introduce two overlapping primitive systems by default. Verify current API, React 19 support, accessibility, and maturity before adoption.
- Minimal dark theme, subtle motion, no intrusive dashboard chrome.

## 9. Proposed stack

| Concern               | Choice                                                                 |
| --------------------- | ---------------------------------------------------------------------- |
| Frontend              | React 19, TypeScript, TanStack Start, Vite                             |
| 3D                    | Three.js, React Three Fiber v9, Drei                                   |
| Animation             | GSAP; Motion as alternative                                            |
| UI                    | shadcn/ui, Base UI, Tailwind CSS v4                                    |
| Experimental controls | UI SDK evaluation                                                      |
| Server                | TanStack Start routes/functions on Cloudflare Workers                  |
| Server validation     | Effect Schema                                                          |
| Client validation     | Zod where useful                                                       |
| Server-state cache    | TanStack Query                                                         |
| App state             | Zustand                                                                |
| Historical objects    | Cloudflare R2, when necessary                                          |
| Database              | None initially; Neon Postgres if indexed persistence becomes necessary |
| Scheduled ingestion   | Cloudflare Cron Triggers, later                                        |
| Background processing | Cloudflare Queues, later                                               |
| Tests                 | Vitest, Playwright                                                     |
| Tooling               | Biome, GitHub Actions                                                  |

## 10. Architecture and contracts

```text
Browser (React 19 / TanStack Start)
  ├── UI shell (shadcn + Base UI)
  ├── Scene (R3F / Three.js)
  ├── Layers (independent render modules)
  ├── Timeline (authoritative clock)
  ├── Camera / Stories (GSAP orchestration)
  └── Query + application state
           │ HTTP
Cloudflare Worker (TanStack Start)
  ├── Server routes/functions
  ├── Domain services
  ├── Provider adapters + schema validation
  └── Cache
           ├── USGS and future data APIs
           └── R2 snapshots (optional)
```

### Provider interface (illustrative)

```ts
interface DataProvider<T> {
  id: string
  fetchRange(range: TimeRange, bounds?: GeoBounds): Promise<T[]>
  getCapabilities(): ProviderCapabilities
}

interface ProviderCapabilities {
  supportsHistoricalData: boolean
  supportsLiveData: boolean
  supportsGeographicFiltering: boolean
  refreshIntervalSeconds: number | null
}
```

Expand to support pagination, coverage, provenance, licensing, and provider error states.

### Normalized events (illustrative)

```ts
interface GeoEvent<TType extends string, TProps> {
  id: string
  type: TType
  timestamp: string // ISO UTC
  position: {
    latitude: number
    longitude: number
    altitudeMeters?: number
  }
  source: {
    provider: string
    url?: string
    retrievedAt: string
  }
  properties: TProps
}

type EarthquakeEvent = GeoEvent<
  'earthquake',
  {
    magnitude: number
    magnitudeType?: string
    depthKm: number
    place: string
  }
>
```

Use discriminated unions for domain-specific datasets rather than over-generalizing all events.

### Layer boundaries

Separate layer metadata, data loading, rendering component, settings, selection behavior, and time capabilities. Build only the interfaces needed for earthquakes first, then refine when adding aviation/wildfires. Each layer must load and fail independently.

### Time engine

```ts
type PlaybackMode = 'live' | 'history' | 'story'
interface PlaybackState {
  mode: PlaybackMode
  currentTime: number // Unix milliseconds
  speed: number
  isPlaying: boolean
  rangeStart: number
  rangeEnd: number
}
```

Use a deterministic clock advanced by elapsed wall time; decouple playback ticks from API fetching and React rendering.

### State ownership

- **TanStack Query:** remote datasets, metadata, freshness, query caching.
- **Zustand:** selected layers/events, playback controls, UI preferences, camera intent.
- **Three.js internals:** frame-level transforms, shader uniforms, instanced buffers.

## 11. Server endpoints

| Endpoint                                                | Purpose                                      |
| ------------------------------------------------------- | -------------------------------------------- |
| `GET /api/layers`                                       | Supported layers and capabilities            |
| `GET /api/earthquakes?from=...&to=...&minMagnitude=...` | Validated normalized earthquake observations |
| `GET /api/layers/:id/metadata`                          | Coverage, attribution, freshness             |
| `GET /api/stories`                                      | Curated story catalog (P1)                   |
| `GET /api/stories/:id`                                  | Declarative story configuration (P1)         |

Validate ranges, coordinates, pagination, and response limits; return explicit error types and caching headers. Prevent arbitrary upstream URL fetching and keep API credentials server-side.

## 12. Rendering and performance requirements

- Realistic Earth sphere with albedo, city lights, and suitable material maps.
- Solar direction derived from UTC; atmospheric scattering shader or performant approximation.
- Cloud sphere or shader with documented source and temporal accuracy.
- Orbit controls, camera constraints, smooth focus and reset transitions.
- Instancing/BufferGeometry for dense event sets; minimize draw calls.
- Raycasting or suitable picking strategy for event selection.
- Adaptive pixel ratio, texture resolution, and effect quality; lazy-load optional layers.
- Dispose textures, geometries, and materials on unmount or replacement.
- Support WebGL2-capable browsers; show useful fallback otherwise.

**Initial targets (validate with benchmarks):** ~60 FPS on capable desktop hardware, ~30 FPS on supported mid-range mobile, quick meaningful loading state, no memory leaks under repeated layer changes. Profile frame time, GPU memory, draw calls, network payload, and time-to-interactive on real devices.

## 13. Ingestion, caching, and storage

**v0.1:** request-time USGS retrieval through the Worker; validate/normalize; cache responses with a documented TTL and freshness metadata. Serve static textures through assets/CDN. No database needed.

**Later:** Cron ingestion for expensive/rate-limited datasets; R2 for immutable historical snapshots and processed raster/vector artifacts; Queues for asynchronous preprocessing. Add Neon only if indexed event queries, editorial story management, or persistent relationships justify it. Durable Objects are not needed initially.

## 14. Security, reliability, observability

- Validate all incoming parameters and upstream payloads.
- Apply request limits, timeouts, retry/backoff, caching, and rate controls.
- Never expose provider secrets in client bundles.
- Enforce CSP and appropriate security headers; limit allowed upstream hosts.
- Handle partial provider outages without losing globe functionality.
- Surface stale/unavailable states rather than fabricating live observations.
- Respect data licenses, attribution, and usage quotas.
- Capture server errors, provider latency/failures, client WebGL failures, and basic rendering performance metrics; avoid collecting unnecessary personal information.

## 15. Testing

- **Unit:** geographic coordinate conversion, time arithmetic, interpolation, filtering, event normalization, magnitude styling.
- **Integration:** USGS adapter, schema validation, caching, route behavior, error handling.
- **E2E:** load app, interact with globe, toggle earthquake layer, inspect event, scrub timeline, restore shared state.
- **Visual regression:** deterministic scene snapshots and responsive UI panels.
- **Performance:** dense event sets, repeated toggles, prolonged playback, low-end device mode.

Use fixture datasets and a fixed clock in CI; do not depend on live upstream availability for routine tests.

## 16. Repository structure

```text
terralume/
├── src/
│   ├── routes/              # TanStack Start pages and server routes
│   ├── features/
│   │   ├── globe/           # scene, shaders, controls, textures
│   │   ├── layers/
│   │   │   ├── earthquakes/
│   │   │   ├── aviation/
│   │   │   ├── wildfires/
│   │   │   ├── weather/
│   │   │   └── satellites/
│   │   ├── timeline/
│   │   ├── camera/
│   │   └── stories/
│   ├── components/ui/
│   ├── server/
│   │   ├── providers/
│   │   ├── services/
│   │   └── cache/
│   ├── shared/
│   │   ├── schemas/
│   │   ├── types/
│   │   └── utils/
│   └── styles/
├── public/textures/
├── tests/
├── docs/
├── wrangler.jsonc
├── vite.config.ts
└── package.json
```

Prefer a single app over a monorepo until additional independent packages/apps are justified.

## 17. Delivery plan

### M1 — Cinematic globe (estimated 1–2 weekends)

Set up React 19, TanStack Start, Cloudflare deployment, Three.js/R3F, camera controls, Earth textures, atmosphere, lighting, responsive shell, and loading/fallback states.

### M2 — Earthquakes (1–2 weekends)

USGS adapter, validation, normalized events, instanced markers, pulses, event details, attribution, freshness, errors.

### M3 — Time travel (1–2 weekends)

Historical querying, clock, scrub/play/pause/speed, filtering, deterministic rendering, caching.

### M4 — Cinematic stories (1–2 weekends)

Declarative chapters, GSAP camera transitions, narrative overlays, skip/exit, shareable links.

### M5 — Second layer (2–4 weekends)

Aviation or wildfire dataset with documented licensing and coverage; test layer extensibility and multi-layer performance.

Estimates are rough part-time development ranges, not delivery commitments.

## 18. Definition of done: v0.1

A visitor can load a polished globe, rotate/zoom, enable real earthquake observations, inspect a source-linked event, replay a supported historical time range, and use the experience on desktop or mobile. The application communicates data freshness and limitations, degrades gracefully on failure, and offers an accessible event-list alternative. The initial public deployment has automated smoke tests and basic monitoring.

## 19. Open decisions / validation spikes

1. Confirm current TanStack Start + Cloudflare Workers deploy flow, SSR, assets, and server routes.
2. Benchmark realistic Earth shaders and textures with R3F on desktop/mobile.
3. Evaluate UI SDK versus Base UI on one complex timeline or selection control; avoid redundant primitive stacks.
4. Verify provider licenses, quotas, coverage, and available historical windows before promising features.
5. Determine a sensible visual quality budget and accessible fallback.
6. Verify **Terralume** name/domain/trademark availability before public branding.

## 20. Reference documentation

- TanStack Start on Cloudflare Workers: https://developers.cloudflare.com/workers/framework-guides/web-apps/tanstack-start/
- TanStack Start hosting: https://tanstack.com/start/latest/docs/framework/react/guide/hosting
- React Three Fiber: https://r3f.docs.pmnd.rs/
- Three.js: https://threejs.org/docs/
- GSAP: https://gsap.com/docs/v3/
- Motion: https://motion.dev/
- shadcn/ui: https://ui.shadcn.com/
- Base UI: https://base-ui.com/
- UI SDK: https://ui-sdk.dev/docs
- USGS feeds: https://earthquake.usgs.gov/earthquakes/feed/
- NASA EONET: https://eonet.gsfc.nasa.gov/
- NASA FIRMS: https://firms.modaps.eosdis.nasa.gov/
- OpenSky Network: https://opensky-network.org/

---

**Core decision:** ship a beautiful, credible single-app experience with TanStack Start and R3F first. Add infrastructure and data layers only when their value is demonstrated.
