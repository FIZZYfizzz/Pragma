import { useEffect, useState } from 'react'
import { cn } from '@/lib/cn'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { toast } from '@/stores/toast.store'

// ─── Themes ───────────────────────────────────────────────────────────────────

const THEMES: { key: string; label: string; swatch: [string, string] }[] = [
  { key: 'light',  label: 'Light',  swatch: ['#f9f9f8', '#7c6af7'] },
  { key: 'dark',   label: 'Dark',   swatch: ['#1a1a18', '#7c6af7'] },
  { key: 'blue',   label: 'Blue',   swatch: ['#161b27', '#60a5fa'] },
  { key: 'violet', label: 'Violet', swatch: ['#16141f', '#a78bfa'] },
  { key: 'sage',   label: 'Sage',   swatch: ['#141a16', '#6ee7b7'] },
  { key: 'sand',   label: 'Sand',   swatch: ['#f5f3ef', '#c2692a'] },
  { key: 'mocha',  label: 'Mocha',  swatch: ['#221c16', '#e8a87c'] },
]

function SectionLabel({ children }: { children: string }) {
  return (
    <span
      className="text-[11px] font-semibold uppercase tracking-wider"
      style={{ color: 'var(--text-tertiary)' }}
    >
      {children}
    </span>
  )
}

function PinInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  return (
    <input
      type="password"
      inputMode="numeric"
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 4))}
      placeholder={placeholder}
      maxLength={4}
      className="w-full px-3 py-2 rounded-lg text-sm outline-none tracking-[0.3em]"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        color: 'var(--text-primary)',
      }}
      onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--color-brand)')}
      onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
    />
  )
}

// ─── Settings dialog ──────────────────────────────────────────────────────────

export function SettingsDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [theme, setTheme] = useState('light')
  const [hasPin, setHasPin] = useState(false)
  const [pinMode, setPinMode] = useState<'idle' | 'change' | 'remove'>('idle')
  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setPinMode('idle')
    setCurrentPin('')
    setNewPin('')
    setConfirmPin('')
    window.pragma.settings.get('theme').then((t) => setTheme(t || 'light'))
    window.pragma.pin.exists().then(setHasPin)
  }, [isOpen])

  async function applyTheme(key: string) {
    setTheme(key)
    document.documentElement.setAttribute('data-theme', key)
    await window.pragma.settings.set('theme', key)
  }

  async function handlePinSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    try {
      if (pinMode === 'remove') {
        const ok = await window.pragma.pin.remove(currentPin)
        if (ok) {
          setHasPin(false)
          setPinMode('idle')
          toast.success('PIN removed')
        } else {
          toast.error('Incorrect PIN')
        }
        return
      }

      // change / set
      if (newPin.length !== 4 || newPin !== confirmPin) {
        toast.error("PINs don't match")
        return
      }
      if (hasPin) {
        const result = await window.pragma.pin.verify(currentPin)
        if (!result.ok) {
          toast.error(
            result.lockedUntil && result.lockedUntil > Date.now()
              ? 'Too many attempts — try again later'
              : 'Incorrect current PIN'
          )
          return
        }
      }
      await window.pragma.pin.set(newPin)
      setHasPin(true)
      setPinMode('idle')
      toast.success(hasPin ? 'PIN changed' : 'PIN set')
    } finally {
      setCurrentPin('')
      setNewPin('')
      setConfirmPin('')
      setBusy(false)
    }
  }

  const pinFormValid =
    pinMode === 'remove'
      ? currentPin.length === 4
      : newPin.length === 4 && confirmPin.length === 4 && (!hasPin || currentPin.length === 4)

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Settings" width="max-w-sm">
      {/* Theme */}
      <div className="flex flex-col gap-2">
        <SectionLabel>Theme</SectionLabel>
        <div className="grid grid-cols-4 gap-2">
          {THEMES.map((t) => {
            const active = theme === t.key
            return (
              <button
                key={t.key}
                onClick={() => applyTheme(t.key)}
                className={cn(
                  'flex flex-col items-center gap-1.5 p-2 rounded-xl cursor-pointer transition-colors'
                )}
                style={{
                  background: active ? 'var(--color-brand-subtle)' : 'transparent',
                  border: `1px solid ${active ? 'var(--color-brand)' : 'var(--border-subtle)'}`,
                }}
              >
                <span
                  className="w-7 h-7 rounded-full"
                  style={{
                    background: `linear-gradient(135deg, ${t.swatch[0]} 50%, ${t.swatch[1]} 50%)`,
                    border: '1px solid var(--border-medium)',
                  }}
                />
                <span
                  className="text-[11px]"
                  style={{ color: active ? 'var(--color-brand)' : 'var(--text-secondary)' }}
                >
                  {t.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ height: 1, background: 'var(--border-subtle)' }} />

      {/* PIN */}
      <div className="flex flex-col gap-2">
        <SectionLabel>Security</SectionLabel>

        {pinMode === 'idle' ? (
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {hasPin ? 'PIN lock is on' : 'No PIN set'}
            </span>
            <div className="flex gap-1.5">
              <Button variant="ghost" size="sm" onClick={() => setPinMode('change')}>
                {hasPin ? 'Change PIN' : 'Set PIN'}
              </Button>
              {hasPin && (
                <Button variant="danger" size="sm" onClick={() => setPinMode('remove')}>
                  Remove
                </Button>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handlePinSubmit} className="flex flex-col gap-2">
            {(hasPin || pinMode === 'remove') && (
              <PinInput value={currentPin} onChange={setCurrentPin} placeholder="Current PIN" />
            )}
            {pinMode === 'change' && (
              <>
                <PinInput value={newPin} onChange={setNewPin} placeholder="New 4-digit PIN" />
                <PinInput value={confirmPin} onChange={setConfirmPin} placeholder="Confirm new PIN" />
              </>
            )}
            <div className="flex gap-2 mt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="flex-1"
                onClick={() => {
                  setPinMode('idle')
                  setCurrentPin('')
                  setNewPin('')
                  setConfirmPin('')
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant={pinMode === 'remove' ? 'danger' : 'primary'}
                size="sm"
                className="flex-1"
                disabled={!pinFormValid || busy}
              >
                {pinMode === 'remove' ? 'Remove PIN' : hasPin ? 'Change PIN' : 'Set PIN'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Dialog>
  )
}
