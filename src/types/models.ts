/**
 * Модели данных. Спроектированы как таблицы будущей БД (Supabase / PostgreSQL):
 * у каждой сущности есть id (UUID), userId, createdAt, updatedAt.
 */

export type ID = string
/** '2026-11-04' */
export type ISODate = string
/** '2026-11-04T15:00:00.000Z' */
export type ISODateTime = string

export interface BaseEntity {
  id: ID
  userId: ID
  createdAt: ISODateTime
  updatedAt: ISODateTime
}

export type ColorKey = 'sage' | 'blue' | 'apricot' | 'lavender' | 'rose' | 'sand'
export type Period = 'day' | 'week' | 'month' | 'year'
export type Priority = 'low' | 'medium' | 'high'

export interface Category extends BaseEntity {
  name: string
  color: ColorKey
  /** Стандартные категории можно переименовать, но нельзя удалить */
  isDefault: boolean
  order: number
}

export interface SubGoal {
  id: ID
  title: string
  done: boolean
}

export type GoalType = 'general' | 'daily'

export interface Goal extends BaseEntity {
  title: string
  description?: string
  categoryId: ID
  period: Period
  /** Начало периода, к которому относится цель: день / понедельник / 1-е число / 1 января */
  periodStart: ISODate
  priority: Priority
  deadline?: ISODate
  subgoals: SubGoal[]
  /** Тип цели: общая цель (проектная) или ежедневная (рутина с 7 тиками по дням) */
  goalType?: GoalType
  /** Отметки дней для ежедневных целей: { '2026-11-09': true } */
  dailyHistory?: Record<ISODate, boolean>
  /** Отмечена выполненной (вручную или когда все подцели выполнены) */
  completedAt?: ISODateTime
  /** Перемещена в корзину (история удалённых целей) */
  deletedAt?: ISODateTime
}

export interface Profile {
  name: string
}

export interface User {
  id: ID
  username: string
  passwordHash?: string
  salt?: string
  createdAt: ISODateTime
}

export interface AuthSession {
  userId: ID
  username: string
  token: string
}

export interface ScheduleDayProgress {
  completed?: boolean
}

export interface ScheduleItem extends BaseEntity {
  /** Дата дня ('2026-11-10'), для которого создана запись */
  date: ISODate
  /** Если true — отображается во все дни недели как регулярная рутина */
  repeatDaily?: boolean
  /** Начало диапазона, например "07:00" */
  startTime: string
  /** Конец диапазона, например "08:00" или "07:30" */
  endTime: string
  title: string
  /** Необязательная пометка времени или длительности (например, "07:10" или "10 мин") */
  timeNote?: string
  color: ColorKey
  /** Прогресс выполнения по датам: ключ — ISODate */
  dailyProgress?: Record<ISODate, ScheduleDayProgress>
}

export interface ScheduleSettings {
  /** Час начала дня (по умолчанию 7 = 07:00) */
  startHour: number
  /** Час конца дня (по умолчанию 22 = 22:00) */
  endHour: number
  /** Длительность одного слота в минутах (по умолчанию 60, можно 30, 15, 45 и т.д.) */
  slotMinutes: number
}

