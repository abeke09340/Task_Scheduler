import type { Goal, Priority } from '../types/models'

/** Прогресс цели 0–100: выполнена → 100, иначе доля выполненных подцелей */
export function goalProgress(goal: Goal): number {
  if (goal.completedAt) return 100
  if (goal.subgoals.length === 0) return 0
  const done = goal.subgoals.filter((s) => s.done).length
  return Math.round((done / goal.subgoals.length) * 100)
}

export const isGoalDone = (goal: Goal) => Boolean(goal.completedAt)

/** Средний прогресс набора целей */
export function averageProgress(goals: Goal[]): number {
  if (goals.length === 0) return 0
  const sum = goals.reduce((acc, g) => acc + goalProgress(g), 0)
  return Math.round(sum / goals.length)
}

const PRIORITY_WEIGHT: Record<Priority, number> = { high: 0, medium: 1, low: 2 }

/** Невыполненные сверху (по приоритету, затем по дедлайну), выполненные — в конце */
export function sortGoals(goals: Goal[]): Goal[] {
  return [...goals].sort((a, b) => {
    const doneDiff = Number(isGoalDone(a)) - Number(isGoalDone(b))
    if (doneDiff !== 0) return doneDiff
    const prDiff = PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority]
    if (prDiff !== 0) return prDiff
    if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline)
    if (a.deadline) return -1
    if (b.deadline) return 1
    return a.createdAt.localeCompare(b.createdAt)
  })
}

