import { parseISO } from 'date-fns'
import { ArrowRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Checkbox } from '../../components/ui/Checkbox'
import { Modal } from '../../components/ui/Modal'
import { Tag } from '../../components/ui/Tag'
import { PRIORITY_STYLES } from '../../lib/constants'
import { getWeekDays, periodLabel } from '../../lib/dates'
import { goalDuplicateKey, goalProgress, isGoalDone, sortGoals } from '../../lib/progress'
import { cn } from '../../lib/utils'
import { useGoals } from '../../stores/goals'
import type { Category, Goal, GoalType, ISODate } from '../../types/models'

interface CarryOverGoalsModalProps {
  sourceWeekStart: ISODate
  targetWeekStart: ISODate
  sourceGoals: Goal[]
  currentWeekGoals: Goal[]
  categories: Category[]
  initialFocusType?: GoalType
  onClose: () => void
}

export function CarryOverGoalsModal({
  sourceWeekStart,
  targetWeekStart,
  sourceGoals,
  currentWeekGoals,
  categories,
  initialFocusType = 'daily',
  onClose,
}: CarryOverGoalsModalProps) {
  const carryOverToWeek = useGoals((s) => s.carryOverToWeek)
  const removeMany = useGoals((s) => s.removeMany)

  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])
  const validCategoryIds = useMemo(() => new Set(categories.map((c) => c.id)), [categories])

  const existingByKey = useMemo(() => {
    const map = new Map<string, Goal[]>()
    for (const g of currentWeekGoals) {
      const k = goalDuplicateKey(g)
      const list = map.get(k) ?? []
      list.push(g)
      map.set(k, list)
    }
    return map
  }, [currentWeekGoals])

  const sourceWeekDates = useMemo(
    () => getWeekDays(parseISO(sourceWeekStart)).map((d) => d.date),
    [sourceWeekStart],
  )

  const { dailyList, generalList } = useMemo(() => {
    const sorted = sortGoals(sourceGoals, categories)
    return {
      dailyList: sorted.filter((g) => g.goalType === 'daily'),
      generalList: sorted.filter((g) => g.goalType !== 'daily'),
    }
  }, [sourceGoals, categories])

  const hasAlreadyCarried = useMemo(
    () => sourceGoals.some((g) => existingByKey.has(goalDuplicateKey(g))),
    [sourceGoals, existingByKey],
  )

  // Если часть целей уже перенесена — отмечаем именно те, что есть на текущей неделе (чтобы можно было снять галочку и убрать).
  // Если ещё ничего не перенесено — по умолчанию отмечаем ежедневные и незавершённые общие.
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    const initial = new Set<string>()
    for (const g of sourceGoals) {
      const inCurrent = existingByKey.has(goalDuplicateKey(g))
      if (hasAlreadyCarried) {
        if (inCurrent) initial.add(g.id)
      } else if (g.goalType === 'daily' || !isGoalDone(g)) {
        initial.add(g.id)
      }
    }
    return initial
  })

  const toggleGoal = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSection = (list: Goal[]) => {
    const allSelected = list.length > 0 && list.every((g) => selectedIds.has(g.id))
    setSelectedIds((prev) => {
      const next = new Set(prev)
      for (const g of list) {
        if (allSelected) next.delete(g.id)
        else next.add(g.id)
      }
      return next
    })
  }

  const { toAdd, toRemoveIds, removedGoalCount } = useMemo(() => {
    const add: Goal[] = []
    const removeIds: string[] = []
    let removedSources = 0

    for (const g of sourceGoals) {
      const key = goalDuplicateKey(g)
      const existing = existingByKey.get(key)
      const isSelected = selectedIds.has(g.id)

      if (isSelected && !existing) {
        add.push(g)
      } else if (!isSelected && existing) {
        removedSources++
        for (const item of existing) removeIds.push(item.id)
      }
    }

    return { toAdd: add, toRemoveIds: removeIds, removedGoalCount: removedSources }
  }, [sourceGoals, existingByKey, selectedIds])

  const hasChanges = toAdd.length > 0 || toRemoveIds.length > 0

  const handleConfirm = () => {
    if (!hasChanges) return
    if (toAdd.length > 0) {
      carryOverToWeek(toAdd, targetWeekStart, validCategoryIds, categories[0]?.id)
    }
    if (toRemoveIds.length > 0) {
      removeMany(toRemoveIds)
    }
    onClose()
  }

  const sourceLabel = periodLabel('week', parseISO(sourceWeekStart))
  const targetLabel = periodLabel('week', parseISO(targetWeekStart))

  const sections = (
    initialFocusType === 'general'
      ? [
          { key: 'general' as const, title: 'Общие цели → в общие', list: generalList },
          { key: 'daily' as const, title: 'Ежедневные цели → в ежедневные', list: dailyList },
        ]
      : [
          { key: 'daily' as const, title: 'Ежедневные цели → в ежедневные', list: dailyList },
          { key: 'general' as const, title: 'Общие цели → в общие', list: generalList },
        ]
  ).filter((s) => s.list.length > 0)

  const confirmLabel = !hasChanges
    ? 'Нет изменений'
    : toAdd.length > 0 && removedGoalCount > 0
      ? `Применить (+${toAdd.length}, убрать ${removedGoalCount})`
      : toAdd.length > 0
        ? `Перенести (${toAdd.length})`
        : `Убрать из недели (${removedGoalCount})`

  const onlyRemoving = toAdd.length === 0 && removedGoalCount > 0

  return (
    <Modal
      title="Цели из прошлой недели"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Отмена
          </Button>
          <Button
            variant={onlyRemoving ? 'danger' : 'primary'}
            disabled={!hasChanges}
            onClick={handleConfirm}
            className="ml-auto"
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Период переноса */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-bg/60 px-3.5 py-2.5 text-small">
          <div className="flex items-center gap-2 font-medium text-ink">
            <span>{sourceLabel}</span>
            <ArrowRight size={14} strokeWidth={2} className="text-muted" />
            <span className="text-accent">{targetLabel}</span>
          </div>
          {hasAlreadyCarried && selectedIds.size > 0 ? (
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="font-medium text-rose-ink hover:underline"
            >
              Снять все (убрать из недели)
            </button>
          ) : (
            <span className="text-muted">Прогресс прошлой недели сохранится</span>
          )}
        </div>

        {sections.map((section) => {
          const allSelected =
            section.list.length > 0 && section.list.every((g) => selectedIds.has(g.id))

          return (
            <section key={section.key} className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-0.5">
                <span className="text-small font-semibold text-ink">
                  {section.title}{' '}
                  <span className="font-normal text-muted">({section.list.length})</span>
                </span>
                <button
                  type="button"
                  onClick={() => toggleSection(section.list)}
                  className="text-small font-medium text-accent hover:underline"
                >
                  {allSelected ? 'Снять все' : 'Выбрать все'}
                </button>
              </div>

              <div className="flex flex-col gap-1.5">
                {section.list.map((goal) => {
                  const alreadyInWeek = existingByKey.has(goalDuplicateKey(goal))
                  const checked = selectedIds.has(goal.id)
                  const willRemove = alreadyInWeek && !checked
                  const category = categoryById.get(goal.categoryId)
                  const pStyle = PRIORITY_STYLES[goal.priority || 'medium'] || PRIORITY_STYLES.medium
                  const isDaily = goal.goalType === 'daily'
                  const doneDays = isDaily
                    ? sourceWeekDates.filter((d) => Boolean(goal.dailyHistory?.[d])).length
                    : 0
                  const doneGeneral = !isDaily && isGoalDone(goal)
                  const progress = isDaily ? 0 : goalProgress(goal)

                  return (
                    <div
                      key={goal.id}
                      onClick={() => toggleGoal(goal.id)}
                      className={cn(
                        'flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors',
                        willRemove
                          ? 'border-priority-ink/30 bg-priority-bg/40'
                          : checked
                            ? 'border-accent/40 bg-accent-soft/20'
                            : 'border-line bg-surface hover:border-line-strong',
                      )}
                    >
                      <Checkbox
                        checked={checked}
                        onChange={() => toggleGoal(goal.id)}
                        label={
                          alreadyInWeek
                            ? `Оставить на этой неделе: ${goal.title}`
                            : `Перенести на эту неделю: ${goal.title}`
                        }
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={cn(
                              'inline-flex max-w-full items-center gap-1.5 truncate rounded-md border px-2 py-0.5 text-small font-medium',
                              pStyle.badge,
                              willRemove && 'opacity-60 line-through',
                            )}
                          >
                            <span className={cn('size-2 shrink-0 rounded-[2px]', pStyle.dot)} />
                            <span className="truncate">{goal.title}</span>
                          </span>
                          {category && <Tag color={category.color}>{category.name}</Tag>}
                          {alreadyInWeek && checked && (
                            <span className="rounded-md bg-pill px-1.5 py-0.5 text-[11px] font-medium text-muted">
                              В этой неделе
                            </span>
                          )}
                        </div>

                        <div className="mt-1 text-[12px] text-muted">
                          {willRemove ? (
                            <span className="font-medium text-priority-ink">
                              Будет убрана из этой недели (в корзину)
                            </span>
                          ) : alreadyInWeek ? (
                            <span>Снимите галочку, чтобы убрать из этой недели</span>
                          ) : isDaily ? (
                            <span>
                              На прошлой неделе: {doneDays} из {sourceWeekDates.length} дн.
                            </span>
                          ) : doneGeneral ? (
                            <span>Была выполнена · при переносе начнётся заново</span>
                          ) : goal.subgoals.length > 0 ? (
                            <span>Прогресс {progress}% · шаги сохранятся</span>
                          ) : (
                            <span>Не выполнена · перенесётся в новую неделю</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
    </Modal>
  )
}
