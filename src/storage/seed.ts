import { addDays, startOfWeek } from 'date-fns'
import type { Category, ColorKey, Goal, Period, Priority } from '../types/models'
import { periodStartKey, toISODate } from '../lib/dates'
import { newId, nowISO } from '../lib/utils'
import { kv, LOCAL_USER_ID, repos } from './index'

const SEED_FLAG = 'seeded'

const DEFAULT_CATEGORIES: { id: string; name: string; color: ColorKey }[] = [
  { id: 'cat-health', name: 'Здоровье', color: 'sage' },
  { id: 'cat-finance', name: 'Финансы', color: 'rose' },
  { id: 'cat-study', name: 'Учёба', color: 'lavender' },
  { id: 'cat-career', name: 'Карьера', color: 'blue' },
  { id: 'cat-relations', name: 'Отношения', color: 'apricot' },
  { id: 'cat-hobby', name: 'Хобби', color: 'sand' },
]

/** Шаги: [название, выполнено] */
type SeedGoal = {
  title: string
  categoryId: string
  period: Period
  priority?: Priority
  description?: string
  deadlineInDays?: number
  completed?: boolean
  steps?: [string, boolean][]
}

const DEMO_GOALS: SeedGoal[] = [
  {
    title: 'Прочитать 2 главы книги',
    categoryId: 'cat-hobby',
    period: 'week',
    completed: true,
    steps: [
      ['Глава 5', true],
      ['Глава 6', true],
    ],
  },
  {
    title: 'Завершить дизайн лендинга',
    categoryId: 'cat-career',
    period: 'week',
    priority: 'high',
    description: 'Главная страница и адаптив под мобильные',
    deadlineInDays: 4,
    steps: [
      ['Структура страницы', true],
      ['Первый экран', true],
      ['Блок с тарифами', true],
      ['Отзывы', true],
      ['Мобильная версия', false],
    ],
  },
  {
    title: 'Тренировка 3 раза',
    categoryId: 'cat-health',
    period: 'week',
    steps: [
      ['Понедельник', true],
      ['Среда', true],
      ['Пятница', false],
    ],
  },
  {
    title: 'Выучить 50 слов',
    categoryId: 'cat-study',
    period: 'week',
    steps: [
      ['Слова 1–10', true],
      ['Слова 11–20', true],
      ['Слова 21–30', false],
      ['Слова 31–40', false],
      ['Слова 41–50', false],
    ],
  },
  {
    title: 'Отложить 20 000 ₸',
    categoryId: 'cat-finance',
    period: 'month',
    priority: 'low',
    steps: [
      ['5 000 ₸', true],
      ['10 000 ₸', false],
      ['15 000 ₸', false],
      ['20 000 ₸', false],
    ],
  },
  {
    title: 'Тренировка 30 минут',
    categoryId: 'cat-health',
    period: 'day',
  },
  {
    title: 'Позвонить маме',
    categoryId: 'cat-relations',
    period: 'day',
  },
]

/** Первый запуск: стандартные категории + демо-цели из макетов */
export async function ensureSeed() {
  if (await kv.get<boolean>(SEED_FLAG)) return

  const now = nowISO()
  const today = new Date()
  const weekEnd = addDays(startOfWeek(today, { weekStartsOn: 1 }), 6)

  for (const [order, c] of DEFAULT_CATEGORIES.entries()) {
    const category: Category = {
      ...c,
      userId: LOCAL_USER_ID,
      isDefault: true,
      order,
      createdAt: now,
      updatedAt: now,
    }
    await repos.categories.upsert(category)
  }

  for (const g of DEMO_GOALS) {
    const goal: Goal = {
      id: newId(),
      userId: LOCAL_USER_ID,
      title: g.title,
      description: g.description,
      categoryId: g.categoryId,
      period: g.period,
      periodStart: periodStartKey(g.period, today),
      priority: g.priority ?? 'medium',
      deadline:
        g.deadlineInDays !== undefined
          ? toISODate(new Date(Math.min(addDays(today, g.deadlineInDays).getTime(), weekEnd.getTime())))
          : undefined,
      subgoals: (g.steps ?? []).map(([title, done]) => ({ id: newId(), title, done })),
      completedAt: g.completed ? now : undefined,
      createdAt: now,
      updatedAt: now,
    }
    await repos.goals.upsert(goal)
  }

  await kv.set(SEED_FLAG, true)
}

