import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { AppLayout } from './components/layout/AppLayout'
import { AuthModal } from './components/layout/AuthModal'
import { SiuuuCelebration } from './components/ui/SiuuuCelebration'
import { ComingSoon } from './pages/ComingSoon'
import { GoalsPage } from './pages/Goals/GoalsPage'
import { OverviewPage } from './pages/Overview/OverviewPage'
import { SchedulePage } from './pages/Schedule/SchedulePage'
import { useAuth } from './stores/auth'
import { useCategories } from './stores/categories'
import { useGoals } from './stores/goals'
import { useProfile } from './stores/profile'
import { useSchedule } from './stores/schedule'

export default function App() {
  const user = useAuth((s) => s.user)
  const isReady = useAuth((s) => s.isReady)

  // Многовкладочная синхронизация в реальном времени при любых изменениях
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (!e.key || !e.key.startsWith('planner:v1:')) return
      if (e.key === 'planner:v1:session') {
        useAuth.getState().syncFromStorage()
      }
      void Promise.all([
        useGoals.getState().load(),
        useSchedule.getState().load(),
        useCategories.getState().load(),
        useProfile.getState().load(),
      ])
    }

    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  return (
    <>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<OverviewPage />} />
          <Route path="goals" element={<GoalsPage />} />
          <Route path="schedule" element={<SchedulePage />} />
          <Route path="calendar" element={<ComingSoon title="Календарь" />} />
          <Route path="habits" element={<ComingSoon title="Привычки" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>

      {/* Если пользователь не авторизован — показываем окно входа/регистрации */}
      {isReady && !user && <AuthModal />}
      <SiuuuCelebration />
    </>
  )
}
