import { Menu } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Outlet } from 'react-router'
import { IconButton } from '../ui/Button'
import { Logo, Sidebar } from './Sidebar'

export function AppLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    if (!drawerOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDrawerOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [drawerOpen])

  return (
    <div className="min-h-dvh md:flex">
      {/* Десктоп: постоянная боковая панель */}
      <aside className="sticky top-0 hidden h-dvh w-[232px] shrink-0 border-r border-line md:block">
        <Sidebar />
      </aside>

      {/* Телефон: верхняя панель с кнопкой меню */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-line bg-bg px-2 pt-[env(safe-area-inset-top)] md:hidden">
        <IconButton label="Открыть меню" onClick={() => setDrawerOpen(true)} className="size-10 text-ink">
          <Menu size={20} strokeWidth={1.75} />
        </IconButton>
        <Logo />
      </header>

      {drawerOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 animate-fade-in bg-ink/20" onClick={() => setDrawerOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-[264px] animate-drawer-in border-r border-line bg-bg pt-[env(safe-area-inset-top)]">
            <Sidebar onNavigate={() => setDrawerOpen(false)} />
          </aside>
        </div>
      )}

      <main className="min-w-0 flex-1">
        <div className="mx-auto w-full max-w-[880px] px-4 pt-6 pb-10 md:px-12 md:pt-10">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

