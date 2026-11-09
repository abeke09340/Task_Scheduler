import { Download, Upload } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../ui/Button'
import { Field } from '../ui/Field'
import { inputClass } from '../../lib/styles'
import { Modal } from '../ui/Modal'
import { exportUserData, importUserData } from '../../storage/backup'
import { useAuth } from '../../stores/auth'
import { useProfile } from '../../stores/profile'

interface NameDialogProps {
  /** Первый запуск: окно нельзя закрыть, пока не введено имя */
  firstRun?: boolean
  onClose?: () => void
}

export function NameDialog({ firstRun = false, onClose }: NameDialogProps) {
  const currentName = useProfile((s) => s.name)
  const setName = useProfile((s) => s.setName)
  const user = useAuth((s) => s.user)
  const [value, setValue] = useState(currentName ?? user?.username ?? '')
  const valid = value.trim().length > 0

  const submit = () => {
    if (!valid) return
    setName(value)
    onClose?.()
  }

  return (
    <Modal
      title={firstRun ? 'Как к тебе обращаться?' : 'Профиль и синхронизация'}
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
        <Field label="Имя для отображения">
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

        {!firstRun && (
          <div className="mt-1 flex flex-col gap-2 rounded-xl border border-line bg-bg/50 p-3.5">
            <span className="text-small font-semibold text-ink">Синхронизация между устройствами</span>
            <p className="text-[12px] text-muted">
              Чтобы открыть все ваши цели и дела на другом компьютере или телефоне («зайти из другого места»), скачайте резервную копию и импортируйте её на том устройстве.
            </p>
            <div className="mt-1 flex flex-wrap gap-2">
              <Button
                variant="secondary"
                className="h-8 text-small"
                onClick={() => void exportUserData(user?.username || value || 'planner')}
              >
                <Download size={14} strokeWidth={2} />
                <span>Экспорт данных</span>
              </Button>
              <label className="inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-small font-medium text-ink transition-colors hover:bg-bg">
                <Upload size={14} strokeWidth={2} />
                <span>Импорт данных</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    const text = await file.text()
                    const res = await importUserData(user?.id || 'local', text)
                    if (res.success) {
                      alert('Данные успешно импортированы!')
                      onClose?.()
                    } else {
                      alert(res.error || 'Ошибка импорта')
                    }
                  }}
                />
              </label>
            </div>
          </div>
        )}
      </form>
    </Modal>
  )
}