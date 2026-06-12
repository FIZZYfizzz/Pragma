import { useRef, useState } from 'react'
import type { CardWithTags } from '@shared/types'
import { cn } from '@/lib/cn'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { useBoardStore } from '@/stores/board.store'

const TAG_COLORS = [
  '#7c6af7', '#60a5fa', '#f472b6', '#34d399',
  '#fbbf24', '#f87171', '#a78bfa', '#fb923c',
  '#6ee7b7', '#94a3b8', '#e879f9', '#2dd4bf',
]

// ─── Manage-only dialog (from board header) ───────────────────────────────────

export function TagManagerDialog({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const { pragmaTags, createTag, deleteTag } = useBoardStore()
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(TAG_COLORS[0]!)
  const [creating, setCreating] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim() || creating) return
    setCreating(true)
    await createTag(newName.trim(), newColor)
    setNewName('')
    setNewColor(TAG_COLORS[0]!)
    setCreating(false)
    inputRef.current?.focus()
  }

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Manage Tags" width="max-w-xs">
      {/* Tag list */}
      <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
        {pragmaTags.length === 0 && (
          <p className="text-xs text-center py-3" style={{ color: 'var(--text-tertiary)' }}>
            No tags yet
          </p>
        )}
        {pragmaTags.map((tag) => (
          <div key={tag.id} className="flex items-center gap-2 px-1 py-1 rounded-lg group">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ background: tag.color }}
            />
            <span className="flex-1 text-sm" style={{ color: 'var(--text-primary)' }}>
              {tag.name}
            </span>
            <button
              onClick={() => deleteTag(tag.id)}
              className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity cursor-pointer p-0.5 rounded"
              style={{ color: '#ef4444' }}
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                <path d="M6.5 1.75a.25.25 0 01.25-.25h2.5a.25.25 0 01.25.25V3h-3V1.75zm4.5 0V3h2.25a.75.75 0 010 1.5H2.75a.75.75 0 010-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75zM4.496 6.675l.66 6.6a.25.25 0 00.249.225h5.19a.25.25 0 00.249-.225l.66-6.6a.75.75 0 011.492.149l-.66 6.6A1.748 1.748 0 0111.595 15h-5.19a1.75 1.75 0 01-1.741-1.575l-.66-6.6a.75.75 0 011.492-.15z" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <div style={{ height: 1, background: 'var(--border-subtle)' }} />

      {/* Create tag form */}
      <form onSubmit={handleCreate} className="flex flex-col gap-3">
        <input
          ref={inputRef}
          type="text"
          placeholder="New tag name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          maxLength={30}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)',
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--color-brand)')}
          onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
        />
        <div className="flex gap-1.5 flex-wrap">
          {TAG_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setNewColor(color)}
              className="w-5 h-5 rounded-full cursor-pointer transition-transform duration-100"
              style={{
                background: color,
                boxShadow:
                  newColor === color ? `0 0 0 2px var(--bg-elevated), 0 0 0 4px ${color}` : undefined,
                transform: newColor === color ? 'scale(1.2)' : undefined,
              }}
            />
          ))}
        </div>
        <Button type="submit" variant="primary" size="sm" disabled={!newName.trim() || creating}>
          {creating ? 'Creating…' : 'Create Tag'}
        </Button>
      </form>
    </Dialog>
  )
}

// ─── Card tag picker dialog ───────────────────────────────────────────────────

export function CardTagPickerDialog({
  isOpen,
  card,
  laneId,
  onClose,
}: {
  isOpen: boolean
  card: CardWithTags
  laneId: string
  onClose: () => void
}) {
  const { pragmaTags, toggleCardTag, createTag } = useBoardStore()
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(TAG_COLORS[0]!)
  const [creating, setCreating] = useState(false)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim() || creating) return
    setCreating(true)
    await createTag(newName.trim(), newColor)
    setNewName('')
    setNewColor(TAG_COLORS[0]!)
    setCreating(false)
    setShowCreate(false)
  }

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Tags" width="max-w-xs">
      {/* Tag toggle list */}
      <div className="flex flex-col gap-0.5 max-h-52 overflow-y-auto">
        {pragmaTags.length === 0 && !showCreate && (
          <p className="text-xs text-center py-3" style={{ color: 'var(--text-tertiary)' }}>
            No tags yet — create one below
          </p>
        )}
        {pragmaTags.map((tag) => {
          const active = card.tags.some((t) => t.id === tag.id)
          return (
            <button
              key={tag.id}
              onClick={() => toggleCardTag(card.id, laneId, tag.id)}
              className={cn(
                'flex items-center gap-2.5 px-2 py-2 rounded-lg w-full text-left cursor-pointer transition-colors duration-100'
              )}
              style={{
                background: active ? 'var(--color-brand-subtle)' : 'transparent',
              }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.background = 'var(--bg-subtle)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = active ? 'var(--color-brand-subtle)' : 'transparent'
              }}
            >
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ background: tag.color }}
              />
              <span
                className="flex-1 text-sm"
                style={{ color: active ? 'var(--color-brand)' : 'var(--text-primary)' }}
              >
                {tag.name}
              </span>
              {active && (
                <svg width="12" height="12" viewBox="0 0 16 16" fill="var(--color-brand)">
                  <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.751.751 0 011.042-1.08L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
                </svg>
              )}
            </button>
          )
        })}
      </div>

      {/* Create tag inline form */}
      {showCreate ? (
        <form onSubmit={handleCreate} className="flex flex-col gap-2 pt-1">
          <input
            autoFocus
            type="text"
            placeholder="Tag name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            maxLength={30}
            className="w-full px-3 py-1.5 rounded-lg text-sm outline-none"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--color-brand)',
              color: 'var(--text-primary)',
            }}
          />
          <div className="flex gap-1.5 flex-wrap">
            {TAG_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setNewColor(color)}
                className="w-5 h-5 rounded-full cursor-pointer"
                style={{
                  background: color,
                  boxShadow:
                    newColor === color ? `0 0 0 2px var(--bg-elevated), 0 0 0 4px ${color}` : undefined,
                  transform: newColor === color ? 'scale(1.2)' : undefined,
                }}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" size="sm" className="flex-1" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" className="flex-1" disabled={!newName.trim()}>
              Create
            </Button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 text-sm px-2 py-1.5 rounded-lg w-full cursor-pointer transition-colors"
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
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
            <path d="M7.75 2a.75.75 0 01.75.75V7h4.25a.75.75 0 010 1.5H8.5v4.25a.75.75 0 01-1.5 0V8.5H2.75a.75.75 0 010-1.5H7V2.75A.75.75 0 017.75 2z" />
          </svg>
          New tag
        </button>
      )}
    </Dialog>
  )
}
