import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { ru } from 'date-fns/locale'
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { IconButton } from '../../components/ui/Button'
import { capitalize, toISODate } from '../../lib/dates'
import { cn } from '../../lib/utils'
import type { ISODate } from '../../types/models'

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const WEEK_OPTS = { weekStartsOn: 1 as const }

interface DayDatePickerProps {
  value: ISODate
  onChange: (date: ISODate) => void
  goalDates: Set<ISODate>
}

export function DayDatePicker({ value, onChange, goalDates }: DayDatePickerProps) {
  const [expanded, setExpanded] = useState(false)
  const [viewMonth, setViewMonth] = useState<Date>(() => startOfMonth(parseISO(value)))

  const [today] = useState(() => new Date())
  const todayStr = useMemo(() => toISODate(today), [today])
  const selectedDate = useMemo(() => parseISO(value), [value])

  const relativeTag = useMemo(() => {
    const diff = differenceInCalendarDays(selectedDate, today)
    if (diff === 0) return 'Сегодня'
    if (diff === -1) return 'Вчера'
    if (diff === 1) return 'Завтра'
    return null
  }, [selectedDate, today])

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(viewMonth)
    const monthEnd = endOfMonth(viewMonth)
    return eachDayOfInterval({
      start: startOfWeek(monthStart, WEEK_OPTS),
      end: endOfWeek(monthEnd, WEEK_OPTS),
    })
  }, [viewMonth])

  const selectDate = (date: Date) => {
    const nextStr = toISODate(date)
    onChange(nextStr)
    if (!isSameMonth(date, viewMonth)) {
      setViewMonth(startOfMonth(date))
    }
  }

  const formattedSelected = capitalize(
    format(
      selectedDate,
      selectedDate.getFullYear() === today.getFullYear() ? 'EEEE, d MMMM' : 'd MMMM yyyy',
      { locale: ru },
    ),
  )

  return (
    <div className="mt-3.5 overflow-hidden rounded-xl border border-line bg-surface">
      {/* Компактная шапка — всегда видна, клик по кнопке раскрывает/сворачивает календарь */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
        <div className="flex min-w-0 items-center gap-1">
          <IconButton
            label="Предыдущий день"
            onClick={() => selectDate(addDays(selectedDate, -1))}
            className="size-8 shrink-0"
          >
            <ChevronLeft size={16} strokeWidth={1.75} />
          </IconButton>

          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="flex min-w-0 items-center gap-2 rounded-lg px-2 py-1 text-left transition-colors hover:bg-bg"
          >
            <CalendarDays size={16} strokeWidth={1.75} className="shrink-0 text-accent" />
            <span className="truncate text-body font-medium text-ink">{formattedSelected}</span>
            {relativeTag && (
              <span
                className={cn(
                  'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium',
                  relativeTag === 'Сегодня'
                    ? 'bg-accent-soft text-accent'
                    : 'bg-pill text-muted',
                )}
              >
                {relativeTag}
              </span>
            )}
          </button>

          <IconButton
            label="Следующий день"
            onClick={() => selectDate(addDays(selectedDate, 1))}
            className="size-8 shrink-0"
          >
            <ChevronRight size={16} strokeWidth={1.75} />
          </IconButton>
        </div>

        <div className="flex items-center gap-1.5">
          {value !== todayStr && (
            <button
              type="button"
              onClick={() => selectDate(today)}
              className="h-7 rounded-lg border border-line px-2.5 text-small font-medium text-ink transition-colors hover:border-line-strong hover:bg-bg"
            >
              Сегодня
            </button>
          )}

          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-small font-medium text-muted transition-colors hover:bg-bg hover:text-ink"
          >
            <span>{expanded ? 'Свернуть' : 'Календарь'}</span>
            <ChevronDown
              size={15}
              strokeWidth={1.75}
              className={cn('transition-transform duration-200', expanded && 'rotate-180')}
            />
          </button>
        </div>
      </div>

      {/* Раскрывающийся календарь */}
      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-200 ease-out',
          expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="overflow-hidden">
          <div className="border-t border-line px-3.5 pt-3 pb-3.5">
            {/* Переключатель месяца */}
            <div className="mb-2.5 flex items-center justify-between">
              <IconButton
                label="Предыдущий месяц"
                onClick={() => setViewMonth((m) => subMonths(m, 1))}
                className="size-8"
              >
                <ChevronLeft size={16} strokeWidth={1.75} />
              </IconButton>
              <span className="text-body font-semibold text-ink">
                {capitalize(format(viewMonth, 'LLLL yyyy', { locale: ru }))}
              </span>
              <IconButton
                label="Следующий месяц"
                onClick={() => setViewMonth((m) => addMonths(m, 1))}
                className="size-8"
              >
                <ChevronRight size={16} strokeWidth={1.75} />
              </IconButton>
            </div>

            {/* Дни недели */}
            <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-muted">
              {WEEKDAYS.map((w) => (
                <div key={w} className="py-1">
                  {w}
                </div>
              ))}
            </div>

            {/* Сетка дат */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day) => {
                const dateStr = toISODate(day)
                const inMonth = isSameMonth(day, viewMonth)
                const isSelected = dateStr === value
                const isToday = dateStr === todayStr
                const hasGoals = goalDates.has(dateStr)

                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => selectDate(day)}
                    aria-label={format(day, 'd MMMM yyyy', { locale: ru })}
                    aria-pressed={isSelected}
                    className={cn(
                      'relative flex h-9 flex-col items-center justify-center rounded-lg text-small tabular-nums transition-colors',
                      isSelected
                        ? 'bg-accent font-semibold text-white'
                        : isToday
                          ? 'bg-accent-soft/80 font-semibold text-accent ring-1 ring-accent/30 hover:bg-accent-soft'
                          : inMonth
                            ? 'text-ink hover:bg-bg'
                            : 'text-muted/45 hover:bg-bg/60 hover:text-muted',
                    )}
                  >
                    <span>{format(day, 'd')}</span>
                    {hasGoals && (
                      <span
                        className={cn(
                          'absolute bottom-1 size-1 rounded-full',
                          isSelected ? 'bg-white' : 'bg-accent',
                        )}
                      />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
