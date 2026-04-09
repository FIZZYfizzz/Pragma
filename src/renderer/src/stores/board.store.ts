import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type {
  BoardWithLanes,
  UpdateCardInput,
  UpdateLaneInput,
  Priority,
} from '@shared/types'
import { getBetweenPosition, getAppendPosition } from '@shared/position'

interface BoardStore {
  board: BoardWithLanes | null
  loading: boolean

  reset: () => void
  loadBoard: (boardId: string) => Promise<void>

  // ── Lanes ──
  addLane: (name: string) => Promise<void>
  renameLane: (laneId: string, name: string) => Promise<void>
  deleteLane: (laneId: string) => Promise<void>

  // ── Cards ──
  addCard: (laneId: string, title: string) => Promise<void>
  updateCard: (cardId: string, laneId: string, input: UpdateCardInput) => Promise<void>
  deleteCard: (cardId: string, laneId: string) => Promise<void>
  cycleCardPriority: (cardId: string, laneId: string) => Promise<void>

  // ── DnD helpers ──
  reorderCardsInLane: (laneId: string, fromIndex: number, toIndex: number) => void
  moveCardToLane: (cardId: string, fromLaneId: string, toLaneId: string, toIndex: number) => void
  persistCardMove: (cardId: string) => Promise<void>
}

const PRIORITY_CYCLE: Priority[] = ['none', 'low', 'medium', 'high', 'urgent']

export const useBoardStore = create<BoardStore>()(
  immer((set, get) => ({
    board: null,
    loading: false,

    reset() {
      set((s) => {
        s.board = null
        s.loading = false
      })
    },

    async loadBoard(boardId) {
      set((s) => {
        s.loading = true
        s.board = null
      })
      const board = (await window.pragma.board.full(boardId)) as BoardWithLanes
      // Ensure sorted by position
      board.lanes.sort((a, b) => a.position - b.position)
      board.lanes.forEach((lane) => lane.cards.sort((a, b) => a.position - b.position))
      set((s) => {
        s.board = board
        s.loading = false
      })
    },

    // ── Lane actions ──────────────────────────────────────────────────────────

    async addLane(name) {
      const board = get().board
      if (!board) return
      const lane = (await window.pragma.lane.create({
        boardId: board.id,
        name,
      })) as BoardWithLanes['lanes'][number]
      set((s) => {
        s.board!.lanes.push({ ...lane, cards: [] })
      })
    },

    async renameLane(laneId, name) {
      await window.pragma.lane.update(laneId, { name } as UpdateLaneInput)
      set((s) => {
        const lane = s.board?.lanes.find((l) => l.id === laneId)
        if (lane) lane.name = name
      })
    },

    async deleteLane(laneId) {
      await window.pragma.lane.delete(laneId)
      set((s) => {
        if (!s.board) return
        s.board.lanes = s.board.lanes.filter((l) => l.id !== laneId)
      })
    },

    // ── Card actions ──────────────────────────────────────────────────────────

    async addCard(laneId, title) {
      const card = (await window.pragma.card.create({
        laneId,
        title,
      })) as BoardWithLanes['lanes'][number]['cards'][number]
      set((s) => {
        const lane = s.board?.lanes.find((l) => l.id === laneId)
        if (lane) lane.cards.push({ ...card, tags: [] })
      })
    },

    async updateCard(cardId, laneId, input) {
      const updated = (await window.pragma.card.update(cardId, input)) as
        BoardWithLanes['lanes'][number]['cards'][number]
      set((s) => {
        const lane = s.board?.lanes.find((l) => l.id === laneId)
        if (!lane) return
        const idx = lane.cards.findIndex((c) => c.id === cardId)
        if (idx !== -1) {
          const tags = lane.cards[idx]!.tags
          lane.cards[idx] = { ...updated, tags }
        }
      })
    },

    async deleteCard(cardId, laneId) {
      await window.pragma.card.delete(cardId)
      set((s) => {
        const lane = s.board?.lanes.find((l) => l.id === laneId)
        if (lane) lane.cards = lane.cards.filter((c) => c.id !== cardId)
      })
    },

    async cycleCardPriority(cardId, laneId) {
      const lane = get().board?.lanes.find((l) => l.id === laneId)
      const card = lane?.cards.find((c) => c.id === cardId)
      if (!card) return
      const nextIndex = (PRIORITY_CYCLE.indexOf(card.priority) + 1) % PRIORITY_CYCLE.length
      const nextPriority = PRIORITY_CYCLE[nextIndex]!
      set((s) => {
        const l = s.board?.lanes.find((l) => l.id === laneId)
        const c = l?.cards.find((c) => c.id === cardId)
        if (c) c.priority = nextPriority
      })
      await window.pragma.card.update(cardId, { priority: nextPriority })
    },

    // ── DnD helpers ───────────────────────────────────────────────────────────

    reorderCardsInLane(laneId, fromIndex, toIndex) {
      set((s) => {
        const lane = s.board?.lanes.find((l) => l.id === laneId)
        if (!lane) return
        const [card] = lane.cards.splice(fromIndex, 1)
        lane.cards.splice(toIndex, 0, card!)
      })
    },

    moveCardToLane(cardId, fromLaneId, toLaneId, toIndex) {
      set((s) => {
        if (!s.board) return
        const fromLane = s.board.lanes.find((l) => l.id === fromLaneId)!
        const toLane = s.board.lanes.find((l) => l.id === toLaneId)!
        const cardIdx = fromLane.cards.findIndex((c) => c.id === cardId)
        if (cardIdx === -1) return
        const [card] = fromLane.cards.splice(cardIdx, 1)
        const insertAt = Math.min(toIndex, toLane.cards.length)
        toLane.cards.splice(insertAt, 0, card!)
      })
    },

    async persistCardMove(cardId) {
      const board = get().board
      if (!board) return
      const lane = board.lanes.find((l) => l.cards.some((c) => c.id === cardId))
      if (!lane) return
      const idx = lane.cards.findIndex((c) => c.id === cardId)
      const before = idx > 0 ? lane.cards[idx - 1]!.position : null
      const after = idx < lane.cards.length - 1 ? lane.cards[idx + 1]!.position : null
      const position = getBetweenPosition(before, after)
      set((s) => {
        const l = s.board?.lanes.find((l) => l.id === lane.id)
        const c = l?.cards[idx]
        if (c) c.position = position
      })
      await window.pragma.card.move(cardId, lane.id, position)
    },
  }))
)

// Expose getAppendPosition for use in components
export { getAppendPosition }
