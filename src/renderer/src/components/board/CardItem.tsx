import { useEffect, useRef, useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { CardWithTags, Priority } from '@shared/types'
import { cn } from '@/lib/cn'
import { useBoardStore } from '@/stores/board.store'

// ─── Priority ─────────────────────────────────────────────────────────────────

const PRIORITY_COLORS: Record<Priority, string> = {
  none:   'transparent',
  low:    '#4ade80',
  medium: '#fbbf24',
  high:   '#f97316',
  urgent: '#ef4444',
}

const PRIORITY_LABELS: Record<Priority, string> = {
  none: 'No priority', low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent',
}

// ─── Card item ────────────────────────────────────────────────────────────────

interface CardItemProps {
  card: CardWithTags
  laneId: string
  overlay?: boolean
}

export function CardItem({ card, laneId, overlay = false }: CardItemProps) {
  const { updateCard, deleteCard, cycleCardPriority } = useBoardStore()
  const [hovered, setHovered] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(card.title)
  const inputRef = useRef<HTMLInputElement>(null)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id, disabled: editing })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  useEffect(() => {
    if (editing) {
      setEditTitle(card.title)
      setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      }, 20)
    }
  }, [editing])

  async function commitEdit() {
    const title = editTitle.trim()
    if (title && title !== card.title) {
      await updateCard(card.id, laneId, { title })
    }
    setEditing(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') { e.preventDefault(); commitEdit() }
    if (e.key === 'Escape') { setEditing(false); setEditTitle(card.title) }
    e.stopPropagation()
  }

  if (overlay) {
    return (
      <div
        className="rounded-xl px-3 py-2.5 shadow-xl rotate-1"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-medium)',
          borderLeft: `3px solid ${PRIORITY_COLORS[card.priority]}`,
          width: 260,
          cursor: 'grabbing',
        }}
      >
        <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
          {card.title}
        </span>
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        opacity: isDragging ? 0.3 : 1,
      }}
      className="group relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className={cn(
          'rounded-xl px-3 py-2.5 flex items-start gap-2 transition-shadow duration-100',
          !isDragging && 'hover:shadow-md'
        )}
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderLeft: `3px solid ${PRIORITY_COLORS[card.priority]}`,
          boxShadow: 'var(--shadow-card)',
          cursor: editing ? 'text' : 'grab',
        }}
        {...(!editing ? { ...attributes, ...listeners } : {})}
      >
        {/* Title area */}
        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              ref={inputRef}
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={handleKeyDown}
              className="w-full text-sm bg-transparent outline-none"
              style={{ color: 'var(--text-primary)' }}
            />
          ) : (
            <span
              className="text-sm block"
              style={{ color: 'var(--text-primary)', wordBreak: 'break-word' }}
              onDoubleClick={() => setEditing(true)}
            >
              {card.title}
            </span>
          )}
        </div>

        {/* Hover actions */}
        {hovered && !editing && (
          <div className="flex items-center gap-1 shrink-0 -mr-1">
            {/* Priority dot */}
            <button
              title={PRIORITY_LABELS[card.priority]}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => cycleCardPriority(card.id, laneId)}
              className="w-4 h-4 rounded-full cursor-pointer transition-transform hover:scale-125"
              style={{
                background:
                  card.priority === 'none'
                    ? 'var(--border-medium)'
                    : PRIORITY_COLORS[card.priority],
              }}
            />
            {/* Edit */}
            <button
              title="Edit title"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => setEditing(true)}
              className="p-0.5 rounded cursor-pointer opacity-50 hover:opacity-100 transition-opacity"
              style={{ color: 'var(--text-secondary)' }}
            >
              <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
                <path d="M11.013 1.427a1.75 1.75 0 012.474 0l1.086 1.086a1.75 1.75 0 010 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 01-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61zm1.414 1.06a.25.25 0 00-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 000-.354l-1.086-1.086zM11.189 6.25L9.75 4.81 3.23 11.33a.25.25 0 00-.064.108l-.618 2.162 2.162-.617a.25.25 0 00.108-.064l6.521-6.52-.15-.149z" />
              </svg>
            </button>
            {/* Delete */}
            <button
              title="Delete card"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => deleteCard(card.id, laneId)}
              className="p-0.5 rounded cursor-pointer opacity-50 hover:opacity-100 transition-opacity"
              style={{ color: '#ef4444' }}
            >
              <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
                <path d="M6.5 1.75a.25.25 0 01.25-.25h2.5a.25.25 0 01.25.25V3h-3V1.75zm4.5 0V3h2.25a.75.75 0 010 1.5H2.75a.75.75 0 010-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75zM4.496 6.675l.66 6.6a.25.25 0 00.249.225h5.19a.25.25 0 00.249-.225l.66-6.6a.75.75 0 011.492.149l-.66 6.6A1.748 1.748 0 0111.595 15h-5.19a1.75 1.75 0 01-1.741-1.575l-.66-6.6a.75.75 0 011.492-.15z" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
