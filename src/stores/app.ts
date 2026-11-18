import { create } from 'zustand'

export type Quality = 'high' | 'low'

interface AppState {
  layers: { earthquakes: boolean; clouds: boolean }
  minMagnitude: number
  rangeDays: 1 | 7
  selectedEventId: string | null
  hoveredEventId: string | null
  quality: Quality
  /** Incremented to request a camera reset */
  resetToken: number
  panel: 'layers' | 'events' | null
  aboutOpen: boolean
  toggleLayer(id: keyof AppState['layers']): void
  setMinMagnitude(m: number): void
  setRangeDays(d: 1 | 7): void
  select(id: string | null): void
  hover(id: string | null): void
  setQuality(q: Quality): void
  resetCamera(): void
  setPanel(p: AppState['panel']): void
  setAboutOpen(open: boolean): void
}

export const useApp = create<AppState>()((set) => ({
  layers: { earthquakes: true, clouds: true },
  minMagnitude: 2.5,
  rangeDays: 1,
  selectedEventId: null,
  hoveredEventId: null,
  quality: 'high',
  resetToken: 0,
  panel: 'layers',
  aboutOpen: false,
  toggleLayer: (id) => set((s) => ({ layers: { ...s.layers, [id]: !s.layers[id] } })),
  setMinMagnitude: (minMagnitude) => set({ minMagnitude }),
  setRangeDays: (rangeDays) => set({ rangeDays }),
  select: (selectedEventId) => set({ selectedEventId }),
  hover: (hoveredEventId) => set({ hoveredEventId }),
  setQuality: (quality) => set({ quality }),
  resetCamera: () => set((s) => ({ resetToken: s.resetToken + 1, selectedEventId: null })),
  setPanel: (panel) => set({ panel }),
  setAboutOpen: (aboutOpen) => set({ aboutOpen }),
}))
