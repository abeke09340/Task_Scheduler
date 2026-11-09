import { create } from 'zustand'
import { kv, repos } from '../storage'
import { getActiveUserId } from './auth'
import type { ColorKey, ID, ISODate, ScheduleItem, ScheduleSettings } from '../types/models'
import { newId, nowISO } from '../lib/utils'
import { useCelebration } from './celebration'

const SETTINGS_KEY = 'schedule_settings_v1'

const DEFAULT_SETTINGS: ScheduleSettings = {
  startHour: 7,
  endHour: 22,
  slotMinutes: 60,
}

export interface CreateScheduleInput {
  date: ISODate
  startTime: string
  endTime: string
  title: string
  timeNote?: string
  color?: ColorKey
  repeatDaily?: boolean
}

interface ScheduleState {
  items: ScheduleItem[]
  settings: ScheduleSettings
  load: () => Promise<void>
  updateSettings: (patch: Partial<ScheduleSettings>) => void
  createItem: (input: CreateScheduleInput) => ScheduleItem
  updateItem: (
    id: ID,
    patch: Partial<Pick<ScheduleItem, 'title' | 'timeNote' | 'color' | 'repeatDaily' | 'startTime' | 'endTime'>>,
  ) => void
  removeItem: (id: ID) => void
  toggleItemDone: (id: ID, date: ISODate) => void
}

export const useSchedule = create<ScheduleState>((set, get) => {
  const mutate = (id: ID, fn: (item: ScheduleItem) => ScheduleItem) => {
    let changed: ScheduleItem | undefined
    const items = get().items.map((item) => {
      if (item.id !== id) return item
      changed = { ...fn(item), updatedAt: nowISO() }
      return changed
    })
    set({ items })
    if (changed) void repos.schedule.upsert(changed)
  }

  return {
    items: [],
    settings: DEFAULT_SETTINGS,

    async load() {
      const [items, savedSettings] = await Promise.all([
        repos.schedule.list(),
        kv.get<ScheduleSettings>(SETTINGS_KEY),
      ])

      set({
        items,
        settings: savedSettings ? { ...DEFAULT_SETTINGS, ...savedSettings } : DEFAULT_SETTINGS,
      })
    },

    updateSettings(patch) {
      const next: ScheduleSettings = {
        ...get().settings,
        ...patch,
      }
      next.startHour = Math.max(0, Math.min(22, next.startHour))
      next.endHour = Math.max(next.startHour + 1, Math.min(24, next.endHour))
      next.slotMinutes = Math.max(10, Math.min(240, next.slotMinutes))
      set({ settings: next })
      void kv.set(SETTINGS_KEY, next)
    },

    createItem(input) {
      const now = nowISO()
      const item: ScheduleItem = {
        id: newId(),
        userId: getActiveUserId(),
        date: input.date,
        repeatDaily: input.repeatDaily ?? false,
        startTime: input.startTime,
        endTime: input.endTime,
        title: input.title.trim(),
        timeNote: input.timeNote?.trim() || undefined,
        color: input.color ?? 'blue',
        dailyProgress: {},
        createdAt: now,
        updatedAt: now,
      }
      set({ items: [...get().items, item] })
      void repos.schedule.upsert(item)
      return item
    },

    updateItem(id, patch) {
      mutate(id, (item) => ({
        ...item,
        ...patch,
        title: patch.title !== undefined ? patch.title.trim() : item.title,
        timeNote: patch.timeNote !== undefined ? patch.timeNote.trim() || undefined : item.timeNote,
      }))
    },

    removeItem(id) {
      set({ items: get().items.filter((i) => i.id !== id) })
      void repos.schedule.remove(id)
    },

    toggleItemDone(id, date) {
      let justCompleted = false
      mutate(id, (item) => {
        const progress = { ...(item.dailyProgress ?? {}) }
        const dayProg = { ...(progress[date] ?? {}) }
        const nextCompleted = !dayProg.completed
        if (nextCompleted) justCompleted = true
        dayProg.completed = nextCompleted
        progress[date] = dayProg
        return { ...item, dailyProgress: progress }
      })
      if (justCompleted) useCelebration.getState().celebrate()
    },
  }
})

