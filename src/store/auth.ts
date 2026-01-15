import {create} from 'zustand'
import type {Profile} from '@/db/types'

interface AuthState {
  user: Profile | null
  setUser: (user: Profile | null) => void
  clearUser: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({user}),
  clearUser: () => set({user: null})
}))
