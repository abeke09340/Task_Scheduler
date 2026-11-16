import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { getActiveUserId } from '../stores/auth'
import type { Category, Goal, ScheduleItem } from '../types/models'
import { createLocalRepository, localKeyValue } from './local'
import type { Repository } from './repository'
import {
  createSupabaseRepository,
  fromSupabaseCategory,
  fromSupabaseGoal,
  fromSupabaseSchedule,
  toSupabaseCategory,
  toSupabaseGoal,
  toSupabaseSchedule,
} from './supabaseRepo'

const localGoals = createLocalRepository<Goal>('goals', getActiveUserId)
const localCategories = createLocalRepository<Category>('categories', getActiveUserId)
const localSchedule = createLocalRepository<ScheduleItem>('schedule', getActiveUserId)

const supabaseGoals = isSupabaseConfigured
  ? createSupabaseRepository<Goal>(
      'goals',
      toSupabaseGoal,
      fromSupabaseGoal,
      getActiveUserId,
    )
  : localGoals

const supabaseCategories = isSupabaseConfigured
  ? createSupabaseRepository<Category>(
      'categories',
      toSupabaseCategory,
      fromSupabaseCategory,
      getActiveUserId,
    )
  : localCategories

const supabaseSchedule = isSupabaseConfigured
  ? createSupabaseRepository<ScheduleItem>(
      'schedule',
      toSupabaseSchedule,
      fromSupabaseSchedule,
      getActiveUserId,
    )
  : localSchedule

function createSmartRepo<T extends { id: string }>(
  localRepo: Repository<T>,
  supabaseRepo: Repository<T>,
): Repository<T> {
  return {
    async list() {
      const userId = getActiveUserId()
      if (isSupabaseConfigured && supabase && userId && userId !== 'local') {
        return supabaseRepo.list()
      }
      return localRepo.list()
    },
    async upsert(item: T) {
      const userId = getActiveUserId()
      if (isSupabaseConfigured && supabase && userId && userId !== 'local') {
        return supabaseRepo.upsert(item)
      }
      return localRepo.upsert(item)
    },
    async remove(id: string) {
      const userId = getActiveUserId()
      if (isSupabaseConfigured && supabase && userId && userId !== 'local') {
        return supabaseRepo.remove(id)
      }
      return localRepo.remove(id)
    },
  }
}

/**
 * Умный репозиторий:
 * Если пользователь вошёл через Supabase (userId !== 'local') — работаем с облаком.
 * Если пользователь в локальном/гостевом режиме (userId === 'local') — работаем с браузерным localStorage.
 */
export const repos = {
  goals: createSmartRepo(localGoals, supabaseGoals),
  categories: createSmartRepo(localCategories, supabaseCategories),
  schedule: createSmartRepo(localSchedule, supabaseSchedule),
}

export const kv = localKeyValue

export const LOCAL_USER_ID = 'local'
