import { useToastStore, type ToastKind } from '@/stores/toast.store'

const KIND_COLOR: Record<ToastKind, string> = {
  success: '#22c55e',
  error: '#ef4444',
  info: 'var(--color-brand)',
}

const KIND_ICON: Record<ToastKind, string> = {
  // 16x16 octicon paths
  success: 'M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.751.751 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z',
  error: 'M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM8 4a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 018 4zm0 8a1 1 0 100-2 1 1 0 000 2z',
  info: 'M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM8 7a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 018 7zm0-3a1 1 0 100 2 1 1 0 000-2z',
}

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts)
  const dismiss = useToastStore((s) => s.dismiss)

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 items-end pointer-events-none">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => dismiss(t.id)}
          className="pointer-events-auto flex items-center gap-2.5 pl-3 pr-4 py-2.5 rounded-xl text-sm cursor-pointer animate-toast-in text-left"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-dialog)',
            color: 'var(--text-primary)',
            maxWidth: 360,
          }}
        >
          <svg width="15" height="15" viewBox="0 0 16 16" className="shrink-0" style={{ fill: KIND_COLOR[t.kind] }}>
            <path d={KIND_ICON[t.kind]} />
          </svg>
          <span className="leading-snug">{t.message}</span>
        </button>
      ))}
    </div>
  )
}
