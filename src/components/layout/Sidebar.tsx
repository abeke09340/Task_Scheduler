import {
  CalendarDays,
  CircleUserRound,
  Clock,
  LayoutDashboard,
  Sprout,
  Target,
  type LucideIcon,
} from 'lucide-react'
import { useState } from 'react'
import { NavLink } from 'react-router'
import { cn } from '../../lib/utils'
import { useProfile } from '../../stores/profile'
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
  const [editingName, setEditingName] = useState(false)

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

      <button
        type="button"
        onClick={() => setEditingName(true)}
        className="mt-auto flex h-10 items-center gap-3 rounded-lg px-2.5 text-body text-ink/75 transition-colors hover:bg-pill/60 hover:text-ink"
        title="Изменить имя"
      >
        <CircleUserRound size={18} strokeWidth={1.75} />
        <span className="truncate">{name}</span>
      </button>

      {editingName && <NameDialog onClose={() => setEditingName(false)} />}
    </div>
  )
}

