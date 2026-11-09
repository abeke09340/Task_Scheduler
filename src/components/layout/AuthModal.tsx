import { Check, Eye, EyeOff, Lock, User, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { validatePassword } from '../../lib/auth-crypto'
import { cn } from '../../lib/utils'
import { useAuth } from '../../stores/auth'
import { useCategories } from '../../stores/categories'
import { useGoals } from '../../stores/goals'
import { useProfile } from '../../stores/profile'
import { useSchedule } from '../../stores/schedule'
import { Button } from '../ui/Button'
import { SegmentedControl } from '../ui/SegmentedControl'

interface AuthModalProps {
  onClose?: () => void
  /** false — окно обязательно для входа, закрыть нельзя */
  dismissible?: boolean
}

type TabType = 'login' | 'register'

export function AuthModal({ onClose, dismissible = false }: AuthModalProps) {
  const login = useAuth((s) => s.login)
  const register = useAuth((s) => s.register)

  const [tab, setTab] = useState<TabType>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const passwordCheck = validatePassword(password)

  const canSubmit =
    username.trim().length >= 3 &&
    (tab === 'login' ? password.length > 0 : passwordCheck.valid) &&
    !isSubmitting

  const reloadData = async () => {
    await Promise.all([
      useCategories.getState().load(),
      useGoals.getState().load(),
      useSchedule.getState().load(),
      useProfile.getState().load(),
    ])
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return

    setError(null)
    setIsSubmitting(true)

    try {
      if (tab === 'login') {
        const res = await login(username, password)
        if (!res.success) {
          setError(res.error || 'Ошибка входа')
          setIsSubmitting(false)
          return
        }
      } else {
        const res = await register(username, password)
        if (!res.success) {
          setError(res.error || 'Ошибка регистрации')
          setIsSubmitting(false)
          return
        }
      }

      await reloadData()
      onClose?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Авторизация"
    >
      <div className="relative w-full max-w-[420px] rounded-2xl border border-line bg-surface p-6 shadow-xl animate-sheet-in">
        {dismissible && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-pill hover:text-ink"
            aria-label="Закрыть"
          >
            <X size={18} strokeWidth={1.75} />
          </button>
        )}

        <div className="flex flex-col items-center text-center">
          <div className="grid size-12 place-items-center rounded-2xl bg-ink text-white mb-3 shadow-sm">
            <Lock size={22} strokeWidth={2} className="text-white" />
          </div>
          <h2 className="text-title text-[22px] leading-tight font-semibold">
            {tab === 'login' ? 'Вход в аккаунт' : 'Регистрация'}
          </h2>
          <p className="mt-1 text-small text-muted">
            {tab === 'login'
              ? 'Войдите, чтобы ваши цели и прогресс были всегда с вами'
              : 'Создайте аккаунт для сохранения и синхронизации прогресса'}
          </p>
        </div>

        <div className="mt-5">
          <SegmentedControl
            label="Режим авторизации"
            options={[
              { value: 'login', label: 'Вход' },
              { value: 'register', label: 'Регистрация' },
            ]}
            value={tab}
            onChange={(v) => {
              setTab(v)
              setError(null)
            }}
            stretch
            className="rounded-full bg-bg p-1"
          />
        </div>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
          {error && (
            <div className="rounded-xl border border-rose-200/80 bg-rose-50 px-3.5 py-2.5 text-small text-rose-800">
              {error}
            </div>
          )}

          {/* Имя пользователя */}
          <div className="flex flex-col gap-1.5">
            <label className="text-small font-medium text-ink">Имя пользователя (логин)</label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-muted pointer-events-none">
                <User size={16} strokeWidth={1.75} />
              </span>
              <input
                type="text"
                autoFocus
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Например, abdurakhman"
                autoComplete="username"
                minLength={3}
                maxLength={40}
                className="h-10 w-full rounded-xl border border-line bg-surface pl-9 pr-3 text-body text-ink placeholder:text-muted focus:border-accent focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Пароль */}
          <div className="flex flex-col gap-1.5">
            <label className="text-small font-medium text-ink">Пароль</label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-muted pointer-events-none">
                <Lock size={16} strokeWidth={1.75} />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Введите пароль"
                autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                className="h-10 w-full rounded-xl border border-line bg-surface pl-9 pr-10 text-body text-ink placeholder:text-muted focus:border-accent focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 text-muted hover:text-ink transition-colors p-1"
                aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
              >
                {showPassword ? <EyeOff size={16} strokeWidth={1.75} /> : <Eye size={16} strokeWidth={1.75} />}
              </button>
            </div>

            {/* Подсказки по безопасности пароля при регистрации */}
            {tab === 'register' && (
              <div className="mt-2 rounded-xl border border-line bg-bg/50 p-3 flex flex-col gap-1.5 text-[12px]">
                <span className="font-medium text-muted">Требования к паролю:</span>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'flex size-4 items-center justify-center rounded-full text-white',
                      passwordCheck.minLen ? 'bg-emerald-500' : 'bg-line-strong',
                    )}
                  >
                    <Check size={11} strokeWidth={3} />
                  </span>
                  <span className={cn(passwordCheck.minLen ? 'text-ink font-medium' : 'text-muted')}>
                    Не менее 8 символов
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'flex size-4 items-center justify-center rounded-full text-white',
                      passwordCheck.hasDigit ? 'bg-emerald-500' : 'bg-line-strong',
                    )}
                  >
                    <Check size={11} strokeWidth={3} />
                  </span>
                  <span className={cn(passwordCheck.hasDigit ? 'text-ink font-medium' : 'text-muted')}>
                    Минимум одна цифра (0–9)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'flex size-4 items-center justify-center rounded-full text-white',
                      passwordCheck.hasSpecial ? 'bg-emerald-500' : 'bg-line-strong',
                    )}
                  >
                    <Check size={11} strokeWidth={3} />
                  </span>
                  <span className={cn(passwordCheck.hasSpecial ? 'text-ink font-medium' : 'text-muted')}>
                    Специальный символ (!@#$%^&*...)
                  </span>
                </div>
              </div>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            disabled={!canSubmit}
            className="mt-2 h-10 w-full rounded-xl text-body font-semibold"
          >
            {isSubmitting
              ? 'Секунду...'
              : tab === 'login'
                ? 'Войти в аккаунт'
                : 'Зарегистрироваться'}
          </Button>
        </form>
      </div>
    </div>
  )
}

