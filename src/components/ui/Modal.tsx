import { X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { IconButton } from './Button'

interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  /** false — нельзя закрыть без действия (например, первый запуск) */
  dismissible?: boolean
}

/** Модальное окно: по центру на десктопе, снизу (bottom sheet) на телефоне */
export function Modal({ title, onClose, children, footer, dismissible = true }: ModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dismissible) onClose()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose, dismissible])

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="absolute inset-0 animate-fade-in bg-ink/20"
        onClick={dismissible ? onClose : undefined}
      />
      <div className="relative flex max-h-[92dvh] w-full animate-sheet-in flex-col rounded-t-2xl border border-line bg-surface md:max-w-[520px] md:rounded-xl">
        <div className="flex items-center justify-between gap-4 px-5 pt-5 pb-4">
          <h2 className="text-body font-semibold">{title}</h2>
          {dismissible && (
            <IconButton label="Закрыть" onClick={onClose} className="-mr-1.5">
              <X size={18} strokeWidth={1.75} />
            </IconButton>
          )}
        </div>
        <div className="overflow-y-auto px-5 pb-5">{children}</div>
        {footer && (
          <div className="flex items-center gap-2 border-t border-line px-5 pt-3.5 pb-[max(14px,env(safe-area-inset-bottom))]">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}

