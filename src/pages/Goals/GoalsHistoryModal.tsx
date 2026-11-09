import { format, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'
import { RotateCcw, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button, IconButton } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { SegmentedControl } from '../../components/ui/SegmentedControl'
import { Tag } from '../../components/ui/Tag'
import { PERIOD_OPTIONS, PRIORITY_STYLES } from '../../lib/constants'
import { goalProgress } from '../../lib/progress'
import { cn } from '../../lib/utils'
import { useCategories } from '../../stores/categories'
import { useGoals } from '../../stores/goals'
import type { Period } from '../../types/models'

type HistoryTab = 'trash' | 'completed'

const PERIOD_MAP: Record<Period, string> = Object.fromEntries(
  PERIOD_OPTIONS.map((o) => [o.value, o.label]),
) as Record<Period, string>

function formatTimestamp(iso?: string): string {
  if (!iso) return ''
  try {
    return format(parseISO(iso), 'd MMM в HH:mm', { locale: ru })
  } catch {
    return ''
  }
}

export function GoalsHistoryModal({ onClose }: { onClose: () => void }) {
  const goals = useGoals((s) => s.goals)
  const restore = useGoals((s) => s.restore)
  const hardRemove = useGoals((s) => s.hardRemove)
  const clearTrash = useGoals((s) => s.clearTrash)
  const categories = useCategories((s) => s.categories)

  const [tab, setTab] = useState<HistoryTab>('trash')
  const [confirmClear, setConfirmClear] = useState(false)

  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])

  const deletedGoals = useMemo(
    () =>
      goals
        .filter((g) => Boolean(g.deletedAt))
        .sort((a, b) => (b.deletedAt ?? '').localeCompare(a.deletedAt ?? '')),
    [goals],
  )

  const completedGoals = useMemo(
    () =>
      goals
        .filter((g) => !g.deletedAt && Boolean(g.completedAt))
        .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? '')),
    [goals],
  )

  const tabOptions: { value: HistoryTab; label: string }[] = [
    { value: 'trash', label: `Корзина (${deletedGoals.length})` },
    { value: 'completed', label: `Выполненные (${completedGoals.length})` },
  ]

  const items = tab === 'trash' ? deletedGoals : completedGoals

  return (
    <Modal
      title="История целей"
      onClose={onClose}
      footer={
        <>
          {tab === 'trash' &&
            deletedGoals.length > 0 &&
            (confirmClear ? (
              <Button
                variant="danger"
                onClick={() => {
                  clearTrash()
                  setConfirmClear(false)
                }}
              >
                Точно очистить всё?
              </Button>
            ) : (
              <Button variant="danger" onClick={() => setConfirmClear(true)}>
                Очистить корзину
              </Button>
            ))}
          <Button variant="ghost" onClick={onClose} className="ml-auto">
            Закрыть
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <SegmentedControl
          label="Раздел истории"
          options={tabOptions}
          value={tab}
          onChange={(v) => {
            setTab(v)
            setConfirmClear(false)
          }}
          stretch
          className="rounded-full bg-bg p-1"
        />

        {items.length === 0 ? (
          <div className="rounded-xl border border-line bg-bg/50 px-4 py-10 text-center text-body text-muted">
            {tab === 'trash' ? 'Корзина пуста — удалённых целей нет' : 'Пока нет выполненных целей'}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {items.map((goal) => {
              const category = categoryById.get(goal.categoryId)
              const progress = goalProgress(goal)
              const priority = goal.priority || 'medium'
              const pStyle = PRIORITY_STYLES[priority] || PRIORITY_STYLES.medium

              return (
                <div
                  key={goal.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-line bg-bg/40 px-3.5 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          'inline-flex max-w-full items-center gap-1.5 truncate rounded-md border px-2 py-0.5 text-body font-medium transition-colors',
                          pStyle.badge,
                        )}
                        title={`${goal.title} (${pStyle.label})`}
                      >
                        <span className={cn('size-2 shrink-0 rounded-[2px]', pStyle.dot)} />
                        <span className="truncate">{goal.title}</span>
                      </span>
                      {category && <Tag color={category.color}>{category.name}</Tag>}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-small text-muted">
                      <span>{PERIOD_MAP[goal.period]}</span>
                      <span>·</span>
                      <span>Прогресс {progress}%</span>
                      {tab === 'trash' && goal.deletedAt && (
                        <>
                          <span>·</span>
                          <span>Удалено {formatTimestamp(goal.deletedAt)}</span>
                        </>
                      )}
                      {tab === 'completed' && goal.completedAt && (
                        <>
                          <span>·</span>
                          <span>Выполнено {formatTimestamp(goal.completedAt)}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {tab === 'trash' && (
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => restore(goal.id)}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 text-small font-medium text-ink transition-colors hover:bg-pill"
                        title="Восстановить цель"
                      >
                        <RotateCcw size={14} strokeWidth={1.75} />
                        Вернуть
                      </button>
                      <IconButton
                        label={`Удалить навсегда: ${goal.title}`}
                        onClick={() => hardRemove(goal.id)}
                        className="size-8 text-muted hover:bg-priority-bg hover:text-priority-ink"
                      >
                        <Trash2 size={15} strokeWidth={1.75} />
                      </IconButton>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Modal>
  )
}

