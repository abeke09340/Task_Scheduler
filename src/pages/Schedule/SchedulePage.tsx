import {
  CalendarDays,
  Plus,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Button } from '../../components/ui/Button'
import { getUpcomingWeekDays, toISODate } from '../../lib/dates'
import { cn } from '../../lib/utils'
import { useSchedule } from '../../stores/schedule'
import type { ISODate, ScheduleItem } from '../../types/models'
import { ScheduleItemCard } from './ScheduleItemCard'
import { ScheduleItemModal } from './ScheduleItemModal'
import { ScheduleSettingsBar } from './ScheduleSettingsBar'

function parseTimeToMinutes(t: string): number {
  if (!t) return 0
  const [h, m] = t.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

interface Slot {
  startMin: number
  endMin: number
  startTime: string
  endTime: string
  isCurrent: boolean
}

type ModalState =
  | { mode: 'closed' }
  | { mode: 'create'; initialStartTime?: string; initialEndTime?: string; date: ISODate }
  | { mode: 'edit'; item: ScheduleItem }

export function SchedulePage() {
  const items = useSchedule((s) => s.items)
  const settings = useSchedule((s) => s.settings)
  const removeItem = useSchedule((s) => s.removeItem)

  const [today] = useState(() => new Date())
  const todayStr = useMemo(() => toISODate(today), [today])
  const [selectedDate, setSelectedDate] = useState<ISODate>(todayStr)
  const [modalState, setModalState] = useState<ModalState>({ mode: 'closed' })

  // 7 дней вперед начиная с сегодня: Сегодня, Завтра, 12, 13, 14, 15...
  const upcomingTabs = useMemo(() => getUpcomingWeekDays(today), [today])
  const selectedTab = upcomingTabs.find((t) => t.date === selectedDate) ?? upcomingTabs[0]

  const isToday = selectedDate === todayStr

  // Генерация слотов сетки на основе настроек пользователя
  const slots: Slot[] = useMemo(() => {
    const res: Slot[] = []
    const startMin = settings.startHour * 60
    const endMin = settings.endHour * 60
    const step = settings.slotMinutes || 60

    const nowMinutes = today.getHours() * 60 + today.getMinutes()

    for (let m = startMin; m < endMin; m += step) {
      const nextM = Math.min(m + step, endMin)
      const startTime = `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
      const endTime = `${String(Math.floor(nextM / 60)).padStart(2, '0')}:${String(nextM % 60).padStart(2, '0')}`
      const isCurrent = isToday && nowMinutes >= m && nowMinutes < nextM

      res.push({
        startMin: m,
        endMin: nextM,
        startTime,
        endTime,
        isCurrent,
      })
    }
    return res
  }, [settings.startHour, settings.endHour, settings.slotMinutes, isToday, today])

  // Фильтрация дел для выбранного дня (свои дела дня + повторяющиеся каждый день)
  const dayItems = useMemo(() => {
    return items.filter((item) => item.date === selectedDate || item.repeatDaily === true)
  }, [items, selectedDate])

  // Группировка дел по слотам
  const slotItemsMap = useMemo(() => {
    const map = new Map<number, ScheduleItem[]>()
    if (slots.length === 0) return map

    const firstSlot = slots[0]

    for (const item of dayItems) {
      const itemMin = parseTimeToMinutes(item.startTime)

      let assignedSlotIndex = slots.findIndex(
        (slot) => itemMin >= slot.startMin && itemMin < slot.endMin,
      )

      // Если дело раньше первого слота — показываем в первом, если позже последнего — в последнем
      if (assignedSlotIndex === -1) {
        if (itemMin < firstSlot.startMin) assignedSlotIndex = 0
        else assignedSlotIndex = slots.length - 1
      }

      const list = map.get(assignedSlotIndex) ?? []
      list.push(item)
      map.set(assignedSlotIndex, list)
    }

    return map
  }, [dayItems, slots])

  // Количество дел за выбранный день
  const totalCount = dayItems.length

  const handleOpenCreate = (initialStartTime?: string, initialEndTime?: string) => {
    setModalState({
      mode: 'create',
      date: selectedDate,
      initialStartTime: initialStartTime ?? `${String(settings.startHour).padStart(2, '0')}:00`,
      initialEndTime: initialEndTime ?? `${String(settings.startHour + 1).padStart(2, '0')}:00`,
    })
  }

  const handleDeleteItem = (id: string) => {
    const it = items.find((i) => i.id === id)
    if (it && confirm(`Удалить дело «${it.title}»?`)) {
      removeItem(id)
    }
  }

  return (
    <>
      <PageHeader
        title="Распорядок дня"
        action={
          <Button variant="primary" onClick={() => handleOpenCreate()}>
            <Plus size={16} strokeWidth={2} />
            <span>Новое дело</span>
          </Button>
        }
      />

      <div className="mt-4 flex flex-col gap-4">
        {/* Верхние вкладки дней недели: Сегодня, Завтра, 12, 13, 14, 15... */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
            {upcomingTabs.map((tab) => {
              const active = tab.date === selectedDate
              return (
                <button
                  key={tab.date}
                  type="button"
                  onClick={() => setSelectedDate(tab.date)}
                  className={cn(
                    'group relative flex flex-col items-center justify-center min-w-[72px] sm:min-w-[84px] h-[58px] rounded-xl px-3 py-1.5 transition-all duration-150',
                    'border border-line',
                    active
                      ? 'bg-ink text-white shadow-sm border-ink'
                      : 'bg-surface text-ink hover:bg-pill/70 hover:border-line-strong',
                  )}
                >
                  <div className="flex items-center gap-1">
                    <span
                      className={cn(
                        'text-body font-semibold',
                        active ? 'text-white' : 'text-ink',
                      )}
                    >
                      {tab.tabTitle}
                    </span>
                    {tab.isToday && (
                      <span
                        className={cn(
                          'size-1.5 rounded-full',
                          active ? 'bg-accent' : 'bg-accent',
                        )}
                      />
                    )}
                  </div>
                  <span
                    className={cn(
                      'text-[12px] font-medium transition-colors',
                      active ? 'text-white/70' : 'text-muted',
                    )}
                  >
                    {tab.isToday || tab.isTomorrow
                      ? `${tab.dayName}, ${tab.dayNumber}`
                      : tab.dayName}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Подзаголовок выбранного дня и прогресс */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-1 pt-1">
            <div className="flex items-center gap-2">
              <CalendarDays size={16} strokeWidth={1.75} className="text-muted" />
              <span className="text-body font-medium text-ink">
                {selectedTab.fullLabel}
              </span>
              {selectedTab.isToday && (
                <span className="rounded-full bg-accent-soft px-2 py-0.5 text-small font-medium text-accent">
                  Сегодня
                </span>
              )}
            </div>

            {totalCount > 0 ? (
              <div className="flex items-center gap-1.5 text-small text-muted">
                <CalendarDays size={14} strokeWidth={1.75} className="text-muted" />
                <span>
                  Запланировано <strong className="font-semibold text-ink">{totalCount}</strong>{' '}
                  {totalCount === 1 ? 'дело' : totalCount > 1 && totalCount < 5 ? 'дела' : 'дел'}
                </span>
              </div>
            ) : (
              <span className="text-small text-muted">
                Пока нет запланированных дел на этот день
              </span>
            )}
          </div>
        </div>

        {/* Панель настроек сетки времени (начало дня, конец дня, шаг диапазона) */}
        <ScheduleSettingsBar />

        {/* Сетка времени со слотами рядом с сайдбаром */}
        <div className="mt-2 flex flex-col rounded-2xl border border-line bg-surface/30 overflow-hidden">
          {slots.map((slot, index) => {
            const slotItems = slotItemsMap.get(index) ?? []
            const hasItems = slotItems.length > 0

            return (
              <div
                key={slot.startTime}
                className={cn(
                  'group/slot flex items-stretch border-b border-line/80 transition-colors last:border-b-0',
                  slot.isCurrent ? 'bg-accent-soft/20' : 'hover:bg-bg/40',
                )}
              >
                {/* Левая колонка (рядом с сайдбаром): диапазон времени и серая разделительная линия */}
                <div className="flex flex-col justify-start w-36 sm:w-44 shrink-0 py-3.5 px-3.5 border-r border-line">
                  <div className="flex items-center gap-1.5 whitespace-nowrap">
                    <span
                      className={cn(
                        'text-body font-bold tracking-tight tabular-nums',
                        slot.isCurrent ? 'text-accent' : 'text-ink',
                      )}
                    >
                      {slot.startTime} – {slot.endTime}
                    </span>
                  </div>

                  {/* Индикатор «сейчас» */}
                  {slot.isCurrent && (
                    <span className="mt-1.5 inline-flex w-fit items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-white shadow-xs">
                      <span className="size-1.5 animate-pulse rounded-full bg-white" />
                      сейчас
                    </span>
                  )}

                  {/* Кнопка добавления в этот слот */}
                  <button
                    type="button"
                    onClick={() => handleOpenCreate(slot.startTime, slot.endTime)}
                    title={`Запланировать на ${slot.startTime} – ${slot.endTime}`}
                    className="mt-2 inline-flex w-fit items-center gap-1 rounded-md px-1.5 py-0.5 text-[12px] font-medium text-muted transition-colors hover:bg-pill hover:text-ink md:opacity-0 md:group-hover/slot:opacity-100"
                  >
                    <Plus size={13} strokeWidth={2} />
                    <span>Добавить</span>
                  </button>
                </div>

                {/* Правая область: список дел в этом диапазоне */}
                <div className="flex flex-1 flex-col gap-2 p-3">
                  {hasItems ? (
                    slotItems.map((item) => (
                      <ScheduleItemCard
                        key={item.id}
                        item={item}
                        onEdit={(it) => setModalState({ mode: 'edit', item: it })}
                        onDelete={handleDeleteItem}
                      />
                    ))
                  ) : (
                    /* Если пока пусто: чистый спокойный интервал */
                    <button
                      type="button"
                      onClick={() => handleOpenCreate(slot.startTime, slot.endTime)}
                      className={cn(
                        'group/empty flex min-h-[38px] w-full items-center justify-between rounded-xl border border-dashed border-line/80 bg-surface/20 px-4 py-1.5 text-left transition-all',
                        'hover:border-accent hover:bg-surface/80 hover:shadow-xs',
                      )}
                    >
                      <span className="text-small text-muted/60 transition-colors group-hover/empty:text-muted">
                        Свободно
                      </span>
                      <span className="flex items-center gap-1 text-small font-medium text-muted opacity-0 transition-all group-hover/empty:opacity-100 group-hover/empty:text-accent">
                        <Plus size={13} strokeWidth={2} />
                        <span>Запланировать</span>
                      </span>
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Модальное окно создания / редактирования дела */}
      {modalState.mode !== 'closed' && (
        <ScheduleItemModal
          mode={modalState.mode}
          initialDate={modalState.mode === 'create' ? modalState.date : modalState.item.date}
          initialStartTime={modalState.mode === 'create' ? modalState.initialStartTime : modalState.item.startTime}
          initialEndTime={modalState.mode === 'create' ? modalState.initialEndTime : modalState.item.endTime}
          itemToEdit={modalState.mode === 'edit' ? modalState.item : undefined}
          onClose={() => setModalState({ mode: 'closed' })}
        />
      )}
    </>
  )
}
