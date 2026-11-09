import { CalendarClock, Flag, Pencil, Plus, X } from 'lucide-react'
import { useState } from 'react'
import { Checkbox } from '../../components/ui/Checkbox'
import { IconButton } from '../../components/ui/Button'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { Tag } from '../../components/ui/Tag'
import { deadlineInfo } from '../../lib/dates'
import { goalProgress, isGoalDone } from '../../lib/progress'
import { cn } from '../../lib/utils'
import { useGoals } from '../../stores/goals'
import type { Category, Goal } from '../../types/models'

interface GoalCardProps {
  goal: Goal
  category?: Category
  onEdit: () => void
}

export function GoalCard({ goal, category, onEdit }: GoalCardProps) {
  const toggle = useGoals((s) => s.toggle)
  const toggleSubgoal = useGoals((s) => s.toggleSubgoal)
  const addSubgoal = useGoals((s) => s.addSubgoal)
  const removeSubgoal = useGoals((s) => s.removeSubgoal)

  const [expanded, setExpanded] = useState(false)
  const [draft, setDraft] = useState('')

  const done = isGoalDone(goal)
  const progress = goalProgress(goal)
  const deadline = goal.deadline ? deadlineInfo(goal.deadline) : null
  const doneSteps = goal.subgoals.filter((s) => s.done).length

  return (
    <article
      className={cn(
        'rounded-xl border bg-surface transition-colors duration-150',
        expanded ? 'border-line-strong/70' : 'border-line hover:border-line-strong/60',
      )}
    >
      {/* Свёрнутая часть: всегда видна */}
      <div
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onClick={() => setExpanded((v) => !v)}
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget) return
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setExpanded((v) => !v)
          }
        }}
        className="cursor-pointer rounded-xl px-4 pt-3.5 pb-3 focus-visible:outline-offset-[-2px]"
      >
        <div className="flex items-center gap-3">
          <Checkbox
            checked={done}
            onChange={() => toggle(goal.id)}
            label={done ? `Снять отметку: ${goal.title}` : `Отметить выполненной: ${goal.title}`}
          />
          <h3
            className={cn(
              'min-w-0 flex-1 truncate text-body transition-colors',
              done ? 'text-muted line-through decoration-muted/60' : 'text-ink',
            )}
          >
            {goal.title}
          </h3>
          {goal.priority === 'high' && !done && (
            <Flag size={14} strokeWidth={2} className="shrink-0 text-rose-ink" aria-label="Высокий приоритет" />
          )}
          {category && <Tag color={category.color}>{category.name}</Tag>}
        </div>

        <div className="mt-2.5 flex items-center gap-3 pl-8">
          <ProgressBar value={progress} className="flex-1" label={`Прогресс: ${goal.title}`} />
          <span className="w-10 text-right text-small text-muted tabular-nums">{progress}%</span>
        </div>
      </div>

      {/* Раскрытая часть: детали и шаги */}
      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-200 ease-out',
          expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="overflow-hidden">
          <div className="flex flex-col gap-3 border-t border-line px-4 pt-3 pb-3.5 pl-12">
            {goal.description && <p className="text-body text-muted">{goal.description}</p>}

            {deadline && (
              <div
                className={cn(
                  'flex items-center gap-1.5 text-small',
                  deadline.tone === 'overdue' && !done ? 'text-rose-ink' : 'text-muted',
                )}
              >
                <CalendarClock size={14} strokeWidth={1.75} />
                {deadline.text}
              </div>
            )}

            <div className="flex flex-col gap-0.5">
              {goal.subgoals.length > 0 && (
                <span className="pb-1 text-small text-muted">
                  Шаги · {doneSteps} из {goal.subgoals.length}
                </span>
              )}
              {goal.subgoals.map((step) => (
                <div key={step.id} className="group -mx-1.5 flex min-h-8 items-center gap-2.5 rounded-lg px-1.5 hover:bg-bg">
                  <Checkbox
                    size="sm"
                    checked={step.done}
                    onChange={() => toggleSubgoal(goal.id, step.id)}
                    label={step.title}
                  />
                  <span className={cn('flex-1 text-body', step.done && 'text-muted line-through decoration-muted/60')}>
                    {step.title}
                  </span>
                  <IconButton
                    label={`Удалить шаг: ${step.title}`}
                    onClick={() => removeSubgoal(goal.id, step.id)}
                    className="size-7 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 max-md:opacity-60"
                  >
                    <X size={14} strokeWidth={1.75} />
                  </IconButton>
                </div>
              ))}

              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  addSubgoal(goal.id, draft)
                  setDraft('')
                }}
                className="-mx-1.5 flex min-h-8 items-center gap-2.5 px-1.5"
              >
                <Plus size={16} strokeWidth={1.75} className="shrink-0 text-muted" />
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Добавить шаг"
                  aria-label="Новый шаг"
                  className="h-8 flex-1 bg-transparent text-body outline-none placeholder:text-muted"
                />
              </form>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={onEdit}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-small font-medium text-muted transition-colors hover:bg-pill hover:text-ink"
              >
                <Pencil size={14} strokeWidth={1.75} />
                Изменить
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}

