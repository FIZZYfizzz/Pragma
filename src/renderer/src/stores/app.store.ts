import { create } from 'zustand'

export type View = 'init' | 'pin' | 'profiles' | 'home' | 'board'

interface AppState {
  view: View
  activeProfileId: string | null
  activePragmaId: string | null
  activeBoardId: string | null
  setView: (view: View) => void
  setActiveProfile: (id: string | null) => void
  setActivePragma: (id: string | null) => void
  setActiveBoard: (id: string | null) => void
}

export const useAppStore = create<AppState>((set) => ({
  view: 'init',
  activeProfileId: null,
  activePragmaId: null,
  activeBoardId: null,
  setView: (view) => set({ view }),
  setActiveProfile: (id) => set({ activeProfileId: id }),
  setActivePragma: (id) => set({ activePragmaId: id }),
  setActiveBoard: (id) => set({ activeBoardId: id }),
}))
