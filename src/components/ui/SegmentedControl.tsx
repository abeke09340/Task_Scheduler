import { cn } from '../../lib/utils'

interface Option<T extends string> {
  value: T
  label: string
  dotClass?: string
}

interface SegmentedControlProps<T extends string> {
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
  label: string
  /** Растянуть на всю ширину (мобильная нижняя панель, формы) */
  stretch?: boolean
  className?: string
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  stretch,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className={cn('flex gap-1', stretch && 'w-full', className)}>
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'inline-flex items-center justify-center gap-1.5 h-8 rounded-full border transition-colors duration-150',
              stretch ? 'min-w-0 flex-1 truncate px-2 text-small' : 'px-3.5 text-body',
              active
                ? 'border-line bg-surface font-medium text-ink'
                : 'border-transparent text-muted hover:text-ink',
            )}
          >
            {option.dotClass && (
              <span className={cn('size-2 shrink-0 rounded-[2px]', option.dotClass)} />
            )}
            <span className="truncate">{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}

