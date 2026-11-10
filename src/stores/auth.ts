import { create } from 'zustand'
import { generateSalt, hashPassword, validatePassword } from '../lib/auth-crypto'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { nowISO } from '../lib/utils'
import {
  toSupabaseCategory,
  toSupabaseGoal,
  toSupabaseSchedule,
} from '../storage/supabaseRepo'
import type { AuthSession, Category, Goal, ID, ScheduleItem, User } from '../types/models'

const USERS_KEY = 'planner:v1:users'
const SESSION_KEY = 'planner:v1:session'
const PREFIX = 'planner:v1:'

function usernameToEmail(username: string): string {
  const clean = username.trim().toLowerCase()
  return clean.includes('@') ? clean : `${clean}@planner.local`
}

function emailToUsername(email?: string, metaUsername?: string): string {
  if (metaUsername && metaUsername.trim()) return metaUsername.trim()
  if (!email) return 'User'
  return email.replace(/@planner\.local$/i, '').split('@')[0]
}

function readRaw<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function writeRaw<T>(key: string, value: T) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch (err) {
    console.error(`Failed to write to localStorage (${PREFIX + key}):`, err)
  }
}

function readUsers(): User[] {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    return raw ? (JSON.parse(raw) as User[]) : []
  } catch {
    return []
  }
}

function writeUsers(users: User[]) {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users))
  } catch (err) {
    console.error('Failed to write users list:', err)
  }
}

function readSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as AuthSession) : null
  } catch {
    return null
  }
}

function writeSession(session: AuthSession | null) {
  try {
    if (session) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    } else {
      localStorage.removeItem(SESSION_KEY)
    }
  } catch (err) {
    console.error('Failed to update session:', err)
  }
}

function migrateLocalDataToUser(userId: ID) {
  const goals = readRaw<Goal[]>('goals') || []
  let goalsChanged = false
  for (const g of goals) {
    if (g.userId === 'local' || !g.userId) {
      g.userId = userId
      goalsChanged = true
    }
  }
  if (goalsChanged) writeRaw('goals', goals)

  const schedule = readRaw<ScheduleItem[]>('schedule') || []
  let schedChanged = false
  for (const s of schedule) {
    if (s.userId === 'local' || !s.userId) {
      s.userId = userId
      schedChanged = true
    }
  }
  if (schedChanged) writeRaw('schedule', schedule)

  const categories = readRaw<Category[]>('categories') || []
  let catChanged = false
  for (const c of categories) {
    if (c.userId === 'local' || !c.userId) {
      c.userId = userId
      catChanged = true
    }
  }
  if (catChanged) writeRaw('categories', categories)
}

/** Автоматическая бесшовная миграция всех локальных целей из localStorage в облако Supabase */
async function syncLocalDataToSupabase(userId: string) {
  if (!supabase) return
  try {
    const goals = readRaw<Goal[]>('goals') || []
    if (goals.length > 0) {
      for (const g of goals) {
        const payload = toSupabaseGoal({ ...g, userId }, userId)
        await supabase.from('goals').upsert(payload)
      }
    }

    const schedule = readRaw<ScheduleItem[]>('schedule') || []
    if (schedule.length > 0) {
      for (const s of schedule) {
        const payload = toSupabaseSchedule({ ...s, userId }, userId)
        await supabase.from('schedule').upsert(payload)
      }
    }

    const categories = readRaw<Category[]>('categories') || []
    if (categories.length > 0) {
      for (const c of categories) {
        const payload = toSupabaseCategory({ ...c, userId }, userId)
        await supabase.from('categories').upsert(payload)
      }
    }
  } catch (err) {
    console.error('Failed to sync local data to Supabase:', err)
  }
}

interface AuthState {
  user: User | null
  session: AuthSession | null
  isReady: boolean
  error: string | null
  isCloud: boolean
  init: () => Promise<void>
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  syncFromStorage: () => void
  clearError: () => void
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isReady: false,
  error: null,
  isCloud: isSupabaseConfigured,

