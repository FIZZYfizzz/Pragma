import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import type { CardWithTags, Priority } from '@shared/types'
import { cn } from '@/lib/cn'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { useBoardStore } from '@/stores/board.store'

const PRIORITY_OPTIONS: { value: Priority; label: string; color: string }[] = [
  { value: 'none', label: 'None', color: 'var(--border-medium)' },
  { value: 'low', label: 'Low', color: '#4ade80' },
  { value: 'medium', label: 'Medium', color: '#fbbf24' },
  { value: 'high', label: 'High', color: '#f97316' },
  { value: 'urgent', label: 'Urgent', color: '#ef4444' },
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

interface CardDetailDialogProps {
  isOpen: boolean
  card: CardWithTags
  laneId: string
  onClose: () => void
  onOpenTags: () => void
}

export function CardDetailDialog({ isOpen, card, laneId, onClose, onOpenTags }: CardDetailDialogProps) {
  const { updateCard, deleteCard } = useBoardStore()
  const [title, setTitle] = useState(card.title)
  const [description, setDescription] = useState(card.description ?? '')
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Re-sync local fields each time the dialog opens for a (possibly different) card
  useEffect(() => {
    if (isOpen) {
      setTitle(card.title)
      setDescription(card.description ?? '')
      setConfirmDelete(false)
    }
  }, [isOpen, card.id])

  function commitTitle() {
    const next = title.trim()
    if (next && next !== card.title) updateCard(card.id, laneId, { title: next })
    else setTitle(card.title)
  }

  function commitDescription() {
    const next = description.trim()
    const current = card.description ?? ''
    if (next !== current) updateCard(card.id, laneId, { description: next || null })
  }

  function setPriority(priority: Priority) {
    if (priority !== card.priority) updateCard(card.id, laneId, { priority })
  }

  function setDueDate(value: string) {
    if (!value) {
      updateCard(card.id, laneId, { dueDate: null })
      return
    }
    // Parse yyyy-MM-dd as local midnight
    const [y, m, d] = value.split('-').map(Number)
    updateCard(card.id, laneId, { dueDate: new Date(y!, m! - 1, d!).getTime() })
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    await deleteCard(card.id, laneId)
    onClose()
  }

  const dueDateValue = card.dueDate ? format(card.dueDate, 'yyyy-MM-dd') : ''

  return (
    <Dialog isOpen={isOpen} onClose={onClose} width="max-w-md">
      {/* Title */}
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={commitTitle}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
        }}
        maxLength={200}
        className="w-full text-base font-semibold bg-transparent outline-none rounded-lg px-2 py-1 -mx-2"
        style={{ color: 'var(--text-primary)' }}
        placeholder="Card title"
      />

      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <SectionLabel>Description</SectionLabel>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={commitDescription}
          rows={4}
          maxLength={2000}
          placeholder="Add more detail…"
          className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none leading-relaxed"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)',
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--color-brand)')}
        />
      </div>

      {/* Priority */}
      <div className="flex flex-col gap-1.5">
        <SectionLabel>Priority</SectionLabel>
        <div className="flex gap-1.5">
          {PRIORITY_OPTIONS.map((opt) => {
            const active = card.priority === opt.value
            return (
              <button
                key={opt.value}
                onClick={() => setPriority(opt.value)}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors'
                )}
                style={{
                  background: active ? 'var(--bg-subtle)' : 'transparent',
                  border: `1px solid ${active ? opt.color : 'var(--border-subtle)'}`,
                  color: active ? 'var(--text-primary)' : 'var(--text-tertiary)',
                }}
              >
                <span className="w-2 h-2 rounded-full" style={{ background: opt.color }} />
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Due date */}
      <div className="flex flex-col gap-1.5">
        <SectionLabel>Due date</SectionLabel>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dueDateValue}
            onChange={(e) => setDueDate(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-sm outline-none cursor-pointer"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              color: card.dueDate ? 'var(--text-primary)' : 'var(--text-tertiary)',
            }}
          />
          {card.dueDate && (
            <Button variant="ghost" size="sm" onClick={() => setDueDate('')}>
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-col gap-1.5">
        <SectionLabel>Tags</SectionLabel>
        <div className="flex items-center gap-1.5 flex-wrap">
          {card.tags.map((tag) => (
            <span
              key={tag.id}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium"
              style={{
                background: `color-mix(in srgb, ${tag.color} 15%, transparent)`,
                color: tag.color,
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: tag.color }} />
              {tag.name}
            </span>
          ))}
          <button
            onClick={onOpenTags}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs cursor-pointer transition-colors"
            style={{ color: 'var(--text-tertiary)', border: '1px dashed var(--border-medium)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-brand)'
              e.currentTarget.style.color = 'var(--color-brand)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-medium)'
              e.currentTarget.style.color = 'var(--text-tertiary)'
            }}
          >
            <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
              <path d="M7.75 2a.75.75 0 01.75.75V7h4.25a.75.75 0 010 1.5H8.5v4.25a.75.75 0 01-1.5 0V8.5H2.75a.75.75 0 010-1.5H7V2.75A.75.75 0 017.75 2z" />
            </svg>
            Edit tags
          </button>
        </div>
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between pt-1"
        style={{ borderTop: '1px solid var(--border-subtle)', marginTop: 4, paddingTop: 14 }}
      >
        <Button variant="danger" size="sm" onClick={handleDelete} onBlur={() => setConfirmDelete(false)}>
          {confirmDelete ? 'Confirm delete?' : 'Delete card'}
        </Button>
        <Button variant="primary" size="sm" onClick={onClose}>
          Done
        </Button>
      </div>
    </Dialog>
  )
}
