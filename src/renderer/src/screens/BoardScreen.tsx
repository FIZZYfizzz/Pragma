import { useEffect, useRef, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import type { CardWithTags } from '@shared/types'
import { cn } from '@/lib/cn'
import { Lane } from '@/components/board/Lane'
import { CardItem } from '@/components/board/CardItem'
import { useBoardStore } from '@/stores/board.store'
import { useAppStore } from '@/stores/app.store'

// ─── Add lane form ────────────────────────────────────────────────────────────

function AddLaneForm({ onAdd, onCancel }: { onAdd: (name: string) => void; onCancel: () => void }) {
  const [name, setName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 20) }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (name.trim()) { onAdd(name.trim()); setName('') }
  }

  return (
    <div
      className="shrink-0 rounded-2xl p-3 flex flex-col gap-2"
      style={{ width: 280, background: 'var(--bg-column)', border: '1px solid var(--border-subtle)' }}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') { e.stopPropagation(); onCancel() }
            e.stopPropagation()
          }}
          placeholder="Lane name..."
          maxLength={60}
          className="w-full px-3 py-2 rounded-xl text-sm outline-none"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--color-brand)',
            color: 'var(--text-primary)',
          }}
        />
        <div className="flex gap-1.5">
          <button
            type="submit"
            disabled={!name.trim()}
            className={cn(
              'flex-1 py-1.5 rounded-lg text-sm font-medium text-white cursor-pointer transition-opacity',
              !name.trim() && 'opacity-40 cursor-not-allowed'
            )}
            style={{ background: 'var(--color-brand)' }}
          >
            Add Lane
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 rounded-lg text-sm cursor-pointer transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-subtle)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

// ─── Board screen ─────────────────────────────────────────────────────────────

export function BoardScreen() {
  const activeBoardId = useAppStore((s) => s.activeBoardId)!
  const setView = useAppStore((s) => s.setView)
  const setActiveBoard = useAppStore((s) => s.setActiveBoard)

  const { board, loading, loadBoard, reset, addLane, reorderCardsInLane, moveCardToLane, persistCardMove } =
    useBoardStore()

  const [activeCard, setActiveCard] = useState<CardWithTags | null>(null)
  const [activeLaneId, setActiveLaneId] = useState<string | null>(null)
  const [addingLane, setAddingLane] = useState(false)
  const dragOriginLaneId = useRef<string | null>(null)

  useEffect(() => {
    loadBoard(activeBoardId)
    return () => reset()
  }, [activeBoardId])

  // ── DnD sensors ────────────────────────────────────────────────────────────

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  // ── DnD handlers ───────────────────────────────────────────────────────────

  function handleDragStart(event: DragStartEvent) {
    if (!board) return
    const cardId = event.active.id as string
    const lane = board.lanes.find((l) => l.cards.some((c) => c.id === cardId))
    if (!lane) return
    dragOriginLaneId.current = lane.id
    setActiveLaneId(lane.id)
    setActiveCard(lane.cards.find((c) => c.id === cardId) ?? null)
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over || !board) return

    const cardId = active.id as string
    const overId = over.id as string
    if (cardId === overId) return

    // Find which lane the card is currently in
    const fromLane = board.lanes.find((l) => l.cards.some((c) => c.id === cardId))
    if (!fromLane) return

    // Find target lane (overId is either a card id or a lane id)
    const toLane =
      board.lanes.find((l) => l.id === overId) ??
      board.lanes.find((l) => l.cards.some((c) => c.id === overId))
    if (!toLane) return

    if (fromLane.id === toLane.id) {
      // Same lane — reorder
      const fromIndex = fromLane.cards.findIndex((c) => c.id === cardId)
      const toIndex = fromLane.cards.findIndex((c) => c.id === overId)
      if (toIndex === -1 || fromIndex === toIndex) return
      reorderCardsInLane(fromLane.id, fromIndex, toIndex)
    } else {
      // Cross-lane — move
      const toIndex = toLane.cards.findIndex((c) => c.id === overId)
      moveCardToLane(cardId, fromLane.id, toLane.id, toIndex === -1 ? toLane.cards.length : toIndex)
      setActiveLaneId(toLane.id)
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active } = event
    const cardId = active.id as string
    setActiveCard(null)
    setActiveLaneId(null)
    dragOriginLaneId.current = null
    if (!board) return
    await persistCardMove(cardId)
  }

  function handleDragCancel() {
    setActiveCard(null)
    setActiveLaneId(null)
    // Reload to restore original order on cancel
    loadBoard(activeBoardId)
  }

  function goBack() {
    setActiveBoard(null)
    setView('home')
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading || !board) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
          Loading board…
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Header */}
      <header
        className="flex items-center gap-3 px-5 py-3 shrink-0"
        style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}
      >
        <button
          onClick={goBack}
          className="flex items-center gap-1.5 text-sm cursor-pointer transition-colors px-2 py-1 rounded-lg"
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
            <path d="M7.78 12.53a.75.75 0 01-1.06 0L2.47 8.28a.75.75 0 010-1.06l4.25-4.25a.751.751 0 011.042.018.751.751 0 01.018 1.042L4.81 7h7.44a.75.75 0 010 1.5H4.81l2.97 2.97a.75.75 0 010 1.06z" />
          </svg>
          Back
        </button>

        <div
          className="w-px h-4 shrink-0"
          style={{ background: 'var(--border-subtle)' }}
        />

        {board.coverColor && (
          <span
            className="w-3 h-3 rounded-full shrink-0"
            style={{ background: board.coverColor }}
          />
        )}
        <h1
          className="text-sm font-semibold truncate"
          style={{ color: 'var(--text-primary)' }}
        >
          {board.name}
        </h1>
      </header>

      {/* Lanes */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div className="flex gap-4 p-5 h-full items-start min-w-max">
            {board.lanes.map((lane) => (
              <Lane key={lane.id} lane={lane} />
            ))}

            {/* Add lane */}
            {addingLane ? (
              <AddLaneForm
                onAdd={async (name) => {
                  await addLane(name)
                  setAddingLane(false)
                }}
                onCancel={() => setAddingLane(false)}
              />
            ) : (
              <button
                onClick={() => setAddingLane(true)}
                className="shrink-0 flex items-center gap-2 px-4 py-3 rounded-2xl text-sm cursor-pointer transition-colors"
                style={{
                  width: 280,
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
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M7.75 2a.75.75 0 01.75.75V7h4.25a.75.75 0 010 1.5H8.5v4.25a.75.75 0 01-1.5 0V8.5H2.75a.75.75 0 010-1.5H7V2.75A.75.75 0 017.75 2z" />
                </svg>
                Add Lane
              </button>
            )}
          </div>
        </div>

        <DragOverlay dropAnimation={null}>
          {activeCard && activeLaneId && (
            <CardItem card={activeCard} laneId={activeLaneId} overlay />
          )}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