  async init() {
    if (isSupabaseConfigured && supabase) {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.user) {
          const username = emailToUsername(
            session.user.email,
            session.user.user_metadata?.username,
          )
          const user: User = {
            id: session.user.id,
            username,
            createdAt: session.user.created_at,
          }
          const authSession: AuthSession = {
            userId: session.user.id,
            username,
            token: session.access_token,
          }
          set({ user, session: authSession, isReady: true, error: null })
          await syncLocalDataToSupabase(session.user.id)
        } else {
          set({ user: null, session: null, isReady: true })
        }

        // Подписка на обновление токена и смену сессии в Supabase
        supabase.auth.onAuthStateChange((_event, session) => {
          if (session?.user) {
            const username = emailToUsername(
              session.user.email,
              session.user.user_metadata?.username,
            )
            set({
              user: {
                id: session.user.id,
                username,
                createdAt: session.user.created_at,
              },
              session: {
                userId: session.user.id,
                username,
                token: session.access_token,
              },
            })
          } else {
            set({ user: null, session: null })
          }
        })
      } catch (err) {
        console.error('Supabase init auth error:', err)
        set({ user: null, session: null, isReady: true })
      }
      return
    }

    // Режим локального хранилища (fallback)
    const session = readSession()
    if (!session) {
      set({ user: null, session: null, isReady: true })
      return
    }

    const users = readUsers()
    const found = users.find((u) => u.id === session.userId)
    if (found) {
      set({ user: found, session, isReady: true })
    } else {
      writeSession(null)
      set({ user: null, session: null, isReady: true })
    }
  },

  syncFromStorage() {
    if (isSupabaseConfigured) return

    const session = readSession()
    const users = readUsers()
    const current = get().session

    if (!session) {
      if (current) set({ user: null, session: null })
      return
    }

    if (current?.token !== session.token || current?.userId !== session.userId) {
      const found = users.find((u) => u.id === session.userId)
      if (found) {
        set({ user: found, session })
      } else {
        set({ user: null, session: null })
      }
    }
  },

  clearError() {
    set({ error: null })
  },

  async login(rawUsername, password) {
    const username = rawUsername.trim()
    if (!username || !password) {
      const err = 'Введите имя пользователя и пароль'
      set({ error: err })
      return { success: false, error: err }
    }

    if (isSupabaseConfigured && supabase) {
      const email = usernameToEmail(username)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error || !data.user) {
        const message =
          error?.message === 'Invalid login credentials'
            ? 'Неверное имя пользователя или пароль'
            : error?.message || 'Ошибка входа'
        set({ error: message })
        return { success: false, error: message }
      }

      const cleanUsername = emailToUsername(
        data.user.email,
        data.user.user_metadata?.username,
      )
      const user: User = {
        id: data.user.id,
        username: cleanUsername,
        createdAt: data.user.created_at,
      }
      const session: AuthSession = {
        userId: data.user.id,
        username: cleanUsername,
        token: data.session?.access_token || crypto.randomUUID(),
      }

      set({ user, session, error: null })
      await syncLocalDataToSupabase(user.id)
      return { success: true }
    }

    // Локальный режим
    const users = readUsers()
    const user = users.find((u) => u.username.toLowerCase() === username.toLowerCase())
    if (!user) {
      const err = 'Неверное имя пользователя или пароль'
      set({ error: err })
      return { success: false, error: err }
    }

    const hash = await hashPassword(password, user.salt || '')
    if (hash !== user.passwordHash) {
      const err = 'Неверное имя пользователя или пароль'
      set({ error: err })
      return { success: false, error: err }
    }

    const session: AuthSession = {
      userId: user.id,
      username: user.username,
      token: crypto.randomUUID(),
    }

    writeSession(session)
    set({ user, session, error: null })
    return { success: true }
  },

  async register(rawUsername, password) {
    const username = rawUsername.trim()
    if (username.length < 3) {
      const err = 'Имя пользователя должно быть не менее 3 символов'
      set({ error: err })
      return { success: false, error: err }
    }

    const check = validatePassword(password)
    if (!check.valid) {
      const err = 'Пароль не удовлетворяет требованиям безопасности'
      set({ error: err })
      return { success: false, error: err }
    }

    if (isSupabaseConfigured && supabase) {
      const email = usernameToEmail(username)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username },
        },
      })

      if (error || !data.user) {
        let msg = error?.message || 'Ошибка регистрации'
        if (msg.includes('already registered')) {
          msg = 'Пользователь с таким именем уже существует'
        }
        set({ error: msg })
        return { success: false, error: msg }
      }

      // Сохраняем публичный профиль в таблице profiles
      try {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          username,
          display_name: username,
        })
      } catch (profileErr) {
        console.warn('Profile upsert warning:', profileErr)
      }

      const user: User = {
        id: data.user.id,
        username,
        createdAt: data.user.created_at,
      }
      const session: AuthSession = {
        userId: data.user.id,
        username,
        token: data.session?.access_token || crypto.randomUUID(),
      }

      set({ user, session, error: null })
      await syncLocalDataToSupabase(user.id)
      return { success: true }
    }

    // Локальный режим
    const users = readUsers()
    const exists = users.some((u) => u.username.toLowerCase() === username.toLowerCase())
    if (exists) {
      const err = 'Пользователь с таким логином уже существует'
      set({ error: err })
      return { success: false, error: err }
    }

    const salt = generateSalt()
    const passwordHash = await hashPassword(password, salt)
    const user: User = {
      id: `user-${crypto.randomUUID()}`,
      username,
      passwordHash,
      salt,
      createdAt: nowISO(),
    }

    users.push(user)
    writeUsers(users)
    migrateLocalDataToUser(user.id)

    const session: AuthSession = {
      userId: user.id,
      username: user.username,
      token: crypto.randomUUID(),
    }

    writeSession(session)
    set({ user, session, error: null })
    return { success: true }
  },

  async logout() {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut()
      } catch (err) {
        console.error('Supabase signOut error:', err)
      }
    } else {
      writeSession(null)
    }
    set({ user: null, session: null, error: null })
  },
}))

export function getActiveUserId(): ID {
  return useAuth.getState().user?.id ?? 'local'
}
