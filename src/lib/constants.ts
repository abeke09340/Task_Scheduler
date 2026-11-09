import type { ColorKey, Period, Priority } from '../types/models'

/** Полные имена классов (Tailwind должен видеть их целиком в исходниках) */
export const COLOR_CLASSES: Record<ColorKey, { fill: string; ink: string; dot: string }> = {
  sage: { fill: 'bg-sage', ink: 'text-sage-ink', dot: 'bg-sage-ink' },
  blue: { fill: 'bg-blue', ink: 'text-blue-ink', dot: 'bg-blue-ink' },
  apricot: { fill: 'bg-apricot', ink: 'text-apricot-ink', dot: 'bg-apricot-ink' },
  lavender: { fill: 'bg-lavender', ink: 'text-lavender-ink', dot: 'bg-lavender-ink' },
  rose: { fill: 'bg-rose', ink: 'text-rose-ink', dot: 'bg-rose-ink' },
  sand: { fill: 'bg-sand', ink: 'text-sand-ink', dot: 'bg-sand-ink' },
}

export const COLOR_KEYS: ColorKey[] = ['sage', 'blue', 'apricot', 'lavender', 'rose', 'sand']

export const COLOR_NAMES: Record<ColorKey, string> = {
  sage: 'Шалфей',
  blue: 'Голубой',
  apricot: 'Абрикос',
  lavender: 'Лаванда',
  rose: 'Розовый',
  sand: 'Песочный',
}

export const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: 'day', label: 'День' },
  { value: 'week', label: 'Неделя' },
  { value: 'month', label: 'Месяц' },
  { value: 'year', label: 'Год' },
]

export const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: 'low', label: 'Низкий' },
  { value: 'medium', label: 'Средний' },
  { value: 'high', label: 'Высокий' },
]

