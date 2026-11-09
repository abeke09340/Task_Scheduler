import type { ReactNode } from 'react'
import { COLOR_CLASSES } from '../../lib/constants'
import { cn } from '../../lib/utils'
import type { ColorKey } from '../../types/models'

export function Tag({ color, children }: { color: ColorKey; children: ReactNode }) {
  const c = COLOR_CLASSES[color]
  return (
    <span
      className={cn(
        'inline-flex h-6 shrink-0 items-center rounded-full px-2.5 text-small font-medium',
        c.fill,
        c.ink,
      )}
    >
      {children}
    </span>
  )
}

