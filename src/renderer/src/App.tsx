import { useEffect } from 'react'
import { TitleBar } from '@/components/layout/TitleBar'
import { PinScreen } from '@/screens/PinScreen'
import { ProfilesScreen } from '@/screens/ProfilesScreen'
import { HomeScreen } from '@/screens/HomeScreen'
import { useAppStore } from '@/stores/app.store'

export default function App() {
  const view = useAppStore((s) => s.view)
  const setView = useAppStore((s) => s.setView)

  useEffect(() => {
    Promise.all([
      window.pragma.pin.exists(),
      window.pragma.settings.get('theme'),
    ]).then(([hasPIN, theme]) => {
      if (theme) document.documentElement.setAttribute('data-theme', theme)
      setView(hasPIN ? 'pin' : 'profiles')
    })
  }, [])

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{ background: 'var(--bg-base)' }}
    >
      <TitleBar />

      {view === 'init' && null}

      {view === 'pin' && <PinScreen />}

      {view === 'profiles' && <ProfilesScreen />}

      {view === 'home' && <HomeScreen />}

      {view === 'board' && (
        // Phase 5 placeholder
        <main className="flex-1 flex items-center justify-center">
          <span style={{ color: 'var(--text-tertiary)' }}>Board — coming in Phase 5</span>
        </main>
      )}
    </div>
  )
}
