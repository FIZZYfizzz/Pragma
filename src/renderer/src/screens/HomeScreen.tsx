import { useEffect, useRef, useState } from 'react'
import type { Board, BoardTemplate, Profile, PragmaProject } from '@shared/types'
import { BOARD_TEMPLATES } from '@shared/types'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { useAppStore } from '@/stores/app.store'

// ─── Constants ────────────────────────────────────────────────────────────────

const COVER_COLORS = [
  '#7c6af7', '#60a5fa', '#f472b6', '#34d399',
  '#fbbf24', '#f87171', '#a78bfa', '#6ee7b7',
  '#94a3b8', '#fb923c',
]

const TEMPLATES: { key: BoardTemplate; label: string; desc: string }[] = [
  { key: 'blank',  label: 'Blank',  desc: 'Start with an empty board' },
  { key: 'kanban', label: 'Kanban', desc: 'Backlog · In Progress · Review · Done' },
  { key: 'sprint', label: 'Sprint', desc: 'To Do · In Progress · Blocked · Done' },
  { key: 'simple', label: 'Simple', desc: 'To Do · Done' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function avatarInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// ─── Color picker ─────────────────────────────────────────────────────────────

function ColorPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (color: string) => void
}) {
  return (
    <div className="flex gap-2 flex-wrap justify-center">
      {COVER_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className="w-6 h-6 rounded-full cursor-pointer transition-transform duration-100"
          style={{
            background: color,
            boxShadow:
              value === color
                ? `0 0 0 2px var(--bg-elevated), 0 0 0 4px ${color}`
                : undefined,
            transform: value === color ? 'scale(1.2)' : undefined,
          }}
        />
      ))}
    </div>
  )
}

// ─── Create Pragma dialog ─────────────────────────────────────────────────────

