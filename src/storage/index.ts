import { isSupabaseConfigured } from '../lib/supabase'
import { getActiveUserId } from '../stores/auth'
import type { Category, Goal, ScheduleItem } from '../types/models'
import { createLocalRepository, localKeyValue } from './local'
import {
  createSupabaseRepository,
  fromSupabaseCategory,
  fromSupabaseGoal,
  fromSupabaseSchedule,
  toSupabaseCategory,
  toSupabaseGoal,
  toSupabaseSchedule,
} from './supabaseRepo'

/**
 * Единственная точка, где выбирается реализация хранилища.
 * Если настроен Supabase (VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY),
 * данные синхронизируются в реальном времени с облачной БД PostgreSQL.
 * Иначе — локальное хранилище в браузере.
 */
export const repos = isSupabaseConfigured
  ? {
      goals: createSupabaseRepository<Goal>(
        'goals',
        toSupabaseGoal,
        fromSupabaseGoal,
        getActiveUserId,
      ),
      categories: createSupabaseRepository<Category>(
        'categories',
        toSupabaseCategory,
        fromSupabaseCategory,
        getActiveUserId,
      ),
      schedule: createSupabaseRepository<ScheduleItem>(
        'schedule',
        toSupabaseSchedule,
        fromSupabaseSchedule,
        getActiveUserId,
      ),
    }
  : {
      goals: createLocalRepository<Goal>('goals', getActiveUserId),
      categories: createLocalRepository<Category>('categories', getActiveUserId),
      schedule: createLocalRepository<ScheduleItem>('schedule', getActiveUserId),
    }

export const kv = localKeyValue

export const LOCAL_USER_ID = 'local'
