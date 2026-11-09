import { Navigate, Route, Routes } from 'react-router'
import { AppLayout } from './components/layout/AppLayout'
import { NameDialog } from './components/layout/NameDialog'
import { ComingSoon } from './pages/ComingSoon'
import { GoalsPage } from './pages/Goals/GoalsPage'
import { OverviewPage } from './pages/Overview/OverviewPage'
import { useProfile } from './stores/profile'

export default function App() {
  const name = useProfile((s) => s.name)

  return (
    <>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<OverviewPage />} />
          <Route path="goals" element={<GoalsPage />} />
          <Route path="schedule" element={<ComingSoon title="Распорядок" />} />
          <Route path="calendar" element={<ComingSoon title="Календарь" />} />
          <Route path="habits" element={<ComingSoon title="Привычки" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>

      {!name && <NameDialog firstRun />}
    </>
  )
}
