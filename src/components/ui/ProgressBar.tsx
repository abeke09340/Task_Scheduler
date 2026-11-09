import { cn } from '../../lib/utils'

interface ProgressBarProps {
  value: number
  /** Класс цвета заполнения, по умолчанию — акцент */
  barClassName?: string
  className?: string
  label?: string
}

export function ProgressBar({ value, barClassName = 'bg-accent', className, label }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn('h-1.5 overflow-hidden rounded-full bg-track', className)}
    >
      <div
        className={cn('h-full rounded-full transition-[width] duration-300 ease-out', barClassName)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}

