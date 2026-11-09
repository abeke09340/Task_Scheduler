import type { ID } from '../types/models'
import type { KeyValueStore, Repository } from './repository'

const PREFIX = 'planner:v1:'

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function write<T>(key: string, value: T) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch (err) {
    console.error(`Failed to write to localStorage (${PREFIX + key}):`, err)
  }
}

export function createLocalRepository<T extends { id: ID; userId?: ID }>(
  table: string,
  getUserId?: () => ID,
): Repository<T> {
  return {
    async list() {
      const all = read<T[]>(table) ?? []
      if (!getUserId) return all
      const currentId = getUserId()
      return all.filter((x) => x.userId === currentId || (!x.userId && currentId === 'local'))
    },
    async upsert(item) {
      const all = read<T[]>(table) ?? []
      const index = all.findIndex((x) => x.id === item.id)
      if (index === -1) all.push(item)
      else all[index] = item
      write(table, all)
    },
    async remove(id) {
      const all = read<T[]>(table) ?? []
      write(
        table,
        all.filter((x) => x.id !== id),
      )
    },
  }
}

export const localKeyValue: KeyValueStore = {
  async get<T>(key: string) {
    return read<T>(`kv:${key}`)
  },
  async set<T>(key: string, value: T) {
    write(`kv:${key}`, value)
  },
}

