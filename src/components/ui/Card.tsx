import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('rounded-xl border border-line bg-surface', className)}>{children}</div>
}

export function EmptyState({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <Card className="flex flex-col items-center gap-4 px-6 py-12 text-center">
      <p className="text-body text-muted">{title}</p>
      {action}
    </Card>
  )
}

