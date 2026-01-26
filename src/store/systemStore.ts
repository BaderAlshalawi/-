import { create } from 'zustand'

interface SystemState {
  isFrozen: boolean
  freezeReason: string | null
  setIsFrozen: (frozen: boolean, reason?: string | null) => void
}

export const useSystemStore = create<SystemState>((set) => ({
  isFrozen: false,
  freezeReason: null,
  setIsFrozen: (frozen, reason = null) => set({ isFrozen: frozen, freezeReason: reason }),
}))
