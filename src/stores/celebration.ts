import { create } from 'zustand'

interface CelebrationState {
  /** Увеличивается при каждом выполнении цели, перезапуская анимацию */
  burstId: number
  celebrate: () => void
  dismiss: () => void
}

export const useCelebration = create<CelebrationState>((set) => ({
  burstId: 0,
  celebrate: () => set((s) => ({ burstId: s.burstId + 1 })),
  dismiss: () => set({ burstId: 0 }),
}))

