import { Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Button } from '../../components/ui/Button'
import { Field, FieldGroup } from '../../components/ui/Field'
import { Modal } from '../../components/ui/Modal'
import { COLOR_CLASSES, COLOR_KEYS, COLOR_NAMES } from '../../lib/constants'
import { cn } from '../../lib/utils'
import { useSchedule } from '../../stores/schedule'
import type { ColorKey, ISODate, ScheduleItem } from '../../types/models'

interface ScheduleItemModalProps {
  mode: 'create' | 'edit'
  initialDate: ISODate
  initialStartTime?: string
  initialEndTime?: string
  itemToEdit?: ScheduleItem
  onClose: () => void
}

export function ScheduleItemModal({
  mode,
  initialDate,
  initialStartTime = '07:00',
  initialEndTime = '08:00',
  itemToEdit,
  onClose,
}: ScheduleItemModalProps) {
  const createItem = useSchedule((s) => s.createItem)
  const updateItem = useSchedule((s) => s.updateItem)
  const removeItem = useSchedule((s) => s.removeItem)

  const [title, setTitle] = useState(itemToEdit?.title ?? '')
  const [timeNote, setTimeNote] = useState(itemToEdit?.timeNote ?? '')
  const [date, setDate] = useState<ISODate>(itemToEdit?.date ?? initialDate)
  const startTime = itemToEdit?.startTime ?? initialStartTime
  const endTime = itemToEdit?.endTime ?? initialEndTime
  const [color, setColor] = useState<ColorKey>(itemToEdit?.color ?? 'blue')
  const [repeatDaily, setRepeatDaily] = useState(itemToEdit?.repeatDaily ?? false)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const cleanTitle = title.trim()
    if (!cleanTitle) return

    if (mode === 'create') {
      createItem({
        title: cleanTitle,
        timeNote: timeNote.trim() || undefined,
        date,
        startTime,
        endTime,
        color,
        repeatDaily,
      })
    } else if (itemToEdit) {
      updateItem(itemToEdit.id, {
        title: cleanTitle,
        timeNote: timeNote.trim() || undefined,
        startTime,
        endTime,
        color,
        repeatDaily,
      })
    }
    onClose()
  }

  const handleDelete = () => {
    if (itemToEdit && confirm(`Удалить дело «${itemToEdit.title}»?`)) {
      removeItem(itemToEdit.id)
      onClose()
    }
  }

  return (
    <Modal
      title={mode === 'create' ? 'Новое дело в расписании' : 'Редактировать дело'}
      onClose={onClose}
      footer={
        <div className="flex w-full items-center justify-between">
          {mode === 'edit' ? (
            <Button variant="danger" onClick={handleDelete} className="text-small">
              <Trash2 size={16} strokeWidth={1.75} />
              Удалить
            </Button>
          ) : (
            <div />
          )}
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onClose}>
              Отмена
            </Button>
            <Button variant="primary" onClick={handleSubmit} disabled={!title.trim()}>
              {mode === 'create' ? 'Создать' : 'Сохранить'}
            </Button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Название */}
        <Field label="Название шага / дела *">
          <input
            type="text"
            required
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Например: Утренняя пробежка, Разминка, Завтрак..."
            className="h-10 rounded-lg border border-line bg-surface px-3 text-body text-ink placeholder:text-muted focus:border-accent focus:outline-none"
          />
        </Field>

        {/* Необязательная пометка времени */}
        <Field label="Время / длительность (необязательно)">
          <input
            type="text"
            value={timeNote}
            onChange={(e) => setTimeNote(e.target.value)}
            placeholder="Например: 15 мин, 07:15..."
            className="h-10 rounded-lg border border-line bg-surface px-3 text-body text-ink placeholder:text-muted focus:border-accent focus:outline-none"
          />
        </Field>

        {/* Индикатор выбранного диапазона (автоматически из нажатого слота) */}
        <div className="flex items-center justify-between rounded-lg border border-line bg-bg/50 px-3 py-2 text-small">
          <span className="text-muted">Интервал времени:</span>
          <span className="font-semibold text-ink">
            {startTime} – {endTime}
          </span>
        </div>

        {/* Дата и повтор */}
        <div className="flex flex-col gap-2 rounded-lg border border-line bg-bg/50 p-3">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={repeatDaily}
              onChange={(e) => setRepeatDaily(e.target.checked)}
              className="size-4 rounded border-line text-accent accent-accent focus:ring-accent"
            />
            <span className="text-body font-medium text-ink">Повторять каждый день (рутина)</span>
          </label>
          <p className="text-small text-muted pl-6.5">
            Будет отображаться во все дни недели, а отметка о выполнении ставится отдельно на каждый день.
          </p>
          {!repeatDaily && (
            <div className="mt-1 pl-6.5">
              <span className="text-small text-muted">Дата: </span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded border border-line bg-surface px-2 py-1 text-small text-ink focus:border-accent focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Цвет / Категория */}
        <FieldGroup label="Цветовой маркер">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {COLOR_KEYS.map((k) => {
              const c = COLOR_CLASSES[k]
              const active = color === k
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setColor(k)}
                  className={cn(
                    'flex h-9 items-center justify-center gap-1.5 rounded-lg border text-small font-medium transition-all',
                    c.fill,
                    c.ink,
                    active ? 'border-ink shadow-sm ring-1 ring-ink' : 'border-transparent opacity-85 hover:opacity-100',
                  )}
                >
                  <span className={cn('size-2 rounded-full', c.dot)} />
                  {COLOR_NAMES[k]}
                </button>
              )
            })}
          </div>
        </FieldGroup>
      </form>
    </Modal>
  )
}
