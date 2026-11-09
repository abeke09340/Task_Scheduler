import type { Category, Goal, ScheduleItem } from '../types/models'
import { createLocalRepository, localKeyValue } from './local'
import { getActiveUserId } from '../stores/auth'

/**
 * Единственная точка, где выбирается реализация хранилища.
 * Записи изолируются по ID авторизованного пользователя.
 */
export const repos = {
  goals: createLocalRepository<Goal>('goals', getActiveUserId),
  categories: createLocalRepository<Category>('categories', getActiveUserId),
  schedule: createLocalRepository<ScheduleItem>('schedule', getActiveUserId),
}

export const kv = localKeyValue

export const LOCAL_USER_ID = 'local'


