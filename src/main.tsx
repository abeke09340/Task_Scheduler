import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import App from './App.tsx'
import './index.css'
import { ensureSeed } from './storage/seed'
import { useCategories } from './stores/categories'
import { useGoals } from './stores/goals'
import { useProfile } from './stores/profile'

async function bootstrap() {
  await ensureSeed()
  await Promise.all([
    useCategories.getState().load(),
    useGoals.getState().load(),
    useProfile.getState().load(),
  ])
}

void bootstrap().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>,
  )
})
