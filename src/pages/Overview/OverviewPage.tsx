import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { useState } from 'react'
import { Link } from 'react-router'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card } from '../../components/ui/Card'
import { capitalize, greeting } from '../../lib/dates'
import { useProfile } from '../../stores/profile'

/** Обзор. Полная версия (статистика, «Сегодня», напоминания) — Фаза 4 */
export function OverviewPage() {
  const name = useProfile((s) => s.name)
  const [now] = useState(() => new Date())

  return (
    <>
      <PageHeader
        title={name ? `${greeting(now)}, ${name}` : greeting(now)}
        subtitle={capitalize(format(now, 'EEEE, d MMMM', { locale: ru }))}
      />
      <Card className="mt-6 px-6 py-12 text-center">
        <p className="text-body text-muted">
          Здесь будет обзор дня. А пока —{' '}
          <Link to="/goals" className="font-medium text-accent hover:underline">
            перейти к целям
          </Link>
          .
        </p>
      </Card>
    </>
  )
}