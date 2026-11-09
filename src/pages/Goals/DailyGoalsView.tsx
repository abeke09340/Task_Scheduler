import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo } from 'react'
import { Button, IconButton } from '../../components/ui/Button'
import { Checkbox } from '../../components/ui/Checkbox'
import { EmptyState } from '../../components/ui/Card'
import { Tag } from '../../components/ui/Tag'
import { getMonthDays, getWeekDays } from '../../lib/dates'
import { PRIORITY_STYLES } from '../../lib/constants'
import { useGoals } from '../../stores/goals'
import type { Category, Goal, Period } from '../../types/models'
import { cn } from '../../lib/utils'

export type GoalsViewMode = 'list' | 'grid'

interface DailyGoalsViewProps {
  goals: Goal[]
  categories: Category[]
  period: Period
  viewMode: GoalsViewMode
  onAddGoal: (categoryId?: string) => void
  onEditGoal: (goal: Goal) => void
}

export function DailyGoalsView({
  goals,
  categories,
  period,
  viewMode,
  onAddGoal,
  onEditGoal,
}: DailyGoalsViewProps) {
  const toggleDailyDay = useGoals((s) => s.toggleDailyDay)
  const remove = useGoals((s) => s.remove)

  // Получаем дни текущего периода (7 дней для недели или все дни для месяца)
  const days = useMemo(() => {
    return period === 'month' ? getMonthDays() : getWeekDays()
  }, [period])

  // Группируем цели по категориям
  const activeCategories = useMemo(() => {
    const map = new Map<string, Goal[]>()
    for (const goal of goals) {
      const list = map.get(goal.categoryId) || []
      list.push(goal)
      map.set(goal.categoryId, list)
    }
    return categories
      .map((category) => ({ category, goals: map.get(category.id) || [] }))
      .filter((item) => item.goals.length > 0)
  }, [goals, categories])

  // В режиме «По 2 в ряд» размещаем по 2 блока категорий в одном ряду
  const isTwoColCategories = viewMode === 'grid' && period === 'week'

  if (goals.length === 0) {
    return (
      <EmptyState
        title="Ежедневных целей пока нет. Добавьте рутинные дела (чтение, спорт, подъем) для трекинга по дням."
        action={
          <Button variant="secondary" onClick={() => onAddGoal()}>
            <Plus size={16} strokeWidth={2} />
            Добавить ежедневную цель
          </Button>
        }
      />
    )
  }

  return (
    <div
      className={cn(
        isTwoColCategories
          ? 'grid grid-cols-1 items-start gap-6 lg:grid-cols-2 lg:gap-7'
          : 'flex flex-col gap-7',
      )}
    >
      {activeCategories.map(({ category, goals: catGoals }) => (
        <section key={category.id} className="min-w-0 flex flex-col gap-3">
          {/* Заголовок блока категории */}
          <div className="flex items-center gap-2.5 px-1">
            <Tag color={category.color}>{category.name}</Tag>
            <span className="text-small text-muted">
              · {catGoals.length} {catGoals.length === 1 ? 'цель' : catGoals.length < 5 ? 'цели' : 'целей'}
            </span>
          </div>

          {/* Карточка категории со списком её целей */}
          <div className="overflow-hidden rounded-xl border border-line bg-surface">
            {/* Шапка дней недели */}
            {period === 'week' && (
              <div className="hidden items-center justify-between border-b border-line bg-bg/40 px-3.5 py-2 sm:flex">
                <div className="min-w-0 flex-1 pr-2 text-small font-medium text-muted">Цель / Рутина</div>

                {/* 7 колонок дат — компактные отступы для освобождения места под название */}
                <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
                  {days.map((d) => (
                    <div
                      key={d.date}
                      className={cn(
                        'flex w-6 sm:w-6.5 flex-col items-center justify-center rounded-md py-0.5 text-center transition-colors',
                        d.isToday && 'bg-accent/15 font-semibold text-accent',
                      )}
                    >
                      <span className={cn('text-[10px] sm:text-[11px] leading-tight', d.isToday ? 'text-accent' : 'text-muted')}>
                        {d.dayName}
                      </span>
                      <span className="text-[11px] sm:text-[12px] leading-tight font-medium">{d.dayNumber}</span>
                    </div>
                  ))}
                </div>

                {/* Компактный спейсер под правый блок */}
                <div className="ml-2.5 w-[84px] shrink-0 pl-2.5" />
              </div>
            )}

            <div className="divide-y divide-line">
              {catGoals.map((goal) => {
                const history = goal.dailyHistory || {}
                const completedDays = days.filter((d) => Boolean(history[d.date])).length
                const priority = goal.priority || 'medium'
                const pStyle = PRIORITY_STYLES[priority] || PRIORITY_STYLES.medium

                return (
                  <div
                    key={goal.id}
                    className="group flex flex-col justify-between gap-2.5 px-3.5 py-3 sm:flex-row sm:items-center"
                  >
                    {/* Название и детали с цветной плашкой-квадратом по приоритету */}
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="flex items-center">
                        <span
                          className={cn(
                            'inline-flex max-w-full items-center gap-1.5 rounded-md border px-2 py-0.5 text-body font-medium transition-colors',
                            pStyle.badge,
                          )}
                          title={`${goal.title} (${pStyle.label})`}
                        >
                          <span className={cn('size-2 shrink-0 rounded-[2px]', pStyle.dot)} />
                          <span className="truncate">{goal.title}</span>
                        </span>
                      </div>
                      {goal.description && (
                        <p className="mt-1 truncate text-small text-muted">{goal.description}</p>
                      )}
                      <div className="mt-1 flex items-center gap-2 text-small text-muted sm:hidden">
                        <span>
                          {completedDays} из {days.length} дней
                        </span>
                      </div>
                    </div>

                    {/* Квадратные тики по дням + отдалённый счётчик справа */}
                    <div className="flex items-center justify-between overflow-x-auto pb-1 sm:justify-end sm:overflow-visible sm:pb-0">
                      <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
                        {days.map((d) => {
                          const isChecked = Boolean(history[d.date])
                          return (
                            <div
                              key={d.date}
                              className="flex w-6 sm:w-6.5 flex-col items-center justify-center gap-1"
                              title={`${d.dayName}, ${d.dayNumber}`}
                            >
                              <span
                                className={cn(
                                   'text-[10px] leading-none sm:hidden',
                                  d.isToday ? 'font-bold text-accent' : 'text-muted',
                                )}
                              >
                                {d.dayName}
                              </span>

                              <Checkbox
                                checked={isChecked}
                                onChange={() => toggleDailyDay(goal.id, d.date)}
                                label={`${goal.title} за ${d.dayName} ${d.dayNumber}`}
                                size="md"
                              />
                            </div>
                          )
                        })}
                      </div>

                      {/* Правый блок: отдалён от последнего квадратика (ml-2.5 + pl-2.5 + разделитель) */}
                      <div className="ml-2.5 flex w-[84px] shrink-0 items-center justify-between border-l border-line pl-2.5">
                        <span className="text-small font-medium text-muted tabular-nums">
                          {completedDays}/{days.length}
                        </span>

                        <div className="flex items-center gap-0.5">
                          <IconButton
                            label="Редактировать цель"
                            onClick={() => onEditGoal(goal)}
                            className="size-7 opacity-70 group-hover:opacity-100 hover:text-ink"
                          >
                            <Pencil size={13} strokeWidth={1.75} />
                          </IconButton>
                          <IconButton
                            label="В корзину"
                            onClick={() => remove(goal.id)}
                            className="size-7 opacity-70 group-hover:opacity-100 hover:bg-priority-bg hover:text-priority-ink"
                          >
                            <Trash2 size={13} strokeWidth={1.75} />
                          </IconButton>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Быстрый доступ: плюсик после последней записи в блоке */}
              <div className="p-2 sm:px-4 sm:py-2.5 bg-bg/20">
                <button
                  type="button"
                  onClick={() => onAddGoal(category.id)}
                  title={`Добавить цель в категорию «${category.name}»`}
                  className="group/btn flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-line-strong/70 py-2 text-small font-medium text-muted transition-all hover:border-accent hover:bg-surface hover:text-accent"
                >
                  <span className="flex size-5 items-center justify-center rounded-full bg-pill text-ink transition-colors group-hover/btn:bg-accent group-hover/btn:text-white">
                    <Plus size={13} strokeWidth={2.5} />
                  </span>
                  <span>Добавить цель</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      ))}
    </div>
  )
}
