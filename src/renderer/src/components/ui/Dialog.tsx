import { useEffect, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface DialogProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  width?: string
}

export function Dialog({ isOpen, onClose, title, children, width = 'max-w-sm' }: DialogProps) {
  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className={cn('w-full mx-4 rounded-2xl p-6 flex flex-col gap-5', width)}
        style={{
          background: 'var(--bg-elevated)',
          boxShadow: 'var(--shadow-dialog)',
          border: '1px solid var(--border-subtle)',
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {title && (
          <h2
            className="text-base font-semibold text-center"
            style={{ color: 'var(--text-primary)' }}
          >
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>
  )
}
