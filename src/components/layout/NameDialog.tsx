import { useState } from 'react'
import { Button } from '../ui/Button'
import { Field } from '../ui/Field'
import { inputClass } from '../../lib/styles'
import { Modal } from '../ui/Modal'
import { useProfile } from '../../stores/profile'

interface NameDialogProps {
  /** Первый запуск: окно нельзя закрыть, пока не введено имя */
  firstRun?: boolean
  onClose?: () => void
}

export function NameDialog({ firstRun = false, onClose }: NameDialogProps) {
  const currentName = useProfile((s) => s.name)
  const setName = useProfile((s) => s.setName)
  const [value, setValue] = useState(currentName ?? '')
  const valid = value.trim().length > 0

  const submit = () => {
    if (!valid) return
    setName(value)
    onClose?.()
  }

  return (
    <Modal
      title={firstRun ? 'Как к тебе обращаться?' : 'Имя'}
      onClose={() => onClose?.()}
      dismissible={!firstRun}
      footer={
        <Button type="submit" form="name-form" disabled={!valid} className="ml-auto">
          {firstRun ? 'Продолжить' : 'Сохранить'}
        </Button>
      }
    >
      <form
        id="name-form"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
        className="flex flex-col gap-4"
      >
        {firstRun && (
          <p className="text-body text-muted">
            Имя нужно для приветствия на главной. Оно хранится только на этом устройстве.
          </p>
        )}
        <Field label="Имя">
          <input
            autoFocus
            className={inputClass}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Абдували"
            maxLength={40}
            autoComplete="given-name"
          />
        </Field>
      </form>
    </Modal>
  )
}