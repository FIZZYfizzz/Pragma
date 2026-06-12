import { useEffect, useRef, useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { format, isBefore, isToday, startOfDay } from 'date-fns'
import type { CardWithTags, Priority } from '@shared/types'
import { cn } from '@/lib/cn'
import { useBoardStore } from '@/stores/board.store'
import { CardTagPickerDialog } from './TagsDialog'
import { CardDetailDialog } from './CardDetailDialog'

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

// ─── Due date chip ────────────────────────────────────────────────────────────

function DueDateChip({ dueDate }: { dueDate: number }) {
  const overdue = isBefore(dueDate, startOfDay(new Date()))
  const today = isToday(dueDate)
  const color = overdue ? '#ef4444' : today ? '#fbbf24' : 'var(--text-tertiary)'
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] font-medium"
      style={{ color }}
      title={overdue ? 'Overdue' : today ? 'Due today' : 'Due date'}
    >
      <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 0a8 8 0 110 16A8 8 0 018 0zM1.5 8a6.5 6.5 0 1013 0 6.5 6.5 0 00-13 0zm7-3.25v2.992l2.028 .812a.75.75 0 01-.557 1.392l-2.5-1A.751.751 0 017 8.25v-3.5a.75.75 0 011.5 0z" />
      </svg>
      {today ? 'Today' : format(dueDate, 'd MMM')}
    </span>
  )
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
  const [tagPickerOpen, setTagPickerOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  // A drag's trailing click would otherwise open the detail dialog after every drop
  const wasDragged = useRef(false)

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
    if (isDragging) wasDragged.current = true
  }, [isDragging])

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

  const hasMeta = card.dueDate != null || !!card.description || card.tags.length > 0

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
        onClick={() => {
          if (wasDragged.current) {
            wasDragged.current = false
            return
          }
          if (!editing && !isDragging) setDetailOpen(true)
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
              onClick={(e) => e.stopPropagation()}
              className="w-full text-sm bg-transparent outline-none"
              style={{ color: 'var(--text-primary)' }}
            />
          ) : (
            <span
              className="text-sm block"
              style={{ color: 'var(--text-primary)', wordBreak: 'break-word' }}
            >
              {card.title}
            </span>
          )}

          {/* Meta row: due date, description indicator, tag dots */}
          {hasMeta && (
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {card.dueDate != null && <DueDateChip dueDate={card.dueDate} />}
              {!!card.description && (
                <svg
                  width="11" height="11" viewBox="0 0 16 16"
                  style={{ fill: 'var(--text-tertiary)' }}
                >
                  <title>Has description</title>
                  <path d="M0 3.75A.75.75 0 01.75 3h14.5a.75.75 0 010 1.5H.75A.75.75 0 010 3.75zm0 4A.75.75 0 01.75 7h14.5a.75.75 0 010 1.5H.75A.75.75 0 010 7.75zm0 4a.75.75 0 01.75-.75h8.5a.75.75 0 010 1.5H.75a.75.75 0 01-.75-.75z" />
                </svg>
              )}
              {card.tags.length > 0 && (
                <span className="flex items-center gap-1">
                  {card.tags.slice(0, 5).map((tag) => (
                    <span
                      key={tag.id}
                      title={tag.name}
                      className="w-2 h-2 rounded-full"
                      style={{ background: tag.color }}
                    />
                  ))}
                  {card.tags.length > 5 && (
                    <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      +{card.tags.length - 5}
                    </span>
                  )}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Hover actions */}
        {hovered && !editing && (
          <div className="flex items-center gap-1 shrink-0 -mr-1">
            {/* Priority dot */}
            <button
              title={PRIORITY_LABELS[card.priority]}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); cycleCardPriority(card.id, laneId) }}
              className="w-4 h-4 rounded-full cursor-pointer transition-transform hover:scale-125"
              style={{
                background:
                  card.priority === 'none' ? 'var(--border-medium)' : PRIORITY_COLORS[card.priority],
              }}
            />
            {/* Tags */}
            <button
              title="Tags"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); setTagPickerOpen(true) }}
              className="p-0.5 rounded cursor-pointer opacity-50 hover:opacity-100 transition-opacity"
              style={{ color: 'var(--text-secondary)' }}
            >
              <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
                <path d="M1 7.775V2.75C1 1.784 1.784 1 2.75 1h5.025c.464 0 .91.184 1.238.513l6.25 6.25a1.75 1.75 0 010 2.474l-5.026 5.026a1.75 1.75 0 01-2.474 0l-6.25-6.25A1.752 1.752 0 011 7.775zm1.5 0c0 .066.026.13.073.177l6.25 6.25a.25.25 0 00.354 0l5.025-5.025a.25.25 0 000-.354l-6.25-6.25a.25.25 0 00-.177-.073H2.75a.25.25 0 00-.25.25zM6 5a1 1 0 110 2 1 1 0 010-2z" />
              </svg>
            </button>
            {/* Edit */}
            <button
              title="Edit title"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); setEditing(true) }}
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
              onClick={(e) => { e.stopPropagation(); deleteCard(card.id, laneId) }}
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

      <CardDetailDialog
        isOpen={detailOpen}
        card={card}
        laneId={laneId}
        onClose={() => setDetailOpen(false)}
        onOpenTags={() => setTagPickerOpen(true)}
      />

      <CardTagPickerDialog
        isOpen={tagPickerOpen}
        card={card}
        laneId={laneId}
        onClose={() => setTagPickerOpen(false)}
      />
    </div>
  )
}
