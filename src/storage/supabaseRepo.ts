import { supabase } from '../lib/supabase'
import type { Category, Goal, ID, ScheduleItem } from '../types/models'
import type { Repository } from './repository'

export function toSupabaseGoal(g: Goal, userId: string) {
  return {
    id: g.id,
    user_id: userId,
    title: g.title,
    description: g.description ?? null,
    category_id: g.categoryId,
    period: g.period,
    period_start: g.periodStart,
    priority: g.priority,
    deadline: g.deadline ?? null,
    subgoals: g.subgoals ?? [],
    goal_type: g.goalType ?? 'general',
    daily_history: g.dailyHistory ?? {},
    completed_at: g.completedAt ?? null,
    deleted_at: g.deletedAt ?? null,
    created_at: g.createdAt,
    updated_at: g.updatedAt,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fromSupabaseGoal(r: any): Goal {
  return {
    id: r.id,
    userId: r.user_id,
    title: r.title,
    description: r.description ?? undefined,
    categoryId: r.category_id,
    period: r.period,
    periodStart: r.period_start,
    priority: r.priority,
    deadline: r.deadline ?? undefined,
    subgoals: r.subgoals ?? [],
    goalType: r.goal_type ?? 'general',
    dailyHistory: r.daily_history ?? {},
    completedAt: r.completed_at ?? undefined,
    deletedAt: r.deleted_at ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

export function toSupabaseCategory(c: Category, userId: string) {
  return {
    id: c.id,
    user_id: userId,
    name: c.name,
    color: c.color,
    is_default: c.isDefault,
    order_index: c.order,
    created_at: c.createdAt,
    updated_at: c.updatedAt,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fromSupabaseCategory(r: any): Category {
  return {
    id: r.id,
    userId: r.user_id,
    name: r.name,
    color: r.color,
    isDefault: r.is_default,
    order: r.order_index,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

export function toSupabaseSchedule(s: ScheduleItem, userId: string) {
  return {
    id: s.id,
    user_id: userId,
    date: s.date,
    repeat_daily: Boolean(s.repeatDaily),
    start_time: s.startTime,
    end_time: s.endTime,
    title: s.title,
    time_note: s.timeNote ?? null,
    color: s.color,
    daily_progress: s.dailyProgress ?? {},
    created_at: s.createdAt,
    updated_at: s.updatedAt,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fromSupabaseSchedule(r: any): ScheduleItem {
  return {
    id: r.id,
    userId: r.user_id,
    date: r.date,
    repeatDaily: r.repeat_daily,
    startTime: r.start_time,
    endTime: r.end_time,
    title: r.title,
    timeNote: r.time_note ?? undefined,
    color: r.color,
    dailyProgress: r.daily_progress ?? {},
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

export function createSupabaseRepository<T extends { id: ID }>(
  table: string,
  toDb: (item: T, userId: string) => Record<string, unknown>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fromDb: (row: any) => T,
  getUserId: () => ID,
): Repository<T> {
  return {
    async list() {
      if (!supabase) return []
      const userId = getUserId()
      if (!userId || userId === 'local') return []

      const { data, error } = await supabase
        .from(table)
        .select('*')
        .order('created_at', { ascending: true })

      if (error) {
        console.error(`Error loading ${table} from Supabase:`, error)
        return []
      }
      return (data || []).map(fromDb)
    },

    async upsert(item: T) {
      if (!supabase) return
      const userId = getUserId()
      if (!userId || userId === 'local') return

      const payload = toDb(item, userId)
      const { error } = await supabase.from(table).upsert(payload)
      if (error) {
        console.error(`Error saving ${table} item to Supabase:`, error)
      }
    },

    async remove(id: ID) {
      if (!supabase) return
      const { error } = await supabase.from(table).delete().eq('id', id)
      if (error) {
        console.error(`Error deleting from ${table} in Supabase:`, error)
      }
    },
  }
}

