import { Columns2, History, Plus, Rows3 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { PageHeader } from '../../components/layout/PageHeader'
import { Button } from '../../components/ui/Button'
import { Card, EmptyState } from '../../components/ui/Card'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { SegmentedControl } from '../../components/ui/SegmentedControl'
import { PERIOD_OPTIONS } from '../../lib/constants'
import { getMonthDays, getWeekDays, periodLabel, periodStartKey } from '../../lib/dates'
import { averageProgress, isGoalDone, sortGoals } from '../../lib/progress'
import { cn } from '../../lib/utils'
import { useCategories } from '../../stores/categories'
import { useGoals } from '../../stores/goals'
import type { Goal, GoalType, Period } from '../../types/models'
import { DailyGoalsView, type GoalsViewMode } from './DailyGoalsView'
import { GoalCard } from './GoalCard'
import { GoalForm } from './GoalForm'
import { GoalsHistoryModal } from './GoalsHistoryModal'

const DAILY_VIEW_MODE_STORAGE_KEY = 'planner:v1:goals-view-mode:daily'
const GENERAL_VIEW_MODE_STORAGE_KEY = 'planner:v1:goals-view-mode:general'
const LEGACY_VIEW_MODE_STORAGE_KEY = 'planner:v1:goals-view-mode'

const SUMMARY_TITLE: Record<Period, string> = {
  day: 'Прогресс дня',
  week: 'Прогресс недели',
  month: 'Прогресс месяца',
  year: 'Прогресс года',
}

const EMPTY_TEXT: Record<Period, string> = {
  day: 'На сегодня целей пока нет',
  week: 'На эту неделю общих целей пока нет',
  month: 'На этот месяц общих целей пока нет',
  year: 'На этот год целей пока нет',
}

const SUB_TAB_OPTIONS: { value: GoalType; label: string }[] = [
  { value: 'daily', label: 'Ежедневные цели' },
  { value: 'general', label: 'Общие цели' },
]

const isPeriod = (v: string | null): v is Period =>
  v === 'day' || v === 'week' || v === 'month' || v === 'year'

type FormState =
  | { mode: 'closed' }
  | { mode: 'create'; initialType?: GoalType; initialCategoryId?: string }
  | { mode: 'edit'; goal: Goal }

export function GoalsPage() {
  const [params, setParams] = useSearchParams()
  const rawPeriod = params.get('period')
  const period: Period = isPeriod(rawPeriod) ? rawPeriod : 'week'

  // Подвкладки доступны для недели и месяца
  const hasSubTabs = period === 'week' || period === 'month'
  const rawType = params.get('type')
  const subTab: GoalType = hasSubTabs && rawType === 'general' ? 'general' : 'daily'

  const goals = useGoals((s) => s.goals)
  const categories = useCategories((s) => s.categories)
  const [form, setForm] = useState<FormState>({ mode: 'closed' })
  const [historyOpen, setHistoryOpen] = useState(false)
  // Раздельный режим отображения для ежедневных и общих целей
  const [dailyViewMode, setDailyViewMode] = useState<GoalsViewMode>(() => {
    try {
      const saved = localStorage.getItem(DAILY_VIEW_MODE_STORAGE_KEY)
      if (saved === 'grid' || saved === 'list') return saved
      // Fallback к предыдущему общему ключу, если был установлен
      const legacy = localStorage.getItem(LEGACY_VIEW_MODE_STORAGE_KEY)
      return legacy === 'grid' ? 'grid' : 'list'
    } catch {
      return 'list'
    }
  })

  const [generalViewMode, setGeneralViewMode] = useState<GoalsViewMode>(() => {
    try {
      const saved = localStorage.getItem(GENERAL_VIEW_MODE_STORAGE_KEY)
      if (saved === 'grid' || saved === 'list') return saved
      return 'list'
    } catch {
      return 'list'
    }
  })

  // Текущий режим отображения зависит от активной подвкладки
  const viewMode: GoalsViewMode = hasSubTabs && subTab === 'daily' ? dailyViewMode : generalViewMode

  const changeViewMode = (mode: GoalsViewMode) => {
    if (hasSubTabs && subTab === 'daily') {
      setDailyViewMode(mode)
      try {
        localStorage.setItem(DAILY_VIEW_MODE_STORAGE_KEY, mode)
      } catch {
        // ignore
      }
    } else {
      setGeneralViewMode(mode)
      try {
        localStorage.setItem(GENERAL_VIEW_MODE_STORAGE_KEY, mode)
      } catch {
        // ignore
      }
    }
  }

  const startKey = periodStartKey(period)

  // Список дней для подсчета прогресса ежедневных целей
  const currentPeriodDays = useMemo(() => {
    return period === 'month' ? getMonthDays() : getWeekDays()
  }, [period])

  const currentPeriodDates = useMemo(() => currentPeriodDays.map((d) => d.date), [currentPeriodDays])

  // Все активные цели текущего периода
  const periodGoals = useMemo(
    () =>
      sortGoals(
        goals.filter((g) => !g.deletedAt && g.period === period && g.periodStart === startKey),
        categories,
      ),
    [goals, period, startKey, categories],
  )

  // Разделение на Ежедневные (рутина с 7 тиками) и Общие цели
  const dailyGoals = useMemo(
    () => periodGoals.filter((g) => g.goalType === 'daily'),
    [periodGoals],
  )

  const generalGoals = useMemo(
    () => periodGoals.filter((g) => g.goalType !== 'daily'),
    [periodGoals],
  )

  const deletedCount = useMemo(() => goals.filter((g) => Boolean(g.deletedAt)).length, [goals])
  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])

  // Группировка общих целей по категориям (для режима «По 2 категории в ряд»)
  const generalByCategory = useMemo(() => {
    const map = new Map<string, Goal[]>()
    for (const g of generalGoals) {
      const list = map.get(g.categoryId) || []
      list.push(g)
      map.set(g.categoryId, list)
    }
    return categories
      .map((category) => ({ category, goals: map.get(category.id) || [] }))
      .filter((item) => item.goals.length > 0)
  }, [generalGoals, categories])

  // Расчёт прогресса в зависимости от выбранной вкладки
  const { progress, progressSubtitle } = useMemo(() => {
    if (!hasSubTabs || subTab === 'general') {
      const prog = averageProgress(generalGoals)
      const done = generalGoals.filter((g) => isGoalDone(g)).length
      return {
        progress: prog,
        progressSubtitle: `${periodLabel(period)}${generalGoals.length > 0 ? ` · выполнено ${done} из ${generalGoals.length}` : ''}`,
      }
    } else {
      // Для ежедневных целей: сколько тиков проставлено из всех возможных
      let checkedCount = 0
      const totalPossible = dailyGoals.length * currentPeriodDates.length

      for (const g of dailyGoals) {
        const hist = g.dailyHistory || {}
        for (const d of currentPeriodDates) {
          if (hist[d]) checkedCount++
        }
      }

      const prog = totalPossible > 0 ? Math.round((checkedCount / totalPossible) * 100) : 0
      return {
        progress: prog,
        progressSubtitle: `${periodLabel(period)}${dailyGoals.length > 0 ? ` · отмечено ${checkedCount} из ${totalPossible} дней` : ''}`,
      }
    }
  }, [hasSubTabs, subTab, generalGoals, dailyGoals, currentPeriodDates, period])

  const setPeriod = (p: Period) => {
    const nextParams: Record<string, string> = { period: p }
    if (p === 'week' || p === 'month') {
      nextParams.type = subTab
    }
    setParams(nextParams, { replace: true })
  }

  const setSubTab = (t: GoalType) => {
    setParams({ period, type: t }, { replace: true })
  }

  // Горячая клавиша N — новая цель
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (form.mode !== 'closed' || historyOpen || e.metaKey || e.ctrlKey || e.altKey) return
      const target = e.target as HTMLElement
      if (target.closest('input, textarea, [contenteditable="true"]')) return
      if (e.code === 'KeyN') {
        e.preventDefault()
        setForm({ mode: 'create', initialType: hasSubTabs ? subTab : 'general' })
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [form.mode, historyOpen, hasSubTabs, subTab])

  const periodTabs = (
    <SegmentedControl label="Период целей" options={PERIOD_OPTIONS} value={period} onChange={setPeriod} />
  )

  const viewToggle = (
    <div
      role="radiogroup"
      aria-label="Вид отображения целей"
      className="hidden items-center gap-0.5 rounded-full border border-line bg-surface p-0.5 md:flex"
    >
      <button
        type="button"
        role="radio"
        aria-checked={viewMode === 'list'}
        onClick={() => changeViewMode('list')}
        title="Один столбец (длинный ряд)"
        className={cn(
          'inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-small transition-colors',
          viewMode === 'list' ? 'bg-pill font-medium text-ink' : 'text-muted hover:text-ink',
        )}
      >
        <Rows3 size={14} strokeWidth={1.75} />
        <span>В 1 ряд</span>
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={viewMode === 'grid'}
        onClick={() => changeViewMode('grid')}
        title="По 2 блока в ряд"
        className={cn(
          'inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-small transition-colors',
          viewMode === 'grid' ? 'bg-pill font-medium text-ink' : 'text-muted hover:text-ink',
        )}
      >
        <Columns2 size={14} strokeWidth={1.75} />
        <span>По 2 в ряд</span>
      </button>
    </div>
  )

  return (
    <div className="pb-20 md:pb-0">
      <PageHeader
        title="Цели"
        action={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => setHistoryOpen(true)} title="Корзина и история целей">
              <History size={16} strokeWidth={1.75} />
              <span>История</span>
              {deletedCount > 0 && (
                <span className="ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-pill px-1.5 text-small font-medium text-ink tabular-nums">
                  {deletedCount}
                </span>
              )}
            </Button>
            <Button
              onClick={() => setForm({ mode: 'create', initialType: hasSubTabs ? subTab : 'general' })}
              title="Новая цель (N)"
            >
              <Plus size={16} strokeWidth={2} />
              Новая цель
            </Button>
          </div>
        }
      />

      {/* Десктоп: переключатель периодов (День, Неделя, Месяц, Год) + вид отображения */}
      <div className="mt-4 hidden items-center justify-between gap-4 md:flex">
        {periodTabs}
        {viewToggle}
      </div>

      {/* Подвкладки (Ежедневные цели / Общие цели) для недели и месяца */}
      {hasSubTabs && (
        <div className="mt-3 flex items-center justify-between gap-3 border-b border-line pb-2.5">
          <SegmentedControl
            label="Подраздел целей"
            options={SUB_TAB_OPTIONS}
            value={subTab}
            onChange={(v) => setSubTab(v as GoalType)}
            className="bg-bg/80 p-0.5"
          />

          <span className="text-small text-muted">
            {subTab === 'daily'
              ? `${dailyGoals.length} ${dailyGoals.length === 1 ? 'привычка' : dailyGoals.length < 5 ? 'привычки' : 'привычек'}`
              : `${generalGoals.length} ${generalGoals.length === 1 ? 'цель' : generalGoals.length < 5 ? 'цели' : 'целей'}`}
          </span>
        </div>
      )}

      {/* Карточка суммарного прогресса */}
      <Card className="mt-3.5 px-5 py-4">
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            <div className="text-body font-medium">
              {SUMMARY_TITLE[period]} {hasSubTabs && (subTab === 'daily' ? '· Ежедневные' : '· Общие')}
            </div>
            <div className="mt-0.5 text-small text-muted">{progressSubtitle}</div>
          </div>
          <div className="text-title font-semibold tabular-nums">{progress}%</div>
        </div>
        <ProgressBar value={progress} className="mt-3" label={SUMMARY_TITLE[period]} />
      </Card>

      {/* Основной контент: либо Ежедневные с 7 тиками, либо Общие цели */}
      <div className="mt-5">
        {hasSubTabs && subTab === 'daily' ? (
          <DailyGoalsView
            goals={dailyGoals}
            categories={categories}
            period={period}
            viewMode={viewMode}
            onAddGoal={(categoryId) => setForm({ mode: 'create', initialType: 'daily', initialCategoryId: categoryId })}
            onEditGoal={(goal) => setForm({ mode: 'edit', goal })}
          />
        ) : generalGoals.length === 0 ? (
          <EmptyState
            title={EMPTY_TEXT[period]}
            action={
              <Button
                variant="secondary"
                onClick={() => setForm({ mode: 'create', initialType: 'general' })}
              >
                <Plus size={16} strokeWidth={2} />
                Новая цель
              </Button>
            }
          />
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2 lg:gap-7">
            {generalByCategory.map(({ category, goals: catGoals }) => (
              <section key={category.id} className="min-w-0 flex flex-col gap-3">
                <div className="flex items-center gap-2.5 px-1">
                  <span className="text-small font-medium text-muted">{category.name}</span>
                  <span className="text-small text-muted">· {catGoals.length}</span>
                </div>
                <div className="flex flex-col gap-3">
                  {catGoals.map((goal) => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      category={category}
                      onEdit={() => setForm({ mode: 'edit', goal })}
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() => setForm({ mode: 'create', initialType: 'general', initialCategoryId: category.id })}
                    title={`Добавить цель в категорию «${category.name}»`}
                    className="group flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line-strong/60 py-2.5 text-small font-medium text-muted transition-all hover:border-accent hover:bg-surface hover:text-accent"
                  >
                    <span className="flex size-5 items-center justify-center rounded-full bg-pill text-ink transition-colors group-hover:bg-accent group-hover:text-white">
                      <Plus size={13} strokeWidth={2.5} />
                    </span>
                    <span>Добавить цель</span>
                  </button>
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3.5">
            {generalGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                category={categoryById.get(goal.categoryId)}
                onEdit={() => setForm({ mode: 'edit', goal })}
              />
            ))}
            <button
              type="button"
              onClick={() => setForm({ mode: 'create', initialType: 'general' })}
              title="Добавить общую цель"
              className="group flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line-strong/60 py-3 text-small font-medium text-muted transition-all hover:border-accent hover:bg-surface hover:text-accent"
            >
              <span className="flex size-5 items-center justify-center rounded-full bg-pill text-ink transition-colors group-hover:bg-accent group-hover:text-white">
                <Plus size={13} strokeWidth={2.5} />
              </span>
              <span>Добавить цель</span>
            </button>
          </div>
        )}
      </div>

      {/* Телефон: нижняя панель периодов */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-bg px-3 pt-2 pb-[max(8px,env(safe-area-inset-bottom))] md:hidden">
        <SegmentedControl label="Период целей" options={PERIOD_OPTIONS} value={period} onChange={setPeriod} stretch />
      </div>

      {form.mode !== 'closed' && (
        <GoalForm
          goal={form.mode === 'edit' ? form.goal : undefined}
          defaultPeriod={period}
          initialGoalType={form.mode === 'create' ? form.initialType : undefined}
          initialCategoryId={form.mode === 'create' ? form.initialCategoryId : undefined}
          onClose={() => setForm({ mode: 'closed' })}
        />
      )}

      {historyOpen && <GoalsHistoryModal onClose={() => setHistoryOpen(false)} />}
    </div>
  )
}
