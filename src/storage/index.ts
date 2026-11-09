import type { Category, Goal } from '../types/models'
import { createLocalRepository, localKeyValue } from './local'

/**
 * Единственная точка, где выбирается реализация хранилища.
 * Для перехода на облако достаточно заменить реализации здесь.
 */
export const repos = {
  goals: createLocalRepository<Goal>('goals'),
  categories: createLocalRepository<Category>('categories'),
}

export const kv = localKeyValue

/** Пока нет авторизации, все данные принадлежат локальному пользователю */
export const LOCAL_USER_ID = 'local'

