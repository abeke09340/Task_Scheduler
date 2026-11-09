import { Clock, Pencil, Repeat, Trash2 } from 'lucide-react'
import { IconButton } from '../../components/ui/Button'
import { COLOR_CLASSES } from '../../lib/constants'
import { cn } from '../../lib/utils'
import type { ScheduleItem } from '../../types/models'

interface ScheduleItemCardProps {
  item: ScheduleItem
  onEdit: (item: ScheduleItem) => void
  onDelete: (id: string) => void
}

export function ScheduleItemCard({
  item,
  onEdit,
  onDelete,
}: ScheduleItemCardProps) {
  const colorConfig = COLOR_CLASSES[item.color] ?? COLOR_CLASSES.blue

  return (
    <div
      className={cn(
        'group relative flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-3.5 py-2.5 transition-all duration-150',
        'hover:border-line-strong hover:bg-surface hover:shadow-[0_2px_8px_rgba(0,0,0,0.03)]',
      )}
    >
      <div className="flex flex-1 items-center gap-3 min-w-0">
        {/* Время дела, окрашенное в цвет категории (без лишнего текста "Голубой") */}
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] font-semibold shrink-0 tabular-nums tracking-tight',
            colorConfig.fill,
            colorConfig.ink,
          )}
        >
          <Clock size={12} strokeWidth={2} />
          {item.startTime} – {item.endTime}
        </span>

        {/* Название дела */}
        <span className="text-body font-medium text-ink truncate">
          {item.title}
        </span>

        {/* Необязательная пометка времени или длительности */}
        {item.timeNote && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-bg px-2 py-0.5 text-[11px] font-medium text-muted">
            {item.timeNote}
          </span>
        )}

        {/* Бейдж повторяемости */}
        {item.repeatDaily && (
          <span
            title="Повторяется каждый день"
            className="hidden sm:inline-flex shrink-0 items-center gap-1 rounded-md bg-accent-soft px-1.5 py-0.5 text-[11px] font-medium text-accent"
          >
            <Repeat size={10} strokeWidth={1.75} />
            Каждый день
          </span>
        )}
      </div>

      {/* Кнопки действий (редактировать, удалить) */}
      <div className="flex items-center gap-0.5 opacity-80 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
        <IconButton label="Редактировать" onClick={() => onEdit(item)} className="size-7 hover:bg-pill">
          <Pencil size={13} strokeWidth={1.75} />
        </IconButton>
        <IconButton
          label="Удалить"
          onClick={() => onDelete(item.id)}
          className="size-7 hover:bg-rose/40 hover:text-rose-ink"
        >
          <Trash2 size={13} strokeWidth={1.75} />
        </IconButton>
      </div>
    </div>
  )
}
