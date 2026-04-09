import { useState, useEffect } from 'react'

export function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false)
  const [isCloseHovered, setIsCloseHovered] = useState(false)
  const [isMinHovered, setIsMinHovered] = useState(false)
  const [isMaxHovered, setIsMaxHovered] = useState(false)

  useEffect(() => {
    // Sync maximized state on mount
    window.pragma.window.isMaximized().then(setIsMaximized)
    // Subscribe to changes
    const unsub = window.pragma.window.onMaximizeChange(setIsMaximized)
    return unsub
  }, [])

  return (
    <div
      className="flex items-center justify-between h-9 px-3 shrink-0"
      style={{
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        WebkitAppRegion: 'drag',
      }}
    >
      {/* App name */}
      <span
        className="text-xs font-semibold tracking-wider uppercase"
        style={{ color: 'var(--color-brand)', letterSpacing: '0.12em' }}
      >
        Pragma
      </span>

      {/* Window controls — must opt out of drag region */}
      <div
        className="flex items-center gap-0.5"
        style={{ WebkitAppRegion: 'no-drag' }}
      >
        {/* Minimize */}
        <button
          onClick={() => window.pragma.window.minimize()}
          onMouseEnter={() => setIsMinHovered(true)}
          onMouseLeave={() => setIsMinHovered(false)}
          className="flex h-6 w-8 items-center justify-center rounded transition-colors duration-100"
          style={{
            background: isMinHovered ? 'var(--bg-subtle)' : 'transparent',
            color: 'var(--text-tertiary)',
          }}
          title="Minimize"
        >
          <svg width="10" height="1" viewBox="0 0 10 1" fill="none">
            <rect width="10" height="1" fill="currentColor" />
          </svg>
        </button>

        {/* Maximize / Restore */}
        <button
          onClick={() => window.pragma.window.maximize()}
          onMouseEnter={() => setIsMaxHovered(true)}
          onMouseLeave={() => setIsMaxHovered(false)}
          className="flex h-6 w-8 items-center justify-center rounded transition-colors duration-100"
          style={{
            background: isMaxHovered ? 'var(--bg-subtle)' : 'transparent',
            color: 'var(--text-tertiary)',
          }}
          title={isMaximized ? 'Restore' : 'Maximize'}
        >
          {isMaximized ? (
            /* Restore icon — two overlapping squares */
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <rect x="2" y="0" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1" fill="none" />
              <rect x="0" y="2" width="8" height="8" rx="1" fill="var(--bg-surface)" stroke="currentColor" strokeWidth="1" />
            </svg>
          ) : (
            /* Maximize icon — single square */
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <rect x="0.5" y="0.5" width="9" height="9" rx="1" stroke="currentColor" strokeWidth="1" fill="none" />
            </svg>
          )}
        </button>

        {/* Close */}
        <button
          onClick={() => window.pragma.window.close()}
          onMouseEnter={() => setIsCloseHovered(true)}
          onMouseLeave={() => setIsCloseHovered(false)}
          className="flex h-6 w-8 items-center justify-center rounded transition-colors duration-100"
          style={{
            background: isCloseHovered ? '#ef4444' : 'transparent',
            color: isCloseHovered ? '#ffffff' : 'var(--text-tertiary)',
          }}
          title="Close"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path
              d="M1 1L9 9M9 1L1 9"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}
