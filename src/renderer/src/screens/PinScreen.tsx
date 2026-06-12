import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/cn'
import { useAppStore } from '@/stores/app.store'

export function PinScreen() {
  const [digits, setDigits] = useState('')
  const [shake, setShake] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [lockedUntil, setLockedUntil] = useState(0)
  const [, forceTick] = useState(0)
  const verifying = useRef(false)

  const now = Date.now()
  const locked = lockedUntil > now
  const lockSecondsLeft = locked ? Math.ceil((lockedUntil - now) / 1000) : 0

  // While locked out, tick every second so the countdown stays live
  useEffect(() => {
    if (!locked) return
    const id = setInterval(() => forceTick((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [locked])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (verifying.current || lockedUntil > Date.now()) return

      if (/^[0-9]$/.test(e.key)) {
        setDigits((prev) => {
          if (prev.length >= 4) return prev
          const next = prev + e.key
          if (next.length === 4) {
            verifying.current = true
            window.pragma.pin.verify(next).then((result) => {
              if (result.ok) {
                useAppStore.getState().setView('profiles')
                return
              }
              if (result.lockedUntil && result.lockedUntil > Date.now()) {
                setLockedUntil(result.lockedUntil)
                setErrorMsg('')
              } else if (result.attemptsLeft != null && result.attemptsLeft <= 2) {
                setErrorMsg(
                  `Incorrect PIN — ${result.attemptsLeft} attempt${result.attemptsLeft === 1 ? '' : 's'} left`
                )
              } else {
                setErrorMsg('Incorrect PIN')
              }
              setShake(true)
              setTimeout(() => {
                setShake(false)
                setDigits('')
                verifying.current = false
              }, 600)
            })
          }
          return next
        })
      } else if (e.key === 'Backspace') {
        setDigits((prev) => prev.slice(0, -1))
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [lockedUntil])

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-10">
      {/* Wordmark */}
      <div className="flex flex-col items-center gap-1">
        <span
          className="text-2xl font-semibold tracking-[0.2em] uppercase"
          style={{ color: 'var(--color-brand)' }}
        >
          Pragma
        </span>
        <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
          {locked ? 'Too many attempts' : 'Enter your PIN to continue'}
        </span>
      </div>

      {/* PIN dots */}
      <div className={cn('flex gap-5', shake && 'animate-shake', locked && 'opacity-40')}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              'w-3.5 h-3.5 rounded-full transition-all duration-150',
              i < digits.length ? 'scale-100' : 'scale-90 border-2'
            )}
            style={{
              background: i < digits.length ? 'var(--color-brand)' : 'transparent',
              borderColor: i < digits.length ? 'var(--color-brand)' : 'var(--border-medium)',
            }}
          />
        ))}
      </div>

      {/* Error / lockout message */}
      <span
        className={cn(
          'text-xs transition-opacity duration-200',
          errorMsg || locked ? 'opacity-100' : 'opacity-0'
        )}
        style={{ color: '#ef4444' }}
      >
        {locked ? `Locked — try again in ${lockSecondsLeft}s` : errorMsg || 'placeholder'}
      </span>
    </div>
  )
}
