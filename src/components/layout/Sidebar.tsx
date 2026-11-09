import {
  CalendarDays,
  CircleUserRound,
  Clock,
  LayoutDashboard,
  LogIn,
  LogOut,
  Sprout,
  Target,
  type LucideIcon,
} from 'lucide-react'
import { useState } from 'react'
import { NavLink } from 'react-router'
import { cn } from '../../lib/utils'
import { useAuth } from '../../stores/auth'
import { useCategories } from '../../stores/categories'
import { useGoals } from '../../stores/goals'
import { useProfile } from '../../stores/profile'
import { useSchedule } from '../../stores/schedule'
import { AuthModal } from './AuthModal'
import { NameDialog } from './NameDialog'

const NAV: { to: string; label: string; icon: LucideIcon; end?: boolean }[] = [
  { to: '/', label: 'Обзор', icon: LayoutDashboard, end: true },
  { to: '/goals', label: 'Цели', icon: Target },
  { to: '/schedule', label: 'Распорядок', icon: Clock },
  { to: '/calendar', label: 'Календарь', icon: CalendarDays },
  { to: '/habits', label: 'Привычки', icon: Sprout },
]

export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid size-7 place-items-center rounded-lg bg-ink">
        <div className="grid size-3.5 place-items-center rounded-full border-[1.5px] border-bg">
          <div className="size-1.5 rounded-full bg-accent" />
        </div>
      </div>
      <span className="text-body font-semibold">Планер</span>
    </div>
  )
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const name = useProfile((s) => s.name)
  const user = useAuth((s) => s.user)
  const logout = useAuth((s) => s.logout)
  const [editingName, setEditingName] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)

  const reloadData = async () => {
    await Promise.all([
      useCategories.getState().load(),
      useGoals.getState().load(),
      useSchedule.getState().load(),
      useProfile.getState().load(),
    ])
  }

  const handleLogout = async () => {
    logout()
    await reloadData()
  }

  return (
    <div className="flex h-full flex-col px-3 pt-5 pb-4">
      <div className="px-2.5 pb-7">
        <Logo />
      </div>

      <nav aria-label="Разделы" className="flex flex-col gap-0.5">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex h-9 items-center gap-3 rounded-lg px-2.5 text-body transition-colors duration-150',
                isActive ? 'bg-pill font-medium text-ink' : 'text-ink/75 hover:bg-pill/60 hover:text-ink',
              )
            }
          >
            <Icon size={18} strokeWidth={1.75} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Пользователь и авторизация */}
      <div className="mt-auto flex items-center justify-between rounded-xl border border-line bg-surface p-1.5">
        <button
          type="button"
          onClick={() => (user ? setEditingName(true) : setAuthOpen(true))}
          className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2 py-1 text-left transition-colors hover:bg-pill/60"
          title={user ? 'Нажмите, чтобы изменить имя' : 'Войти в аккаунт'}
        >
          <div className="grid size-7 shrink-0 place-items-center rounded-lg bg-pill text-ink">
            <CircleUserRound size={16} strokeWidth={1.75} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-small font-semibold text-ink">
              {user ? user.username : (name || 'Гость')}
            </div>
            <div className="text-[11px] text-muted">
              {user ? 'В сети' : 'Нажмите для входа'}
            </div>
          </div>
        </button>

        {user ? (
          <button
            type="button"
            onClick={handleLogout}
            className="grid size-7 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-priority-bg hover:text-priority-ink"
            title="Выйти из аккаунта"
          >
            <LogOut size={14} strokeWidth={1.75} />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setAuthOpen(true)}
            className="grid size-7 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-pill hover:text-ink"
            title="Войти в аккаунт"
          >
            <LogIn size={14} strokeWidth={1.75} />
          </button>
        )}
      </div>

      {editingName && <NameDialog onClose={() => setEditingName(false)} />}
      {authOpen && <AuthModal dismissible onClose={() => setAuthOpen(false)} />}
    </div>
  )
}

