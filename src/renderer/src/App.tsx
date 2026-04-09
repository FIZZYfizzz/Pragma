import { TitleBar } from '@/components/layout/TitleBar'

export default function App() {
  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{ background: 'var(--bg-base)' }}
    >
      <TitleBar />

      {/* Placeholder — replaced in Phase 3 with PIN screen / router */}
      <main className="flex-1 flex flex-col items-center justify-center gap-3 select-none">
        <p
          className="text-2xl font-semibold tracking-widest uppercase"
          style={{ color: 'var(--color-brand)', letterSpacing: '0.2em' }}
        >
          Pragma
        </p>
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
          Structured thought, purposeful action.
        </p>
      </main>
    </div>
  )
}
