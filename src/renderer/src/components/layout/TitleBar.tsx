import { useState, useEffect } from 'react'
import { SettingsDialog } from './SettingsDialog'

export function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false)
  const [isCloseHovered, setIsCloseHovered] = useState(false)
  const [isMinHovered, setIsMinHovered] = useState(false)
  const [isMaxHovered, setIsMaxHovered] = useState(false)
  const [isGearHovered, setIsGearHovered] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

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
        {/* Settings */}
        <button
          onClick={() => setSettingsOpen(true)}
          onMouseEnter={() => setIsGearHovered(true)}
          onMouseLeave={() => setIsGearHovered(false)}
          className="flex h-6 w-8 items-center justify-center rounded transition-colors duration-100 mr-1"
          style={{
            background: isGearHovered ? 'var(--bg-subtle)' : 'transparent',
            color: 'var(--text-tertiary)',
          }}
          title="Settings"
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0a8.2 8.2 0 011.701.18c.429.09.749.443.804.877l.158 1.258c.067.539.438.992.94 1.2.503.207 1.08.143 1.518-.187l1.007-.759a1.077 1.077 0 011.187-.05c.464.29.885.626 1.255 1.001a1.08 1.08 0 01.057 1.196l-.766 1.012c-.33.439-.395 1.015-.187 1.518.207.503.66.873 1.2.94l1.257.159c.435.054.787.374.878.803a8.198 8.198 0 010 3.403c-.09.428-.443.748-.878.803l-1.258.158c-.539.067-.992.438-1.2.94-.207.503-.142 1.08.188 1.518l.758 1.007c.26.346.282.818.05 1.187a8.045 8.045 0 01-1 1.255 1.08 1.08 0 01-1.197.057l-1.011-.766c-.44-.33-1.016-.395-1.519-.187-.502.207-.872.66-.94 1.2l-.158 1.257a1.076 1.076 0 01-.803.878 8.186 8.186 0 01-3.403 0 1.076 1.076 0 01-.804-.878l-.158-1.258c-.067-.539-.438-.992-.94-1.2-.503-.207-1.08-.142-1.518.188l-1.007.758a1.077 1.077 0 01-1.187.05 8.045 8.045 0 01-1.255-1 1.08 1.08 0 01-.057-1.197l.766-1.011c.33-.44.395-1.016.187-1.519-.207-.502-.66-.872-1.2-.94l-1.257-.157a1.077 1.077 0 01-.878-.804 8.186 8.186 0 010-3.403c.09-.428.443-.748.878-.803L2.16 6.71c.539-.067.992-.438 1.2-.94.207-.503.142-1.08-.188-1.518l-.758-1.007a1.077 1.077 0 01-.05-1.187A8.045 8.045 0 013.36.803a1.08 1.08 0 011.196-.057l1.012.766c.439.33 1.015.395 1.518.187.503-.207.873-.66.94-1.2L8.184 1.057A1.076 1.076 0 018.987.18 8.2 8.2 0 018 0zm0 1.5a6.7 6.7 0 00-1.005.075l-.107.852c-.134 1.078-.875 1.985-1.881 2.402-1.006.416-2.16.286-3.038-.373l-.683-.514a6.546 6.546 0 00-.711.711l.514.683c.66.878.79 2.032.373 3.038-.417 1.006-1.324 1.747-2.402 1.881l-.852.107a6.688 6.688 0 000 2.01l.852.107c1.078.135 1.985.875 2.402 1.881.417 1.006.286 2.16-.373 3.038l-.514.683c.219.252.456.49.711.711l.683-.514c.878-.66 2.032-.789 3.038-.373 1.006.417 1.747 1.324 1.881 2.402l.107.852a6.688 6.688 0 002.01 0l.107-.852c.135-1.078.875-1.985 1.881-2.402 1.006-.416 2.16-.286 3.038.373l.683.514a6.55 6.55 0 00.711-.71l-.514-.684c-.66-.878-.789-2.032-.373-3.038.417-1.006 1.324-1.746 2.402-1.881l.852-.107a6.688 6.688 0 000-2.01l-.852-.107c-1.078-.134-1.985-.875-2.402-1.881-.416-1.006-.286-2.16.373-3.038l.514-.683a6.55 6.55 0 00-.71-.711l-.684.514c-.878.66-2.032.79-3.038.373-1.006-.417-1.746-1.324-1.881-2.402l-.107-.852A6.7 6.7 0 008 1.5zM8 5.5a2.5 2.5 0 110 5 2.5 2.5 0 010-5z" />
          </svg>
        </button>

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

      <SettingsDialog isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}
