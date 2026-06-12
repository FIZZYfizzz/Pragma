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
import { TagManagerDialog } from '@/components/board/TagsDialog'
import { useBoardStore } from '@/stores/board.store'
import { useAppStore } from '@/stores/app.store'
import { toast } from '@/stores/toast.store'

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

  const { board, loading, error, loadBoard, reset, addLane, reorderCardsInLane, moveCardToLane, persistCardMove, snapshotBoard, rollbackBoard } =
    useBoardStore()

  const [activeCard, setActiveCard] = useState<CardWithTags | null>(null)
  const [activeLaneId, setActiveLaneId] = useState<string | null>(null)
  const [addingLane, setAddingLane] = useState(false)
  const [tagManagerOpen, setTagManagerOpen] = useState(false)
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
    snapshotBoard()
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
    dragOriginLaneId.current = null
    // Restore pre-drag order from the snapshot taken in handleDragStart
    rollbackBoard()
  }

  function goBack() {
    setActiveBoard(null)
    setView('home')
  }

  async function handleExportBoard() {
    if (!board) return
    const result = (await window.pragma.app.exportBoard(board.id)) as {
      success: boolean
      error?: string
    }
    if (result.success) toast.success('Board exported')
    else if (result.error) toast.error(result.error)
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Couldn't load this board
        </span>
        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          {error}
        </span>
        <div className="flex gap-2 mt-1">
          <button
            onClick={() => loadBoard(activeBoardId)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium text-white cursor-pointer"
            style={{ background: 'var(--color-brand)' }}
          >
            Retry
          </button>
          <button
            onClick={goBack}
            className="px-3 py-1.5 rounded-lg text-sm cursor-pointer"
            style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-medium)' }}
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

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

        <div className="flex-1" />

        <button
          onClick={handleExportBoard}
          className="flex items-center gap-1.5 text-sm cursor-pointer transition-colors px-2 py-1 rounded-lg shrink-0"
          style={{ color: 'var(--text-tertiary)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--bg-subtle)'
            e.currentTarget.style.color = 'var(--text-secondary)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--text-tertiary)'
          }}
          title="Export this board to a file"
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
            <path d="M2.75 14A1.75 1.75 0 011 12.25v-2.5a.75.75 0 011.5 0v2.5c0 .138.112.25.25.25h10.5a.25.25 0 00.25-.25v-2.5a.75.75 0 011.5 0v2.5A1.75 1.75 0 0113.25 14H2.75zM8.75 2.561l1.97 1.969a.749.749 0 101.06-1.06L8.53.22a.749.749 0 00-1.06 0L4.22 3.47a.749.749 0 101.06 1.06l1.97-1.969v5.689a.75.75 0 001.5 0V2.561z" />
          </svg>
          Export
        </button>

        <button
          onClick={() => setTagManagerOpen(true)}
          className="flex items-center gap-1.5 text-sm cursor-pointer transition-colors px-2 py-1 rounded-lg shrink-0"
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
          <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
            <path d="M1 7.775V2.75C1 1.784 1.784 1 2.75 1h5.025c.464 0 .91.184 1.238.513l6.25 6.25a1.75 1.75 0 010 2.474l-5.026 5.026a1.75 1.75 0 01-2.474 0l-6.25-6.25A1.752 1.752 0 011 7.775zm1.5 0c0 .066.026.13.073.177l6.25 6.25a.25.25 0 00.354 0l5.025-5.025a.25.25 0 000-.354l-6.25-6.25a.25.25 0 00-.177-.073H2.75a.25.25 0 00-.25.25zM6 5a1 1 0 110 2 1 1 0 010-2z" />
          </svg>
          Tags
        </button>
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

      <TagManagerDialog isOpen={tagManagerOpen} onClose={() => setTagManagerOpen(false)} />
    </div>
  )
}
