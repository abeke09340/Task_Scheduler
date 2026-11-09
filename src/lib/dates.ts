import {
  differenceInCalendarDays,
  endOfWeek,
  format,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from 'date-fns'
import { ru } from 'date-fns/locale'
import type { ISODate, Period } from '../types/models'

const WEEK = { weekStartsOn: 1 as const }

export const toISODate = (date: Date): ISODate => format(date, 'yyyy-MM-dd')

export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** Ключ периода: дата начала дня / недели (пн) / месяца / года */
export function periodStartKey(period: Period, date: Date = new Date()): ISODate {
  switch (period) {
    case 'day':
      return toISODate(date)
    case 'week':
      return toISODate(startOfWeek(date, WEEK))
    case 'month':
      return toISODate(startOfMonth(date))
    case 'year':
      return toISODate(startOfYear(date))
  }
}

/** Подпись текущего периода: «Среда, 4 ноября», «2–8 ноября», «Ноябрь 2026», «2026» */
export function periodLabel(period: Period, date: Date = new Date()): string {
  switch (period) {
    case 'day':
      return capitalize(format(date, 'EEEE, d MMMM', { locale: ru }))
    case 'week': {
      const start = startOfWeek(date, WEEK)
      const end = endOfWeek(date, WEEK)
      return isSameMonth(start, end)
        ? `${format(start, 'd')}–${format(end, 'd MMMM', { locale: ru })}`
        : `${format(start, 'd MMMM', { locale: ru })} – ${format(end, 'd MMMM', { locale: ru })}`
    }
    case 'month':
      return capitalize(format(date, 'LLLL yyyy', { locale: ru }))
    case 'year':
      return format(date, 'yyyy')
  }
}

export type DeadlineInfo = { text: string; tone: 'normal' | 'soon' | 'overdue' }

export function deadlineInfo(deadline: ISODate, today: Date = new Date()): DeadlineInfo {
  const date = parseISO(deadline)
  const days = differenceInCalendarDays(date, today)
  const pretty = format(date, 'd MMMM', { locale: ru })
  if (days < 0) return { text: `Просрочено · ${pretty}`, tone: 'overdue' }
  if (days === 0) return { text: 'Сегодня', tone: 'soon' }
  if (days === 1) return { text: 'Завтра', tone: 'soon' }
  return { text: `До ${pretty}`, tone: 'normal' }
}

export function greeting(date: Date = new Date()): string {
  const h = date.getHours()
  if (h >= 5 && h < 12) return 'Доброе утро'
  if (h >= 12 && h < 17) return 'Добрый день'
  if (h >= 17 && h < 23) return 'Добрый вечер'
  return 'Доброй ночи'
}

