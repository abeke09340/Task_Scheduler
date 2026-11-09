import { repos } from './index'
import { useCategories } from '../stores/categories'
import { useGoals } from '../stores/goals'
import { useProfile } from '../stores/profile'
import { useSchedule } from '../stores/schedule'
import type { Category, Goal, ScheduleItem } from '../types/models'

export async function reloadUserStores(): Promise<void> {
  await Promise.all([
    useCategories.getState().load(),
    useGoals.getState().load(),
    useSchedule.getState().load(),
    useProfile.getState().load(),
  ])
}

export interface BackupData {
  version: 1
  exportedAt: string
  goals: Goal[]
  categories: Category[]
  schedule: ScheduleItem[]
}

/** Экспорт всех данных пользователя в JSON-файл */
export async function exportUserData(username: string): Promise<void> {
  const [goals, categories, schedule] = await Promise.all([
    repos.goals.list(),
    repos.categories.list(),
    repos.schedule.list(),
  ])

  const backup: BackupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    goals,
    categories,
    schedule,
  }

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `planner-${username}-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/** Импорт данных из файла на текущий аккаунт */
export async function importUserData(userId: string, jsonText: string): Promise<{ success: boolean; error?: string }> {
  try {
    const data = JSON.parse(jsonText) as BackupData
    if (!data || !Array.isArray(data.goals) || !Array.isArray(data.categories)) {
      return { success: false, error: 'Неверный формат файла резервной копии' }
    }

    for (const g of data.goals) {
      await repos.goals.upsert({ ...g, userId })
    }
    for (const c of data.categories) {
      await repos.categories.upsert({ ...c, userId })
    }
    if (Array.isArray(data.schedule)) {
      for (const s of data.schedule) {
        await repos.schedule.upsert({ ...s, userId })
      }
    }

    await reloadUserStores()
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Ошибка при чтении файла' }
  }
}
