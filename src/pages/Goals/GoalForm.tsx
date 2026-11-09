import { parseISO } from 'date-fns'
import { Check, Plus, X } from 'lucide-react'
import { useState } from 'react'
import { Button, IconButton } from '../../components/ui/Button'
import { Field, FieldGroup } from '../../components/ui/Field'
import { inputClass, textareaClass } from '../../lib/styles'
import { Modal } from '../../components/ui/Modal'
import { SegmentedControl } from '../../components/ui/SegmentedControl'
import { COLOR_CLASSES, COLOR_KEYS, COLOR_NAMES, PERIOD_OPTIONS, PRIORITY_OPTIONS } from '../../lib/constants'
import { periodStartKey } from '../../lib/dates'
import { cn, newId } from '../../lib/utils'
import { useCategories } from '../../stores/categories'
import { useGoals } from '../../stores/goals'
import type { ColorKey, Goal, GoalType, Period, Priority, SubGoal } from '../../types/models'

interface GoalFormProps {
  goal?: Goal
  defaultPeriod: Period
  initialGoalType?: GoalType
  initialCategoryId?: string
  onClose: () => void
}

export function GoalForm({
  goal,
  defaultPeriod,
  initialGoalType = 'general',
  initialCategoryId,
  onClose,
}: GoalFormProps) {
  const categories = useCategories((s) => s.categories)
  const addCategory = useCategories((s) => s.add)
  const createGoal = useGoals((s) => s.create)
  const updateGoal = useGoals((s) => s.update)
  const removeGoal = useGoals((s) => s.remove)

  const [title, setTitle] = useState(goal?.title ?? '')
  const [description, setDescription] = useState(goal?.description ?? '')
  const [categoryId, setCategoryId] = useState(goal?.categoryId ?? initialCategoryId ?? categories[0]?.id ?? '')
  const [goalType, setGoalType] = useState<GoalType>(goal?.goalType ?? initialGoalType)
  const [period, setPeriod] = useState<Period>(goal?.period ?? defaultPeriod)
  const [priority, setPriority] = useState<Priority>(goal?.priority ?? 'medium')
  const [deadline, setDeadline] = useState(goal?.deadline ?? '')
  const [subgoals, setSubgoals] = useState<SubGoal[]>(goal?.subgoals ?? [])
  const [stepDraft, setStepDraft] = useState('')

  const [newCatOpen, setNewCatOpen] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newCatColor, setNewCatColor] = useState<ColorKey>('sage')

  const [confirmDelete, setConfirmDelete] = useState(false)

  const valid = title.trim().length > 0 && categoryId !== ''

  const addStep = () => {
    const clean = stepDraft.trim()
    if (!clean) return
    setSubgoals((prev) => [...prev, { id: newId(), title: clean, done: false }])
    setStepDraft('')
  }

  const createCategory = () => {
    if (!newCatName.trim()) return
    const category = addCategory(newCatName, newCatColor)
    setCategoryId(category.id)
    setNewCatOpen(false)
    setNewCatName('')
  }

  const save = () => {
    if (!valid) return
    // Шаг, введённый, но не добавленный по Enter, тоже сохраняем
    const steps = stepDraft.trim()
      ? [...subgoals, { id: newId(), title: stepDraft.trim(), done: false }]
      : subgoals
    const data = {
      title,
      description,
      categoryId,
      period,
      priority,
      goalType,
      deadline: deadline || undefined,
      subgoals: goalType === 'daily' ? [] : steps,
    }
    if (goal) {
      updateGoal(goal.id, {
        ...data,
        periodStart: period === goal.period ? goal.periodStart : periodStartKey(period, parseISO(goal.periodStart)),
      })
    } else {
      createGoal({ ...data, periodStart: periodStartKey(period) })
    }
    onClose()
  }

  return (
    <Modal
      title={goal ? 'Редактировать цель' : 'Новая цель'}
      onClose={onClose}
      footer={
        <>
          {goal &&
            (confirmDelete ? (
              <Button
                variant="danger"
                onClick={() => {
                  removeGoal(goal.id)
                  onClose()
                }}
              >
                Точно удалить?
              </Button>
            ) : (
              <Button variant="danger" onClick={() => setConfirmDelete(true)}>
                Удалить
              </Button>
            ))}
          <div className="ml-auto flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit" form="goal-form" disabled={!valid}>
              {goal ? 'Сохранить' : 'Создать'}
            </Button>
          </div>
        </>
      }
    >
      <form
        id="goal-form"
        onSubmit={(e) => {
          e.preventDefault()
          save()
        }}
        className="flex flex-col gap-5"
      >
        <Field label="Название">
          <input
            autoFocus
            className={inputClass}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Например, прочитать книгу"
            maxLength={120}
          />
        </Field>

        <Field label="Описание">
          <textarea
            className={textareaClass}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Зачем эта цель и как поймёшь, что она достигнута"
            rows={2}
          />
        </Field>

        <FieldGroup label="Категория">
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => {
              const active = c.id === categoryId
              const colors = COLOR_CLASSES[c.color]
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setCategoryId(c.id)}
                  className={cn(
                    'inline-flex h-8 items-center gap-2 rounded-full border px-3 text-small font-medium transition-colors',
                    active
                      ? cn(colors.fill, colors.ink, 'border-transparent')
                      : 'border-line text-ink hover:bg-bg',
                  )}
                >
                  {!active && <span className={cn('size-2 rounded-full', colors.dot)} />}
                  {c.name}
                </button>
              )
            })}
            {!newCatOpen && (
              <button
                type="button"
                onClick={() => setNewCatOpen(true)}
                className="inline-flex h-8 items-center gap-1.5 rounded-full border border-dashed border-line-strong px-3 text-small font-medium text-muted transition-colors hover:text-ink"
              >
                <Plus size={14} strokeWidth={2} />
                Своя
              </button>
            )}
          </div>

          {newCatOpen && (
            <div className="mt-1 flex flex-col gap-3 rounded-lg border border-line bg-bg p-3">
              <div className="flex gap-2">
                <input
                  autoFocus
                  className={inputClass}
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      createCategory()
                    }
                  }}
                  placeholder="Название категории"
                  aria-label="Название категории"
                  maxLength={24}
                />
                <IconButton label="Отмена" onClick={() => setNewCatOpen(false)} className="size-10">
                  <X size={16} strokeWidth={1.75} />
                </IconButton>
              </div>
              <div className="flex items-center gap-2">
                {COLOR_KEYS.map((key) => (
                  <button
                    key={key}
                    type="button"
                    aria-label={COLOR_NAMES[key]}
                    aria-pressed={newCatColor === key}
                    onClick={() => setNewCatColor(key)}
                    className={cn(
                      'grid size-7 place-items-center rounded-full transition-transform active:scale-90',
                      COLOR_CLASSES[key].fill,
                    )}
                  >
                    {newCatColor === key && <Check size={14} strokeWidth={2.5} className={COLOR_CLASSES[key].ink} />}
                  </button>
                ))}
                <Button className="ml-auto h-8" onClick={createCategory} disabled={!newCatName.trim()}>
                  Добавить
                </Button>
              </div>
            </div>
          )}
        </FieldGroup>

        <FieldGroup label="Тип цели">
          <SegmentedControl
            label="Тип цели"
            options={[
              { value: 'general', label: 'Общая цель' },
              { value: 'daily', label: 'Ежедневная (рутина с 7 тиками)' },
            ]}
            value={goalType}
            onChange={(v) => setGoalType(v as GoalType)}
            stretch
            className="rounded-full bg-bg p-1"
          />
        </FieldGroup>

        <FieldGroup label="Период">
          <SegmentedControl
            label="Период"
            options={PERIOD_OPTIONS}
            value={period}
            onChange={setPeriod}
            stretch
            className="rounded-full bg-bg p-1"
          />
        </FieldGroup>

        <FieldGroup label="Приоритет">
          <SegmentedControl
            label="Приоритет"
            options={PRIORITY_OPTIONS}
            value={priority}
            onChange={setPriority}
            stretch
            className="rounded-full bg-bg p-1"
          />
        </FieldGroup>

        {goalType === 'general' ? (
          <>
            <Field label="Дедлайн">
              <input
                type="date"
                className={inputClass}
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </Field>

            <FieldGroup label="Шаги">
              <div className="flex flex-col gap-1">
                {subgoals.map((step) => (
                  <div key={step.id} className="flex h-9 items-center gap-2.5 rounded-lg border border-line px-3">
                    <span className={cn('size-1.5 shrink-0 rounded-full', step.done ? 'bg-accent' : 'bg-line-strong')} />
                    <span className="flex-1 truncate text-body">{step.title}</span>
                    <IconButton
                      label={`Удалить шаг: ${step.title}`}
                      onClick={() => setSubgoals((prev) => prev.filter((s) => s.id !== step.id))}
                      className="-mr-2 size-7"
                    >
                      <X size={14} strokeWidth={1.75} />
                    </IconButton>
                  </div>
                ))}
                <input
                  className={inputClass}
                  value={stepDraft}
                  onChange={(e) => setStepDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addStep()
                    }
                  }}
                  placeholder="Новый шаг и Enter"
                  aria-label="Новый шаг"
                />
              </div>
            </FieldGroup>
          </>
        ) : (
          <div className="rounded-lg border border-line bg-bg/50 p-3.5 text-small text-muted">
            💡 Ежедневная цель будет отображаться во вкладке <strong>«Ежедневные»</strong> со строкой квадратных тиков на каждый день недели.
          </div>
        )}
      </form>
    </Modal>
  )
}