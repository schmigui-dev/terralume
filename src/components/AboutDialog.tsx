import { useEffect, useRef } from 'react'
import { useApp } from '#/stores/app'

export function AboutDialog() {
  const open = useApp((s) => s.aboutOpen)
  const setOpen = useApp((s) => s.setAboutOpen)
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: backdrop click is a mouse affordance; Esc closes natively
    <dialog
      ref={ref}
      onClose={() => setOpen(false)}
      onClick={(e) => e.target === ref.current && setOpen(false)}
      aria-labelledby="about-title"
      className="glass m-auto max-w-lg rounded-2xl bg-glass-strong p-0 text-ink backdrop:bg-black/50"
    >
      <div className="max-h-[80vh] overflow-y-auto p-6 text-sm leading-relaxed text-ink-soft">
        <h2 id="about-title" className="font-display text-3xl text-ink">
          About Terralume
        </h2>
        <p className="mt-2">
          A living portrait of our planet, built on attributed observations. Beautiful where it can be, honest where it must be.
        </p>

        <h3 className="mt-5 text-xs uppercase tracking-[0.14em] text-ink-faint">Data &amp; imagery</h3>
        <ul className="mt-2 space-y-2">
          <li>
            <strong className="text-ink">Earthquakes</strong> — USGS Earthquake Hazards Program (public domain). Fetched on
            request, cached ~2 min. Automatic solutions may change after review.
          </li>
          <li>
            <strong className="text-ink">Day/night</strong> — terminator computed from the timeline's UTC time (approximate solar
            position, ±0.1°).
          </li>
          <li>
            <strong className="text-ink">Earth &amp; clouds</strong> — static textures by Solar System Scope (CC BY 4.0), derived
            from NASA imagery. <em>Clouds are illustrative, not live weather.</em>
          </li>
          <li>
            <strong className="text-ink">Stars</strong> — decorative, not a sky catalog.
          </li>
        </ul>

        <h3 className="mt-5 text-xs uppercase tracking-[0.14em] text-ink-faint">Controls</h3>
        <ul className="mt-2 space-y-1">
          <li>Drag to rotate · scroll / pinch to zoom · click a marker to inspect.</li>
          <li>
            <kbd className="font-mono text-ink">Space</kbd> play/pause · <kbd className="font-mono text-ink">L</kbd> list ·{' '}
            <kbd className="font-mono text-ink">R</kbd> reset view · <kbd className="font-mono text-ink">Esc</kbd> close.
          </li>
        </ul>

        <form method="dialog" className="mt-6 text-right">
          <button type="submit" className="rounded-lg bg-ink px-4 py-1.5 text-sm text-space">
            Close
          </button>
        </form>
      </div>
    </dialog>
  )
}
