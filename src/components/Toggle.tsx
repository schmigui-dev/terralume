export function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean
  onChange: () => void
  label: string
  hint?: React.ReactNode
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        role="switch"
        aria-checked={checked}
        checked={checked}
        onChange={onChange}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className={`relative mt-0.5 h-[18px] w-8 shrink-0 rounded-full transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-accent ${checked ? 'bg-accent' : 'bg-white/15'}`}
      >
        <span
          className={`absolute top-[2px] left-[2px] size-[14px] rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-[14px]' : ''}`}
        />
      </span>
      <span className="min-w-0">
        <span className="block text-sm text-ink">{label}</span>
        {hint && <span className="block text-[11px] leading-snug text-ink-faint">{hint}</span>}
      </span>
    </label>
  )
}
