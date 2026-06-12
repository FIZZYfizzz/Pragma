import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type {
  BoardWithLanes,
  Tag,
  UpdateCardInput,
  UpdateLaneInput,
  Priority,
} from '@shared/types'
import { getBetweenPosition, getAppendPosition } from '@shared/position'
import { toast } from './toast.store'

interface BoardStore {
  board: BoardWithLanes | null
  pragmaTags: Tag[]
  loading: boolean
  error: string | null
  _snapshot: BoardWithLanes | null

  reset: () => void
  loadBoard: (boardId: string) => Promise<void>
  snapshotBoard: () => void
  rollbackBoard: () => void

  // ── Tags ──
  createTag: (name: string, color: string) => Promise<void>
  deleteTag: (tagId: string) => Promise<void>
  toggleCardTag: (cardId: string, laneId: string, tagId: string) => Promise<void>

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
    pragmaTags: [],
    loading: false,
    error: null,
    _snapshot: null,

    reset() {
      set((s) => {
        s.board = null
        s.pragmaTags = []
        s.loading = false
        s.error = null
        s._snapshot = null
      })
    },

    snapshotBoard() {
      const board = get().board
      if (!board) return
      set((s) => { s._snapshot = JSON.parse(JSON.stringify(board)) as BoardWithLanes })
    },

    rollbackBoard() {
      const snap = get()._snapshot
      if (!snap) return
      set((s) => { s.board = snap; s._snapshot = null })
    },

    async loadBoard(boardId) {
      set((s) => {
        s.loading = true
        s.board = null
        s.pragmaTags = []
        s.error = null
      })
      try {
        const board = (await window.pragma.board.full(boardId)) as BoardWithLanes
        board.lanes.sort((a, b) => a.position - b.position)
        board.lanes.forEach((lane) => lane.cards.sort((a, b) => a.position - b.position))
        const tags = (await window.pragma.tag.listByPragma(board.pragmaId)) as Tag[]
        set((s) => {
          s.board = board
          s.pragmaTags = tags
          s.loading = false
        })
      } catch (err) {
        set((s) => {
          s.loading = false
          s.error = err instanceof Error ? err.message : 'Failed to load board'
        })
      }
    },

    // ── Tag actions ───────────────────────────────────────────────────────────

    async createTag(name, color) {
      const board = get().board
      if (!board) return
      const tag = (await window.pragma.tag.create({ pragmaId: board.pragmaId, name, color })) as Tag
      set((s) => { s.pragmaTags.push(tag) })
    },

    async deleteTag(tagId) {
      await window.pragma.tag.delete(tagId)
      set((s) => {
        s.pragmaTags = s.pragmaTags.filter((t) => t.id !== tagId)
        s.board?.lanes.forEach((lane) => {
          lane.cards.forEach((card) => {
            card.tags = card.tags.filter((t) => t.id !== tagId)
          })
        })
      })
    },

    async toggleCardTag(cardId, laneId, tagId) {
      const lane = get().board?.lanes.find((l) => l.id === laneId)
      const card = lane?.cards.find((c) => c.id === cardId)
      if (!card) return
      const hasTag = card.tags.some((t) => t.id === tagId)
      if (hasTag) {
        set((s) => {
          const c = s.board?.lanes.find((l) => l.id === laneId)?.cards.find((c) => c.id === cardId)
          if (c) c.tags = c.tags.filter((t) => t.id !== tagId)
        })
        await window.pragma.tag.removeFromCard(cardId, tagId)
      } else {
        const tag = get().pragmaTags.find((t) => t.id === tagId)
        if (!tag) return
        set((s) => {
          const c = s.board?.lanes.find((l) => l.id === laneId)?.cards.find((c) => c.id === cardId)
          if (c) c.tags.push(tag)
        })
        await window.pragma.tag.addToCard(cardId, tagId)
      }
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
      try {
        await window.pragma.card.move(cardId, lane.id, position)
        set((s) => { s._snapshot = null })
      } catch {
        get().rollbackBoard()
        toast.error("Couldn't save card move — restored previous order")
      }
    },
  }))
)

export { getAppendPosition }
