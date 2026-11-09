import type { ID } from '../types/models'

/**
 * Контракты хранилища. UI и сторы знают только эти интерфейсы.
 * Сейчас реализация — localStorage (local.ts), позже — Supabase (supabase.ts).
 * Методы асинхронные специально, чтобы замена не затронула остальной код.
 */
export interface Repository<T extends { id: ID }> {
  list(): Promise<T[]>
  upsert(item: T): Promise<void>
  remove(id: ID): Promise<void>
}

export interface KeyValueStore {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T): Promise<void>
}

