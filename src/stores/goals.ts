import { create } from 'zustand'
import { repos } from '../storage'
import { getActiveUserId } from './auth'
import type { Goal, GoalType, ID, ISODate, Period, Priority, SubGoal } from '../types/models'
import { isGoalDone } from '../lib/progress'
import { newId, nowISO } from '../lib/utils'
import { useCelebration } from './celebration'

export interface GoalInput {
  title: string
  description?: string
  categoryId: ID
  period: Period
  periodStart: ISODate
  priority: Priority
  deadline?: ISODate
  subgoals: SubGoal[]
  goalType?: GoalType
  dailyHistory?: Record<ISODate, boolean>
}

interface GoalsState {
  goals: Goal[]
  load: () => Promise<void>
  create: (input: GoalInput) => Goal
  /** Перенести выбранные цели в новую неделю (ежедневные → ежедневные, общие → общие) */
  carryOverToWeek: (
    sourceGoals: Goal[],
    targetPeriodStart: ISODate,
    validCategoryIds?: Set<ID>,
    fallbackCategoryId?: ID,
  ) => Goal[]
  update: (id: ID, patch: Partial<GoalInput>) => void
  /** Переместить цель в корзину (мягкое удаление) */
  remove: (id: ID) => void
  /** Убрать несколько целей в корзину за один шаг */
  removeMany: (ids: ID[]) => void
  /** Восстановить цель из корзины */
  restore: (id: ID) => void
  /** Удалить цель навсегда */
  hardRemove: (id: ID) => void
  /** Очистить всю корзину */
  clearTrash: () => void
  toggle: (id: ID) => void
  /** Отметить день для ежедневной цели */
  toggleDailyDay: (goalId: ID, date: ISODate) => void
  addSubgoal: (goalId: ID, title: string) => void
  toggleSubgoal: (goalId: ID, subgoalId: ID) => void
  removeSubgoal: (goalId: ID, subgoalId: ID) => void
}

const allDone = (subgoals: SubGoal[]) => subgoals.length > 0 && subgoals.every((s) => s.done)

/** Цель считается выполненной автоматически, когда выполнены все её шаги */
function syncCompletion(goal: Goal): Goal {
  if (goal.subgoals.length === 0) return goal
  if (allDone(goal.subgoals)) return goal.completedAt ? goal : { ...goal, completedAt: nowISO() }
  return goal.completedAt ? { ...goal, completedAt: undefined } : goal
}

