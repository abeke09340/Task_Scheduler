import { Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { PageHeader } from '../../components/layout/PageHeader'
import { Button } from '../../components/ui/Button'
import { Card, EmptyState } from '../../components/ui/Card'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { SegmentedControl } from '../../components/ui/SegmentedControl'
import { PERIOD_OPTIONS } from '../../lib/constants'
import { periodLabel, periodStartKey } from '../../lib/dates'
import { averageProgress, isGoalDone, sortGoals } from '../../lib/progress'
import { useCategories } from '../../stores/categories'
import { useGoals } from '../../stores/goals'
import type { Goal, Period } from '../../types/models'
import { GoalCard } from './GoalCard'
import { GoalForm } from './GoalForm'

const SUMMARY_TITLE: Record<Period, string> = {
  day: 'Прогресс дня',
  week: 'Прогресс недели',
  month: 'Прогресс месяца',
  year: 'Прогресс года',
}

const EMPTY_TEXT: Record<Period, string> = {
  day: 'На сегодня целей пока нет',
  week: 'На эту неделю целей пока нет',
  month: 'На этот месяц целей пока нет',
  year: 'На этот год целей пока нет',
}

const isPeriod = (v: string | null): v is Period =>
  v === 'day' || v === 'week' || v === 'month' || v === 'year'

type FormState = { mode: 'closed' } | { mode: 'create' } | { mode: 'edit'; goal: Goal }

export function GoalsPage() {
  const [params, setParams] = useSearchParams()
  const rawPeriod = params.get('period')
  const period: Period = isPeriod(rawPeriod) ? rawPeriod : 'week'

  const goals = useGoals((s) => s.goals)
  const categories = useCategories((s) => s.categories)
  const [form, setForm] = useState<FormState>({ mode: 'closed' })

  const startKey = periodStartKey(period)
  const visible = useMemo(
    () => sortGoals(goals.filter((g) => g.period === period && g.periodStart === startKey), categories),
    [goals, period, startKey, categories],
  )
  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])
  const progress = averageProgress(visible)
  const doneCount = visible.filter(isGoalDone).length

  const setPeriod = (p: Period) => setParams({ period: p }, { replace: true })

  // Горячая клавиша N — новая цель (работает в любой раскладке)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (form.mode !== 'closed' || e.metaKey || e.ctrlKey || e.altKey) return
      const target = e.target as HTMLElement
      if (target.closest('input, textarea, [contenteditable="true"]')) return
      if (e.code === 'KeyN') {
        e.preventDefault()
        setForm({ mode: 'create' })
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [form.mode])

  const periodTabs = (
    <SegmentedControl label="Период целей" options={PERIOD_OPTIONS} value={period} onChange={setPeriod} />
  )

  return (
    <div className="pb-20 md:pb-0">
      <PageHeader
        title="Цели"
        action={
          <Button onClick={() => setForm({ mode: 'create' })} title="Новая цель (N)">
            <Plus size={16} strokeWidth={2} />
            Новая цель
          </Button>
        }
      />

      {/* Десктоп: переключатель под заголовком */}
      <div className="mt-4 hidden md:block">{periodTabs}</div>

      <Card className="mt-4 px-5 py-4 md:mt-5">
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            <div className="text-body">{SUMMARY_TITLE[period]}</div>
            <div className="mt-0.5 text-small text-muted">
              {periodLabel(period)}
              {visible.length > 0 && ` · выполнено ${doneCount} из ${visible.length}`}
            </div>
          </div>
          <div className="text-title font-medium tabular-nums">{progress}%</div>
        </div>
        <ProgressBar value={progress} className="mt-3" label={SUMMARY_TITLE[period]} />
      </Card>

      <div className="mt-3 flex flex-col gap-2.5">
        {visible.length === 0 ? (
          <EmptyState
            title={EMPTY_TEXT[period]}
            action={
              <Button variant="secondary" onClick={() => setForm({ mode: 'create' })}>
                <Plus size={16} strokeWidth={2} />
                Новая цель
              </Button>
            }
          />
        ) : (
          visible.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              category={categoryById.get(goal.categoryId)}
              onEdit={() => setForm({ mode: 'edit', goal })}
            />
          ))
        )}
      </div>

      {/* Телефон: переключатель закреплён внизу, под большим пальцем */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-bg px-3 pt-2 pb-[max(8px,env(safe-area-inset-bottom))] md:hidden">
        <SegmentedControl label="Период целей" options={PERIOD_OPTIONS} value={period} onChange={setPeriod} stretch />
      </div>

      {form.mode !== 'closed' && (
        <GoalForm
          goal={form.mode === 'edit' ? form.goal : undefined}
          defaultPeriod={period}
          onClose={() => setForm({ mode: 'closed' })}
        />
      )}
    </div>
  )
}

