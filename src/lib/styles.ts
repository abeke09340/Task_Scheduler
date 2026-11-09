import { cn } from './utils'

/** Общие классы полей ввода (вынесены из компонентов ради Fast Refresh) */
export const inputClass = cn(
  'h-10 w-full rounded-lg border border-line bg-surface px-3 text-body text-ink',
  'placeholder:text-muted/70 outline-none transition-colors',
  'focus:border-accent focus-visible:outline-none',
)

export const textareaClass = cn(inputClass, 'h-auto min-h-20 resize-none py-2.5')

