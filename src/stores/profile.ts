import { create } from 'zustand'
import { kv } from '../storage'
import type { Profile } from '../types/models'

interface ProfileState {
  name: string | null
  load: () => Promise<void>
  setName: (name: string) => void
}

export const useProfile = create<ProfileState>((set) => ({
  name: null,

  async load() {
    const profile = await kv.get<Profile>('profile')
    set({ name: profile?.name ?? null })
  },

  setName(name) {
    const clean = name.trim()
    if (!clean) return
    set({ name: clean })
    void kv.set<Profile>('profile', { name: clean })
  },
}))

