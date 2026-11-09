import { create } from 'zustand'
import { LOCAL_USER_ID, repos } from '../storage'
import type { Category, ColorKey, ID } from '../types/models'
import { newId, nowISO } from '../lib/utils'

interface CategoriesState {
  categories: Category[]
  load: () => Promise<void>
  add: (name: string, color: ColorKey) => Category
  update: (id: ID, patch: Partial<Pick<Category, 'name' | 'color'>>) => void
  remove: (id: ID) => void
}

const byOrder = (a: Category, b: Category) => a.order - b.order

export const useCategories = create<CategoriesState>((set, get) => ({
  categories: [],

  async load() {
    const categories = await repos.categories.list()
    set({ categories: categories.sort(byOrder) })
  },

  add(name, color) {
    const now = nowISO()
    const category: Category = {
      id: newId(),
      userId: LOCAL_USER_ID,
      name: name.trim(),
      color,
      isDefault: false,
      order: Math.max(0, ...get().categories.map((c) => c.order)) + 1,
      createdAt: now,
      updatedAt: now,
    }
    set({ categories: [...get().categories, category] })
    void repos.categories.upsert(category)
    return category
  },

  update(id, patch) {
    const categories = get().categories.map((c) =>
      c.id === id ? { ...c, ...patch, updatedAt: nowISO() } : c,
    )
    set({ categories })
    const changed = categories.find((c) => c.id === id)
    if (changed) void repos.categories.upsert(changed)
  },

  remove(id) {
    const target = get().categories.find((c) => c.id === id)
    if (!target || target.isDefault) return
    set({ categories: get().categories.filter((c) => c.id !== id) })
    void repos.categories.remove(id)
  },
}))

