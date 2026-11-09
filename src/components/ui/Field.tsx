import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

interface FieldProps {
  label: string
  children: ReactNode
  hint?: string
  className?: string
}

export function Field({ label, children, hint, className }: FieldProps) {
  return (
    <label className={cn('flex flex-col gap-1.5', className)}>
      <span className="text-small font-medium text-muted">{label}</span>
      {children}
      {hint && <span className="text-small text-muted">{hint}</span>}
    </label>
  )
}

/** Группа без <label>, для сегментов и чипов (чтобы клик не уходил в первый элемент) */
export function FieldGroup({ label, children, className }: FieldProps) {
  return (
    <div role="group" aria-label={label} className={cn('flex flex-col gap-1.5', className)}>
      <span className="text-small font-medium text-muted">{label}</span>
      {children}
    </div>
  )
}