export const useGoals = create<GoalsState>((set, get) => {
  /** Обновить одну цель в памяти и в хранилище */
  const mutate = (id: ID, fn: (goal: Goal) => Goal) => {
    let changed: Goal | undefined
    const goals = get().goals.map((g) => {
      if (g.id !== id) return g
      changed = { ...fn(g), updatedAt: nowISO() }
      return changed
    })
    set({ goals })
    if (changed) void repos.goals.upsert(changed)
  }

  return {
    goals: [],

    async load() {
      set({ goals: await repos.goals.list() })
    },

    create(input) {
      const now = nowISO()
      const goal: Goal = syncCompletion({
        ...input,
        title: input.title.trim(),
        description: input.description?.trim() || undefined,
        id: newId(),
        userId: getActiveUserId(),
        createdAt: now,
        updatedAt: now,
      })
      set({ goals: [...get().goals, goal] })
      void repos.goals.upsert(goal)
      return goal
    },

    carryOverToWeek(sourceGoals, targetPeriodStart, validCategoryIds, fallbackCategoryId) {
      if (sourceGoals.length === 0) return []
      const now = nowISO()
      const userId = getActiveUserId()

      const created: Goal[] = sourceGoals.map((src) => {
        const isDaily = src.goalType === 'daily'
        const categoryId =
          validCategoryIds && !validCategoryIds.has(src.categoryId) && fallbackCategoryId
            ? fallbackCategoryId
            : src.categoryId

        if (isDaily) {
          return {
            id: newId(),
            userId,
            title: src.title.trim(),
            description: src.description?.trim() || undefined,
            categoryId,
            period: 'week',
            periodStart: targetPeriodStart,
            priority: src.priority,
            goalType: 'daily',
            subgoals: [],
            dailyHistory: {},
            createdAt: now,
            updatedAt: now,
          }
        }

        const wasDone = isGoalDone(src)
        const subgoals = src.subgoals.map((s) => ({
          id: newId(),
          title: s.title,
          done: wasDone ? false : s.done,
        }))

        return syncCompletion({
          id: newId(),
          userId,
          title: src.title.trim(),
          description: src.description?.trim() || undefined,
          categoryId,
          period: 'week',
          periodStart: targetPeriodStart,
          priority: src.priority,
          goalType: 'general',
          deadline: src.deadline && src.deadline >= targetPeriodStart ? src.deadline : undefined,
          subgoals,
          createdAt: now,
          updatedAt: now,
        })
      })

      set({ goals: [...get().goals, ...created] })
      for (const goal of created) {
        void repos.goals.upsert(goal)
      }
      return created
    },

    update(id, patch) {
      mutate(id, (g) => {
        const next = { ...g, ...patch }
        if (patch.title !== undefined) next.title = patch.title.trim()
        if (patch.description !== undefined) next.description = patch.description.trim() || undefined
        return patch.subgoals ? syncCompletion(next) : next
      })
    },

    remove(id) {
      mutate(id, (g) => ({ ...g, deletedAt: nowISO() }))
    },

    removeMany(ids) {
      if (ids.length === 0) return
      const idSet = new Set(ids)
      const now = nowISO()
      const changed: Goal[] = []
      const goals = get().goals.map((g) => {
        if (!idSet.has(g.id) || g.deletedAt) return g
        const updated = { ...g, deletedAt: now, updatedAt: now }
        changed.push(updated)
        return updated
      })
      if (changed.length === 0) return
      set({ goals })
      for (const goal of changed) {
        void repos.goals.upsert(goal)
      }
    },

    restore(id) {
      mutate(id, (g) => ({ ...g, deletedAt: undefined }))
    },

    hardRemove(id) {
      set({ goals: get().goals.filter((g) => g.id !== id) })
      void repos.goals.remove(id)
    },

    clearTrash() {
      const trashed = get().goals.filter((g) => Boolean(g.deletedAt))
      set({ goals: get().goals.filter((g) => !g.deletedAt) })
      for (const g of trashed) {
        void repos.goals.remove(g.id)
      }
    },

    /** Ручная отметка. Подцели не трогаем, чтобы снятие отметки вернуло прежний прогресс */
    toggle(id) {
      let justCompleted = false
      mutate(id, (g) => {
        if (!g.completedAt) justCompleted = true
        return { ...g, completedAt: g.completedAt ? undefined : nowISO() }
      })
      if (justCompleted) useCelebration.getState().celebrate()
    },

    toggleDailyDay(goalId, date) {
      let isChecked = false
      mutate(goalId, (g) => {
        const history = { ...(g.dailyHistory || {}) }
        const nextVal = !history[date]
        if (nextVal) {
          history[date] = true
          isChecked = true
        } else {
          delete history[date]
        }
        return {
          ...g,
          dailyHistory: history,
        }
      })
      if (isChecked) {
        useCelebration.getState().celebrate()
      }
    },

    addSubgoal(goalId, title) {
      const clean = title.trim()
      if (!clean) return
      mutate(goalId, (g) =>
        syncCompletion({ ...g, subgoals: [...g.subgoals, { id: newId(), title: clean, done: false }] }),
      )
    },

    toggleSubgoal(goalId, subgoalId) {
      let justCompleted = false
      mutate(goalId, (g) => {
        const wasDone = Boolean(g.completedAt)
        const next = syncCompletion({
          ...g,
          subgoals: g.subgoals.map((s) => (s.id === subgoalId ? { ...s, done: !s.done } : s)),
        })
        if (!wasDone && Boolean(next.completedAt)) justCompleted = true
        return next
      })
      if (justCompleted) useCelebration.getState().celebrate()
    },

    removeSubgoal(goalId, subgoalId) {
      mutate(goalId, (g) =>
        syncCompletion({ ...g, subgoals: g.subgoals.filter((s) => s.id !== subgoalId) }),
      )
    },
  }
})
