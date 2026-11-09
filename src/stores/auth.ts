import { create } from 'zustand'
import { generateSalt, hashPassword, validatePassword } from '../lib/auth-crypto'
import { nowISO } from '../lib/utils'
import type { AuthSession, Category, Goal, ID, ScheduleItem, User } from '../types/models'

const USERS_KEY = 'planner:v1:users'
const SESSION_KEY = 'planner:v1:session'
const PREFIX = 'planner:v1:'

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

/** Миграция существующих локальных данных на аккаунт только что зарегистрированного пользователя */
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

interface AuthState {
  user: User | null
  session: AuthSession | null
  isReady: boolean
  error: string | null
  init: () => void
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  syncFromStorage: () => void
  clearError: () => void
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isReady: false,
  error: null,

  init() {
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

    const users = readUsers()
    const user = users.find((u) => u.username.toLowerCase() === username.toLowerCase())
    if (!user) {
      const err = 'Неверное имя пользователя или пароль'
      set({ error: err })
      return { success: false, error: err }
    }

    const hash = await hashPassword(password, user.salt)
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

    // Привязываем локальные цели и дела к новому пользователю
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

  logout() {
    writeSession(null)
    set({ user: null, session: null, error: null })
  },
}))

export function getActiveUserId(): ID {
  return useAuth.getState().user?.id ?? 'local'
}

