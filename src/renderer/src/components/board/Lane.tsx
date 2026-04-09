import { useEffect, useRef, useState } from 'react'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import type { LaneWithCards } from '@shared/types'
import { cn } from '@/lib/cn'
import { CardItem } from './CardItem'
import { useBoardStore } from '@/stores/board.store'

interface LaneProps {
  lane: LaneWithCards
}

export function Lane({ lane }: LaneProps) {
  const { addCard, renameLane, deleteLane } = useBoardStore()
  const [hovered, setHovered] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [laneName, setLaneName] = useState(lane.name)
  const [adding, setAdding] = useState(false)
  const [newCardTitle, setNewCardTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const addCardInputRef = useRef<HTMLInputElement>(null)

  // Make lane itself droppable for the empty-lane case
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: lane.id })

  useEffect(() => {
    if (editingName) {
      setLaneName(lane.name)
      setTimeout(() => {
        nameInputRef.current?.focus()
        nameInputRef.current?.select()
      }, 20)
    }
  }, [editingName])

  useEffect(() => {
    if (adding) {
      setTimeout(() => addCardInputRef.current?.focus(), 20)
    }
  }, [adding])

  async function commitLaneName() {
    const name = laneName.trim()
    if (name && name !== lane.name) await renameLane(lane.id, name)
    else setLaneName(lane.name)
    setEditingName(false)
  }

  async function handleAddCard(e: React.FormEvent) {
    e.preventDefault()
    const title = newCardTitle.trim()
    if (!title || saving) return
    setSaving(true)
    await addCard(lane.id, title)
    setNewCardTitle('')
    setSaving(false)
    // Keep form open for fast entry — blur to close
    addCardInputRef.current?.focus()
  }

  const cardIds = lane.cards.map((c) => c.id)

  return (
    <div
      className="flex flex-col shrink-0 rounded-2xl overflow-hidden"
      style={{
        width: 280,
        background: 'var(--bg-column)',
        border: isOver ? '1px solid var(--color-brand)' : '1px solid var(--border-subtle)',
        maxHeight: 'calc(100vh - 120px)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Lane header */}
      <div className="flex items-center gap-2 px-3 py-3 shrink-0">
        {editingName ? (
          <input
            ref={nameInputRef}
            value={laneName}
            onChange={(e) => setLaneName(e.target.value)}
            onBlur={commitLaneName}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitLaneName()
              if (e.key === 'Escape') { setLaneName(lane.name); setEditingName(false) }
              e.stopPropagation()
            }}
            maxLength={60}
            className="flex-1 min-w-0 text-sm font-semibold bg-transparent outline-none"
            style={{ color: 'var(--text-primary)' }}
          />
        ) : (
          <span
            className="flex-1 min-w-0 text-sm font-semibold truncate cursor-default"
            style={{ color: 'var(--text-primary)' }}
            onDoubleClick={() => setEditingName(true)}
          >
            {lane.name}
          </span>
        )}

        {/* Card count */}
        {lane.cards.length > 0 && (
          <span
            className="text-xs tabular-nums shrink-0"
            style={{ color: 'var(--text-tertiary)' }}
          >
            {lane.cards.length}
          </span>
        )}

        {/* Lane actions — visible on hover */}
        {hovered && !editingName && (
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              title="Rename lane"
              onClick={() => setEditingName(true)}
              className="p-1 rounded cursor-pointer opacity-50 hover:opacity-100 transition-opacity"
              style={{ color: 'var(--text-secondary)' }}
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                <path d="M11.013 1.427a1.75 1.75 0 012.474 0l1.086 1.086a1.75 1.75 0 010 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 01-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61zm1.414 1.06a.25.25 0 00-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 000-.354l-1.086-1.086zM11.189 6.25L9.75 4.81 3.23 11.33a.25.25 0 00-.064.108l-.618 2.162 2.162-.617a.25.25 0 00.108-.064l6.521-6.52-.15-.149z" />
              </svg>
            </button>
            <button
              title="Delete lane"
              onClick={() => deleteLane(lane.id)}
              className="p-1 rounded cursor-pointer opacity-50 hover:opacity-100 transition-opacity"
              style={{ color: '#ef4444' }}
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                <path d="M6.5 1.75a.25.25 0 01.25-.25h2.5a.25.25 0 01.25.25V3h-3V1.75zm4.5 0V3h2.25a.75.75 0 010 1.5H2.75a.75.75 0 010-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75zM4.496 6.675l.66 6.6a.25.25 0 00.249.225h5.19a.25.25 0 00.249-.225l.66-6.6a.75.75 0 011.492.149l-.66 6.6A1.748 1.748 0 0111.595 15h-5.19a1.75 1.75 0 01-1.741-1.575l-.66-6.6a.75.75 0 011.492-.15z" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Card list */}
      <div
        ref={setDropRef}
        className="flex-1 overflow-y-auto px-2 flex flex-col gap-2 min-h-[2px]"
        style={{ paddingBottom: adding ? 0 : 8 }}
      >
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          {lane.cards.map((card) => (
            <CardItem key={card.id} card={card} laneId={lane.id} />
          ))}
        </SortableContext>
      </div>

      {/* Add card area */}
      <div className="px-2 pb-2 pt-1 shrink-0">
        {adding ? (
          <form onSubmit={handleAddCard} className="flex flex-col gap-1.5">
            <textarea
              ref={addCardInputRef as React.RefObject<HTMLTextAreaElement>}
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleAddCard(e as unknown as React.FormEvent)
                }
                if (e.key === 'Escape') { setAdding(false); setNewCardTitle('') }
                e.stopPropagation()
              }}
              placeholder="Card title..."
              rows={2}
              maxLength={200}
              className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--color-brand)',
                color: 'var(--text-primary)',
              }}
            />
            <div className="flex gap-1.5">
              <button
                type="submit"
                disabled={!newCardTitle.trim() || saving}
                className={cn(
                  'flex-1 py-1.5 rounded-lg text-sm font-medium text-white transition-opacity cursor-pointer',
                  (!newCardTitle.trim() || saving) && 'opacity-40 cursor-not-allowed'
                )}
                style={{ background: 'var(--color-brand)' }}
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => { setAdding(false); setNewCardTitle('') }}
                className="px-3 py-1.5 rounded-lg text-sm cursor-pointer transition-colors"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-subtle)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-xl text-sm cursor-pointer transition-colors"
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
            Add card
          </button>
        )}
      </div>
    </div>
  )
}
