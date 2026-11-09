import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent text-white hover:bg-accent-hover disabled:opacity-40 disabled:hover:bg-accent',
  secondary: 'border border-line bg-surface text-ink hover:bg-bg',
  ghost: 'text-ink hover:bg-pill',
  danger: 'text-rose-ink hover:bg-rose/60',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

export function Button({ variant = 'primary', className, type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg px-3.5 text-body font-medium',
        'transition-[background-color,transform,opacity] duration-150 active:scale-[0.98]',
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  )
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
}

export function IconButton({ label, className, type = 'button', ...props }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'grid size-8 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-pill hover:text-ink',
        className,
      )}
      {...props}
    />
  )
}

