import type { Category, Goal, Priority } from '../types/models'

/** Прогресс цели 0–100: для ежедневной цели — доля отмеченных дней, иначе — выполненные подцели */
export function goalProgress(goal: Goal, periodDates?: string[]): number {
  if (goal.goalType === 'daily' && periodDates && periodDates.length > 0) {
    const history = goal.dailyHistory || {}
    const done = periodDates.filter((d) => Boolean(history[d])).length
    return Math.round((done / periodDates.length) * 100)
  }
  if (goal.completedAt) return 100
  if (goal.subgoals.length === 0) return 0
  const done = goal.subgoals.filter((s) => s.done).length
  return Math.round((done / goal.subgoals.length) * 100)
}

export const isGoalDone = (goal: Goal, periodDates?: string[]) => {
  if (goal.goalType === 'daily' && periodDates && periodDates.length > 0) {
    return goalProgress(goal, periodDates) === 100
  }
  return Boolean(goal.completedAt)
}

/** Средний прогресс набора целей */
export function averageProgress(goals: Goal[], periodDates?: string[]): number {
  if (goals.length === 0) return 0
  const sum = goals.reduce((acc, g) => acc + goalProgress(g, periodDates), 0)
  return Math.round(sum / goals.length)
}

const PRIORITY_WEIGHT: Record<Priority, number> = { high: 0, medium: 1, low: 2 }

/**
 * Сортировка целей:
 * 1. Невыполненные сверху, выполненные — в самом низу.
 * 2. Цели с высоким приоритетом («Приоритет») — на самом верху.
 * 3. Группировка по категориям (по порядку категорий), чтобы цели одной категории стояли рядом.
 * 4. Внутри одной категории — по приоритету, затем по дедлайну и дате создания.
 */
export function sortGoals(goals: Goal[], categories: Category[] = []): Goal[] {
  const categoryOrder = new Map(categories.map((c, idx) => [c.id, c.order ?? idx]))

  return [...goals].sort((a, b) => {
    const doneDiff = Number(isGoalDone(a)) - Number(isGoalDone(b))
    if (doneDiff !== 0) return doneDiff

    const aHigh = a.priority === 'high' ? 0 : 1
    const bHigh = b.priority === 'high' ? 0 : 1
    if (aHigh !== bHigh) return aHigh - bHigh

    const aCat = categoryOrder.get(a.categoryId) ?? 999
    const bCat = categoryOrder.get(b.categoryId) ?? 999
    if (aCat !== bCat) return aCat - bCat
    if (a.categoryId !== b.categoryId) return a.categoryId.localeCompare(b.categoryId)

    const prDiff = (PRIORITY_WEIGHT[a.priority] ?? 1) - (PRIORITY_WEIGHT[b.priority] ?? 1)
    if (prDiff !== 0) return prDiff

    if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline)
    if (a.deadline) return -1
    if (b.deadline) return 1
    return a.createdAt.localeCompare(b.createdAt)
  })
}
