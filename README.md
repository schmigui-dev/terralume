# Terralume

A living portrait of our planet — cinematic 3D Earth with real, attributed USGS earthquake observations and a 24h/7d timeline.

Spec: [`terralume-spec.md`](terralume-spec.md) · v0.1 design: [`docs/superpowers/specs/2026-11-18-terralume-v01-design.md`](docs/superpowers/specs/2026-11-18-terralume-v01-design.md)

## Run locally

```bash
pnpm install
pnpm textures   # one-time: downloads Earth textures into public/textures
pnpm dev        # http://localhost:3000 (runs in workerd via @cloudflare/vite-plugin)
```

`pnpm test` · `pnpm typecheck` · `pnpm lint` · `pnpm build`

Deploy is intentionally not wired up yet (`wrangler deploy` after `pnpm build` when ready).

## Layout

- `src/routes/` — page + server routes (`/api/earthquakes`, `/api/layers`, `/api/layers/:id/metadata`)
- `src/server/` — USGS provider adapter, cache, services (framework-independent)
- `src/features/globe` — R3F scene, Earth/cloud/atmosphere shaders, camera
- `src/features/layers/earthquakes` — instanced markers, details, list, legend, data hook
- `src/features/timeline` — authoritative clock store + timeline UI
- `src/shared` — types, schemas, geo/solar/time utils

## Data & attribution

Earthquakes: USGS (public domain). Earth textures: Solar System Scope (CC BY 4.0), NASA-derived. Clouds are static and labeled illustrative.
