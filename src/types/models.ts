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
  /** Отмечена выполненной (вручную или когда все подцели выполнены) */
  completedAt?: ISODateTime
}

export interface Profile {
  name: string
}

