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

export const PRIORITY_STYLES: Record<
  Priority,
  {
    badge: string
    dot: string
    label: string
  }
> = {
  high: {
    badge: 'bg-priority-high-bg text-priority-high-ink border-priority-high-border/80',
    dot: 'bg-priority-high-dot',
    label: 'Высокий приоритет',
  },
  medium: {
    badge: 'bg-priority-med-bg text-priority-med-ink border-priority-med-border/80',
    dot: 'bg-priority-med-dot',
    label: 'Средний приоритет',
  },
  low: {
    badge: 'bg-priority-low-bg text-priority-low-ink border-priority-low-border/80',
    dot: 'bg-priority-low-dot',
    label: 'Низкий приоритет',
  },
}

export const PRIORITY_OPTIONS: { value: Priority; label: string; dotClass: string }[] = [
  { value: 'low', label: 'Низкий', dotClass: 'bg-priority-low-dot' },
  { value: 'medium', label: 'Средний', dotClass: 'bg-priority-med-dot' },
  { value: 'high', label: 'Высокий', dotClass: 'bg-priority-high-dot' },
]