function CreatePragmaDialog({
  isOpen,
  profileId,
  onClose,
  onCreate,
}: {
  isOpen: boolean
  profileId: string
  onClose: () => void
  onCreate: (pragma: PragmaProject) => void
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState(COVER_COLORS[0])
  const [busy, setBusy] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 50)
    else { setName(''); setDescription(''); setColor(COVER_COLORS[0]) }
  }, [isOpen])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || busy) return
    setBusy(true)
    const pragma = (await window.pragma.pragma.create({
      profileId,
      name: name.trim(),
      description: description.trim() || undefined,
      coverColor: color,
    })) as PragmaProject
    setBusy(false)
    onCreate(pragma)
  }

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="New Pragma">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <ColorPicker value={color} onChange={setColor} />

        <input
          ref={inputRef}
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)',
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--color-brand)')}
          onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
        />

        <input
          type="text"
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={120}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)',
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--color-brand)')}
          onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
        />

        <div className="flex gap-2">
          <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" className="flex-1" disabled={!name.trim() || busy}>
            {busy ? 'Creating…' : 'Create'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

// ─── Create Board dialog ──────────────────────────────────────────────────────

function CreateBoardDialog({
  isOpen,
  pragmaId,
  onClose,
  onCreate,
}: {
  isOpen: boolean
  pragmaId: string
  onClose: () => void
  onCreate: (board: Board) => void
}) {
  const [name, setName] = useState('')
  const [template, setTemplate] = useState<BoardTemplate>('kanban')
  const [color, setColor] = useState(COVER_COLORS[0])
  const [busy, setBusy] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 50)
    else { setName(''); setTemplate('kanban'); setColor(COVER_COLORS[0]) }
  }, [isOpen])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || busy) return
    setBusy(true)
    const board = (await window.pragma.board.create({
      pragmaId,
      name: name.trim(),
      coverColor: color,
      template,
    })) as Board
    setBusy(false)
    onCreate(board)
  }

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="New Board" width="max-w-md">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          ref={inputRef}
          type="text"
          placeholder="Board name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)',
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--color-brand)')}
          onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
        />

        {/* Template picker */}
        <div className="grid grid-cols-2 gap-2">
          {TEMPLATES.map(({ key, label, desc }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTemplate(key)}
              className={cn(
                'flex flex-col gap-0.5 p-3 rounded-xl text-left cursor-pointer transition-colors duration-100',
                template === key ? 'ring-2' : ''
              )}
              style={{
                background: template === key ? 'var(--color-brand-subtle)' : 'var(--bg-surface)',
                ringColor: 'var(--color-brand)',
                boxShadow: template === key ? `0 0 0 2px var(--color-brand)` : undefined,
              }}
            >
              <span
                className="text-sm font-medium"
                style={{ color: template === key ? 'var(--color-brand)' : 'var(--text-primary)' }}
              >
                {label}
              </span>
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                {desc}
              </span>
            </button>
          ))}
        </div>

        <div>
          <p className="text-xs mb-2" style={{ color: 'var(--text-tertiary)' }}>
            Cover color
          </p>
          <ColorPicker value={color} onChange={setColor} />
        </div>

        <div className="flex gap-2">
          <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" className="flex-1" disabled={!name.trim() || busy}>
            {busy ? 'Creating…' : 'Create'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

// ─── Confirm delete dialog ────────────────────────────────────────────────────

function ConfirmDialog({
  isOpen,
  message,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean
  message: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <Dialog isOpen={isOpen} onClose={onCancel}>
      <p className="text-sm text-center" style={{ color: 'var(--text-secondary)' }}>
        {message}
      </p>
      <div className="flex gap-2">
        <Button variant="ghost" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="danger" className="flex-1" onClick={onConfirm}>
          Delete
        </Button>
      </div>
    </Dialog>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({
  profile,
  pragmas,
  activePragmaId,
  onSelectPragma,
  onNewPragma,
  onDeletePragma,
  onRenamePragma,
  onSwitchProfile,
}: {
  profile: Profile
  pragmas: PragmaProject[]
  activePragmaId: string | null
  onSelectPragma: (id: string) => void
  onNewPragma: () => void
  onDeletePragma: (id: string) => void
  onRenamePragma: (id: string, name: string) => void
  onSwitchProfile: () => void
}) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const editInputRef = useRef<HTMLInputElement>(null)

  function startEdit(pragma: PragmaProject) {
    setEditingId(pragma.id)
    setEditName(pragma.name)
    setTimeout(() => editInputRef.current?.focus(), 30)
  }

  function commitEdit(id: string) {
    if (editName.trim()) onRenamePragma(id, editName.trim())
    setEditingId(null)
  }

  function cancelEdit() {
    setEditingId(null)
  }

  return (
    <aside
      className="flex flex-col h-full shrink-0 select-none"
      style={{
        width: 220,
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-subtle)',
      }}
    >
      {/* Profile section */}
      <div className="p-4 flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-sm font-semibold text-white"
          style={{ background: profile.color }}
        >
          {avatarInitials(profile.name)}
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-medium truncate"
            style={{ color: 'var(--text-primary)' }}
          >
            {profile.name}
          </p>
          <button
            onClick={onSwitchProfile}
            className="text-xs cursor-pointer transition-colors duration-100"
            style={{ color: 'var(--text-tertiary)' }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = 'var(--color-brand)')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = 'var(--text-tertiary)')
            }
          >
            Switch profile
          </button>
        </div>
      </div>

      <div style={{ height: 1, background: 'var(--border-subtle)', margin: '0 12px' }} />

      {/* Pragma list */}
      <div className="flex-1 overflow-y-auto py-3 px-2 flex flex-col gap-0.5">
        <p
          className="text-xs font-semibold uppercase tracking-widest px-2 pb-1"
          style={{ color: 'var(--text-tertiary)', letterSpacing: '0.08em' }}
        >
          Pragmas
        </p>

        {pragmas.map((pragma) => (
          <div
            key={pragma.id}
            className="relative flex items-center rounded-lg px-2 py-1.5 cursor-pointer transition-colors duration-100 group"
            style={{
              background:
                activePragmaId === pragma.id
                  ? 'var(--color-brand-subtle)'
                  : hoveredId === pragma.id
                  ? 'var(--bg-subtle)'
                  : 'transparent',
            }}
            onClick={() => editingId !== pragma.id && onSelectPragma(pragma.id)}
            onMouseEnter={() => setHoveredId(pragma.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            {/* Color dot */}
            <span
              className="w-2 h-2 rounded-full shrink-0 mr-2"
              style={{ background: pragma.coverColor ?? 'var(--border-medium)' }}
            />

            {/* Name — inline edit */}
            {editingId === pragma.id ? (
              <input
                ref={editInputRef}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={() => commitEdit(pragma.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitEdit(pragma.id)
                  if (e.key === 'Escape') cancelEdit()
                  e.stopPropagation()
                }}
                maxLength={60}
                className="flex-1 min-w-0 text-sm outline-none bg-transparent"
                style={{ color: 'var(--text-primary)' }}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span
                className="flex-1 min-w-0 text-sm truncate"
                style={{
                  color:
                    activePragmaId === pragma.id
                      ? 'var(--color-brand)'
                      : 'var(--text-secondary)',
                  fontWeight: activePragmaId === pragma.id ? 500 : 400,
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation()
                  startEdit(pragma)
                }}
              >
                {pragma.name}
              </span>
            )}

            {/* Actions — visible on hover */}
            {hoveredId === pragma.id && editingId !== pragma.id && (
              <div className="flex items-center gap-0.5 shrink-0 ml-1">
                <button
                  title="Rename"
                  className="p-0.5 rounded cursor-pointer opacity-50 hover:opacity-100 transition-opacity"
                  style={{ color: 'var(--text-secondary)' }}
                  onClick={(e) => {
                    e.stopPropagation()
                    startEdit(pragma)
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M11.013 1.427a1.75 1.75 0 012.474 0l1.086 1.086a1.75 1.75 0 010 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 01-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61zm1.414 1.06a.25.25 0 00-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 000-.354l-1.086-1.086zM11.189 6.25L9.75 4.81 3.23 11.33a.25.25 0 00-.064.108l-.618 2.162 2.162-.617a.25.25 0 00.108-.064l6.521-6.52-.15-.149z" />
                  </svg>
                </button>
                <button
                  title="Delete pragma"
                  className="p-0.5 rounded cursor-pointer opacity-50 hover:opacity-100 transition-opacity"
                  style={{ color: '#ef4444' }}
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeletePragma(pragma.id)
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M6.5 1.75a.25.25 0 01.25-.25h2.5a.25.25 0 01.25.25V3h-3V1.75zm4.5 0V3h2.25a.75.75 0 010 1.5H2.75a.75.75 0 010-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75zM4.496 6.675l.66 6.6a.25.25 0 00.249.225h5.19a.25.25 0 00.249-.225l.66-6.6a.75.75 0 011.492.149l-.66 6.6A1.748 1.748 0 0111.595 15h-5.19a1.75 1.75 0 01-1.741-1.575l-.66-6.6a.75.75 0 011.492-.15z" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* New Pragma button */}
      <div className="p-3">
        <button
          onClick={onNewPragma}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors duration-100"
          style={{ color: 'var(--text-tertiary)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--bg-subtle)'
            e.currentTarget.style.color = 'var(--text-secondary)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--text-tertiary)'
          }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M7.75 2a.75.75 0 01.75.75V7h4.25a.75.75 0 010 1.5H8.5v4.25a.75.75 0 01-1.5 0V8.5H2.75a.75.75 0 010-1.5H7V2.75A.75.75 0 017.75 2z" />
          </svg>
          New Pragma
        </button>
      </div>
    </aside>
  )
}

// ─── Board card ───────────────────────────────────────────────────────────────

function BoardCard({
  board,
  onOpen,
  onDelete,
}: {
  board: Board
  onOpen: () => void
  onDelete: () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className="relative flex flex-col rounded-2xl overflow-hidden cursor-pointer transition-transform duration-150 hover:-translate-y-0.5"
      style={{
        background: 'var(--bg-card)',
        boxShadow: 'var(--shadow-card)',
        border: '1px solid var(--border-subtle)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onOpen}
    >
      {/* Cover strip */}
      <div
        className="h-16 w-full shrink-0"
        style={{ background: board.coverColor ?? 'var(--color-brand)' }}
      />

      {/* Content */}
      <div className="p-3 flex items-center justify-between gap-2">
        <span
          className="text-sm font-medium truncate"
          style={{ color: 'var(--text-primary)' }}
        >
          {board.name}
        </span>

        {/* Delete button — visible on hover */}
        {hovered && (
          <button
            title="Delete board"
            className="shrink-0 p-1 rounded cursor-pointer opacity-60 hover:opacity-100 transition-opacity"
            style={{ color: '#ef4444' }}
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
              <path d="M6.5 1.75a.25.25 0 01.25-.25h2.5a.25.25 0 01.25.25V3h-3V1.75zm4.5 0V3h2.25a.75.75 0 010 1.5H2.75a.75.75 0 010-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75zM4.496 6.675l.66 6.6a.25.25 0 00.249.225h5.19a.25.25 0 00.249-.225l.66-6.6a.75.75 0 011.492.149l-.66 6.6A1.748 1.748 0 0111.595 15h-5.19a1.75 1.75 0 01-1.741-1.575l-.66-6.6a.75.75 0 011.492-.15z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Home screen ──────────────────────────────────────────────────────────────

export function HomeScreen() {
  const activeProfileId = useAppStore((s) => s.activeProfileId)!
  const activePragmaId = useAppStore((s) => s.activePragmaId)
  const setActivePragma = useAppStore((s) => s.setActivePragma)
  const setActiveBoard = useAppStore((s) => s.setActiveBoard)
  const setActiveProfile = useAppStore((s) => s.setActiveProfile)
  const setView = useAppStore((s) => s.setView)

  const [profile, setProfile] = useState<Profile | null>(null)
  const [pragmas, setPragmas] = useState<PragmaProject[]>([])
  const [boards, setBoards] = useState<Board[]>([])

  const [showCreatePragma, setShowCreatePragma] = useState(false)
  const [showCreateBoard, setShowCreateBoard] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<{
    type: 'pragma' | 'board'
    id: string
    name: string
  } | null>(null)

  // Load profile + pragmas
  useEffect(() => {
    window.pragma.profile.list().then((list) => {
      const p = (list as Profile[]).find((x) => x.id === activeProfileId)
      setProfile(p ?? null)
    })
    window.pragma.pragma.list(activeProfileId).then((list) => {
      const items = list as PragmaProject[]
      setPragmas(items)
      if (!activePragmaId && items.length > 0) {
        setActivePragma(items[0].id)
      }
    })
  }, [activeProfileId])

  // Load boards when active pragma changes
  useEffect(() => {
    if (!activePragmaId) { setBoards([]); return }
    window.pragma.board.list(activePragmaId).then((list) => setBoards(list as Board[]))
  }, [activePragmaId])

  // ── Pragma CRUD ──

  function handlePragmaCreated(pragma: PragmaProject) {
    setPragmas((prev) => [...prev, pragma])
    setActivePragma(pragma.id)
    setShowCreatePragma(false)
  }

  async function handleRenamePragma(id: string, name: string) {
    await window.pragma.pragma.update(id, { name })
    setPragmas((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)))
  }

  async function executeDeletePragma(id: string) {
    await window.pragma.pragma.delete(id)
    const remaining = pragmas.filter((p) => p.id !== id)
    setPragmas(remaining)
    if (activePragmaId === id) {
      setActivePragma(remaining.length > 0 ? remaining[0].id : null)
    }
    setConfirmDelete(null)
  }

  // ── Board CRUD ──

  function handleBoardCreated(board: Board) {
    setBoards((prev) => [...prev, board])
    setShowCreateBoard(false)
    // Navigate into the new board
    setActiveBoard(board.id)
    setView('board')
  }

  async function executeDeleteBoard(id: string) {
    await window.pragma.board.delete(id)
    setBoards((prev) => prev.filter((b) => b.id !== id))
    setConfirmDelete(null)
  }

  function openBoard(board: Board) {
    setActiveBoard(board.id)
    setView('board')
  }

  function switchProfile() {
    setActiveProfile(null)
    setActivePragma(null)
    setActiveBoard(null)
    setView('profiles')
  }

  if (!profile) return null

  const activePragma = pragmas.find((p) => p.id === activePragmaId) ?? null

  return (
    <>
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          profile={profile}
          pragmas={pragmas}
          activePragmaId={activePragmaId}
          onSelectPragma={setActivePragma}
          onNewPragma={() => setShowCreatePragma(true)}
          onDeletePragma={(id) => {
            const pragma = pragmas.find((p) => p.id === id)!
            setConfirmDelete({ type: 'pragma', id, name: pragma.name })
          }}
          onRenamePragma={handleRenamePragma}
          onSwitchProfile={switchProfile}
        />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-8 flex flex-col gap-6">
          {pragmas.length === 0 ? (
            /* ── No pragmas empty state ── */
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                No pragmas yet. Create one to get started.
              </p>
              <Button variant="primary" onClick={() => setShowCreatePragma(true)}>
                New Pragma
              </Button>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1
                    className="text-xl font-semibold tracking-tight"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {activePragma?.name ?? ''}
                  </h1>
                  {activePragma?.description && (
                    <p className="text-sm mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                      {activePragma.description}
                    </p>
                  )}
                </div>
                {activePragmaId && (
                  <Button variant="primary" size="sm" onClick={() => setShowCreateBoard(true)}>
                    + New Board
                  </Button>
                )}
              </div>

              {/* Board grid */}
              {activePragmaId && (
                <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
                  {boards.map((board) => (
                    <BoardCard
                      key={board.id}
                      board={board}
                      onOpen={() => openBoard(board)}
                      onDelete={() =>
                        setConfirmDelete({ type: 'board', id: board.id, name: board.name })
                      }
                    />
                  ))}

                  {/* New board tile */}
                  <button
                    onClick={() => setShowCreateBoard(true)}
                    className="flex flex-col items-center justify-center gap-2 rounded-2xl cursor-pointer transition-colors duration-150"
                    style={{
                      minHeight: 100,
                      border: '2px dashed var(--border-medium)',
                      color: 'var(--text-tertiary)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-brand)'
                      e.currentTarget.style.color = 'var(--color-brand)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-medium)'
                      e.currentTarget.style.color = 'var(--text-tertiary)'
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M7.75 2a.75.75 0 01.75.75V7h4.25a.75.75 0 010 1.5H8.5v4.25a.75.75 0 01-1.5 0V8.5H2.75a.75.75 0 010-1.5H7V2.75A.75.75 0 017.75 2z" />
                    </svg>
                    <span className="text-sm">New Board</span>
                  </button>
                </div>
              )}

              {/* No boards empty state */}
              {activePragmaId && boards.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                    No boards in this Pragma yet.
                  </p>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Dialogs */}
      {activeProfileId && (
        <CreatePragmaDialog
          isOpen={showCreatePragma}
          profileId={activeProfileId}
          onClose={() => setShowCreatePragma(false)}
          onCreate={handlePragmaCreated}
        />
      )}

      {activePragmaId && (
        <CreateBoardDialog
          isOpen={showCreateBoard}
          pragmaId={activePragmaId}
          onClose={() => setShowCreateBoard(false)}
          onCreate={handleBoardCreated}
        />
      )}

      <ConfirmDialog
        isOpen={!!confirmDelete}
        message={
          confirmDelete
            ? confirmDelete.type === 'pragma'
              ? `Delete "${confirmDelete.name}" and all its boards and cards? This cannot be undone.`
              : `Delete board "${confirmDelete.name}" and all its cards? This cannot be undone.`
            : ''
        }
        onConfirm={() => {
          if (!confirmDelete) return
          if (confirmDelete.type === 'pragma') executeDeletePragma(confirmDelete.id)
          else executeDeleteBoard(confirmDelete.id)
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </>
  )
}
