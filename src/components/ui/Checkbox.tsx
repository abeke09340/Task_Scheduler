import { Check } from 'lucide-react'
import { cn } from '../../lib/utils'

interface CheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  size?: 'md' | 'sm'
}

export function Checkbox({ checked, onChange, label, size = 'md' }: CheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation()
        onChange(!checked)
      }}
      className={cn(
        'grid shrink-0 place-items-center rounded-full border-[1.5px]',
        'transition-[background-color,border-color,transform] duration-150 active:scale-90',
        size === 'md' ? 'size-5' : 'size-4',
        checked ? 'border-accent bg-accent' : 'border-line-strong bg-surface hover:border-muted',
      )}
    >
      {checked && (
        <Check className="animate-pop text-white" size={size === 'md' ? 12 : 10} strokeWidth={3} />
      )}
    </button>
  )
}

