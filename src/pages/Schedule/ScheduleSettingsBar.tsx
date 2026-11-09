import { Clock, RotateCcw, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { useSchedule } from '../../stores/schedule'
import { cn } from '../../lib/utils'

const START_HOURS = [4, 5, 6, 7, 8, 9, 10]
const END_HOURS = [19, 20, 21, 22, 23, 24]
const SPAN_OPTIONS = [
  { value: 15, label: '15 минут' },
  { value: 30, label: '30 минут' },
  { value: 45, label: '45 минут' },
  { value: 60, label: '1 час (по умолч.)' },
  { value: 90, label: '1.5 часа' },
  { value: 120, label: '2 часа' },
]

export function ScheduleSettingsBar() {
  const settings = useSchedule((s) => s.settings)
  const updateSettings = useSchedule((s) => s.updateSettings)

  const [expanded, setExpanded] = useState(false)

  const isDefault =
    settings.startHour === 7 && settings.endHour === 22 && settings.slotMinutes === 60

  const handleReset = () => {
    updateSettings({ startHour: 7, endHour: 22, slotMinutes: 60 })
  }

  const formatHour = (h: number) => `${String(h).padStart(2, '0')}:00`

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-line bg-surface p-3 transition-all">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Краткая сводка текущей сетки */}
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-lg bg-bg text-muted">
            <Clock size={15} strokeWidth={1.75} />
          </span>
          <div className="flex flex-wrap items-center gap-1.5 text-small">
            <span className="text-muted">Сетка:</span>
            <span className="font-medium text-ink">
              с {formatHour(settings.startHour)} до {formatHour(settings.endHour)}
            </span>
            <span className="text-muted">·</span>
            <span className="font-medium text-ink">
              шаг {settings.slotMinutes >= 60 ? `${settings.slotMinutes / 60} ч` : `${settings.slotMinutes} мин`}
            </span>
          </div>
        </div>

        {/* Быстрое переключение шага или разворачивание настроек */}
        <div className="flex items-center gap-2">
          {/* Быстрые кнопки шага */}
          <div className="hidden sm:flex items-center rounded-lg border border-line bg-bg p-0.5 text-small">
            <button
              type="button"
              onClick={() => updateSettings({ slotMinutes: 30 })}
              className={cn(
                'rounded-md px-2.5 py-1 font-medium transition-all',
                settings.slotMinutes === 30
                  ? 'bg-surface text-ink shadow-xs font-semibold'
                  : 'text-muted hover:text-ink',
              )}
            >
              30 мин
            </button>
            <button
              type="button"
              onClick={() => updateSettings({ slotMinutes: 60 })}
              className={cn(
                'rounded-md px-2.5 py-1 font-medium transition-all',
                settings.slotMinutes === 60
                  ? 'bg-surface text-ink shadow-xs font-semibold'
                  : 'text-muted hover:text-ink',
              )}
            >
              1 час
            </button>
          </div>

          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className={cn(
              'flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1 text-small font-medium transition-colors',
              expanded ? 'bg-pill text-ink' : 'bg-surface text-muted hover:text-ink',
            )}
          >
            <SlidersHorizontal size={14} strokeWidth={1.75} />
            <span>{expanded ? 'Скрыть настройки' : 'Настроить сетку'}</span>
          </button>
        </div>
      </div>

      {/* Развёрнутая панель настроек */}
      {expanded && (
        <div className="mt-2 grid grid-cols-1 gap-3 border-t border-line pt-3 sm:grid-cols-3">
          {/* Начало дня */}
          <label className="flex flex-col gap-1">
            <span className="text-small text-muted font-medium">Начало дня</span>
            <select
              value={settings.startHour}
              onChange={(e) => updateSettings({ startHour: Number(e.target.value) })}
              className="h-9 rounded-lg border border-line bg-surface px-2.5 text-small text-ink focus:border-accent focus:outline-none"
            >
              {START_HOURS.map((h) => (
                <option key={h} value={h}>
                  {formatHour(h)} {h === 7 ? '(по умолчанию)' : h === 6 ? '(раньше)' : ''}
                </option>
              ))}
            </select>
          </label>

          {/* Конец дня */}
          <label className="flex flex-col gap-1">
            <span className="text-small text-muted font-medium">Конец дня</span>
            <select
              value={settings.endHour}
              onChange={(e) => updateSettings({ endHour: Number(e.target.value) })}
              className="h-9 rounded-lg border border-line bg-surface px-2.5 text-small text-ink focus:border-accent focus:outline-none"
            >
              {END_HOURS.map((h) => (
                <option key={h} value={h}>
                  {formatHour(h)} {h === 22 ? '(по умолчанию)' : ''}
                </option>
              ))}
            </select>
          </label>

          {/* Шаг времени */}
          <label className="flex flex-col gap-1">
            <span className="text-small text-muted font-medium">Шаг времени (span)</span>
            <select
              value={settings.slotMinutes}
              onChange={(e) => updateSettings({ slotMinutes: Number(e.target.value) })}
              className="h-9 rounded-lg border border-line bg-surface px-2.5 text-small text-ink focus:border-accent focus:outline-none"
            >
              {SPAN_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          {/* Сброс */}
          {!isDefault && (
            <div className="col-span-full flex justify-end">
              <Button variant="ghost" onClick={handleReset} className="h-8 text-small text-muted hover:text-ink">
                <RotateCcw size={13} strokeWidth={1.75} />
                Сбросить на дефолт (07:00, шаг 1 час)
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
