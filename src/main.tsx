import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import App from './App.tsx'
import './index.css'
import { ensureSeed } from './storage/seed'
import { useAuth } from './stores/auth'
import { useCategories } from './stores/categories'
import { useGoals } from './stores/goals'
import { useProfile } from './stores/profile'
import { useSchedule } from './stores/schedule'

async function bootstrap() {
  useAuth.getState().init()
  await ensureSeed()
  await Promise.all([
    useCategories.getState().load(),
    useGoals.getState().load(),
    useProfile.getState().load(),
    useSchedule.getState().load(),
  ])
}

void bootstrap()
  .catch((err) => {
    console.error('Bootstrap error:', err)
  })
  .finally(() => {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </StrictMode>,
    )
  })
