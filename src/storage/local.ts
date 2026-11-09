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
  localStorage.setItem(PREFIX + key, JSON.stringify(value))
}

export function createLocalRepository<T extends { id: ID }>(table: string): Repository<T> {
  return {
    async list() {
      return read<T[]>(table) ?? []
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

