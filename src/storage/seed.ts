import type { Category, ColorKey } from '../types/models'
import { nowISO } from '../lib/utils'
import { kv, repos } from './index'
import { getActiveUserId } from '../stores/auth'

const SEED_FLAG = 'seeded'
const DEMO_CLEANED_FLAG = 'demo_goals_cleaned_v1'

const DEFAULT_CATEGORIES: { id: string; name: string; color: ColorKey }[] = [
  { id: 'cat-health', name: 'Здоровье', color: 'sage' },
  { id: 'cat-finance', name: 'Финансы', color: 'rose' },
  { id: 'cat-study', name: 'Учёба', color: 'lavender' },
  { id: 'cat-career', name: 'Карьера', color: 'blue' },
  { id: 'cat-relations', name: 'Отношения', color: 'apricot' },
  { id: 'cat-hobby', name: 'Хобби', color: 'sand' },
]

const LEGACY_DEMO_TITLES = new Set([
  'Прочитать 2 главы книги',
  'Завершить дизайн лендинга',
  'Тренировка 3 раза',
  'Выучить 50 слов',
  'Отложить 20 000 ₸',
  'Тренировка 30 минут',
  'Позвонить маме',
])

/** Первый запуск: только стандартные категории, без демо-целей */
export async function ensureSeed(targetUserId?: string) {
  const userId = targetUserId || getActiveUserId()
  const existing = await repos.categories.list()
  if (existing.length === 0) {
    const now = nowISO()
    for (const [order, c] of DEFAULT_CATEGORIES.entries()) {
      const category: Category = {
        ...c,
        id: `cat-${c.id}-${userId}`,
        userId,
        isDefault: true,
        order,
        createdAt: now,
        updatedAt: now,
      }
      await repos.categories.upsert(category)
    }
    await kv.set(SEED_FLAG, true)
  }

  // Одноразовая очистка ранее зашитых демо-целей у существующих пользователей
  if (!(await kv.get<boolean>(DEMO_CLEANED_FLAG))) {
    const existingGoals = await repos.goals.list()
    for (const g of existingGoals) {
      if (LEGACY_DEMO_TITLES.has(g.title)) {
        await repos.goals.remove(g.id)
      }
    }
    await kv.set(DEMO_CLEANED_FLAG, true)
  }
}
