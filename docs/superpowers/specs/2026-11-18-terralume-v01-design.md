# Terralume v0.1 (local) — design

Source spec: `terralume-spec.md`. This doc records the scope and calls for the first build.

## Intent

Cinematic, honest 3D Earth with real USGS earthquakes and a 24h timeline. Showcase, not dashboard.

## Scope (this build)

- M1 globe: R3F Earth, Solar System Scope 4K textures (CC BY 4.0, NASA-derived), sun direction from UTC clock,
  atmosphere rim shader, static cloud layer labeled "illustrative, not live", orbit/zoom/touch/reset, WebGL2 fallback.
- M2 earthquakes: `/api/earthquakes` server route → USGS FDSN query (fallback: day feed), validated + normalized,
  in-memory + `Cache-Control` caching, instanced markers sized by magnitude, illustrative pulse rings, detail panel
  with source link, provenance (observed/retrieved), accessible event list.
- M3 timeline: authoritative clock (Zustand + rAF, not React re-render per frame), play/pause/speed/seek,
  range 24h / 7d, events appear when `currentTime >= event.time`.

## Non-goals now

Cloudflare deploy (run locally via `@cloudflare/vite-plugin`/workerd so deploy stays a later one-liner),
stories, search, deep links, aviation/wildfire layers.

## Approaches

- Picked: spec Option A — single TanStack Start app, Cloudflare vite plugin for local workerd runtime.
- Rejected: SPA + Hono (more moving parts, spec says only if multi-client needed); plain Vite SPA (loses server route
  for validation/caching, diverges from target runtime).

## Calls (builder's)

- Validation: Zod everywhere for v0.1 (one schema lib shared client/server; Effect v4 API not yet vetted). Revisit when adding Effect services.
- Textures: NASA Visible Earth host unreachable at build time → `pnpm textures` pulls Solar System Scope set from three.js r170 examples; attributed in About.
- GSAP deferred to M4 (stories); M1–M3 camera flights are a small slerp in the render loop.
- Uniforms are written through live material refs each frame (R3F keeps its own uniform wrappers).
- UI kept hand-rolled with Tailwind + accessible native elements for v0.1; shadcn/Base UI added when real primitives (dialogs, sliders) need them.
- Fixed-clock fixture tests for normalization, coordinates, solar position, clock.
