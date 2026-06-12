import { randomUUID } from 'crypto'
import type { Database } from 'better-sqlite3'
import type {
  Board, Lane, Card, Tag,
  CardWithTags, BoardWithLanes,
  CreateBoardInput, UpdateBoardInput,
} from '../../shared/types'
import { BOARD_TEMPLATES as TEMPLATES } from '../../shared/types'
import { getAppendPosition } from '../../shared/position'

export function createBoardRepo(db: Database) {
  const findById = db.prepare<[string], Board>('SELECT * FROM boards WHERE id = ?')
  const findByPragma = db.prepare<[string], Board>(
    'SELECT * FROM boards WHERE pragmaId = ? ORDER BY position ASC, createdAt ASC'
  )

  return {
    list(pragmaId: string): Board[] {
      return findByPragma.all(pragmaId)
    },

    findById(id: string): Board | undefined {
      return findById.get(id)
    },

    create(input: CreateBoardInput): Board {
      const id = randomUUID()
      const createdAt = Date.now()
      const existing = findByPragma.all(input.pragmaId)
      const position = getAppendPosition(existing)

      db.prepare(`
        INSERT INTO boards (id, pragmaId, name, coverColor, position, createdAt)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(id, input.pragmaId, input.name, input.coverColor ?? null, position, createdAt)

      // Seed lanes from template
      const template = input.template ?? 'blank'
      const laneNames = TEMPLATES[template]?.lanes ?? []
      laneNames.forEach((name, i) => {
        db.prepare(`
          INSERT INTO lanes (id, boardId, name, color, position, createdAt)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(randomUUID(), id, name, null, (i + 1) * 1000, createdAt)
      })

      return findById.get(id)!
    },

    update(id: string, input: UpdateBoardInput): Board {
      const sets: string[] = []
      const values: unknown[] = []
      if (input.name !== undefined) { sets.push('name = ?'); values.push(input.name) }
      if ('coverColor' in input) { sets.push('coverColor = ?'); values.push(input.coverColor ?? null) }
      if (input.position !== undefined) { sets.push('position = ?'); values.push(input.position) }
      if (sets.length > 0) {
        values.push(id)
        db.prepare(`UPDATE boards SET ${sets.join(', ')} WHERE id = ?`).run(...values)
      }
      return findById.get(id)!
    },

    delete(id: string): void {
      db.prepare('DELETE FROM boards WHERE id = ?').run(id)
    },

    // ─── Full board load (lanes + cards + tags) ────────────────────────────

    getFull(boardId: string): BoardWithLanes {
      const board = findById.get(boardId)
      if (!board) throw new Error(`Board ${boardId} not found`)

      const lanes = db.prepare<[string], Lane>(
        'SELECT * FROM lanes WHERE boardId = ? ORDER BY position ASC'
      ).all(boardId)

      if (lanes.length === 0) return { ...board, lanes: [] }

      // Fetch all non-archived cards for this board in one query via JOIN
      const cards = db.prepare<[string], Card>(`
        SELECT c.*
        FROM cards c
        JOIN lanes l ON c.laneId = l.id
        WHERE l.boardId = ? AND c.isArchived = 0
        ORDER BY c.position ASC
      `).all(boardId)

      // Fetch all tags for those cards in one query
      const cardTagRows = cards.length > 0
        ? db.prepare<[string], Tag & { cardId: string }>(`
            SELECT ct.cardId, t.*
            FROM cardTags ct
            JOIN tags t ON t.id = ct.tagId
            JOIN cards c ON c.id = ct.cardId
            JOIN lanes l ON c.laneId = l.id
            WHERE l.boardId = ?
          `).all(boardId)
        : []

      // Build cardId → tags map
      const tagsByCard = new Map<string, Tag[]>()
      for (const row of cardTagRows) {
        const { cardId, ...tag } = row
        if (!tagsByCard.has(cardId)) tagsByCard.set(cardId, [])
        tagsByCard.get(cardId)!.push(tag)
      }

      // Compose cards with tags, grouped by lane
      const cardsByLane = new Map<string, CardWithTags[]>()
      for (const card of cards) {
        if (!cardsByLane.has(card.laneId)) cardsByLane.set(card.laneId, [])
        cardsByLane.get(card.laneId)!.push({ ...card, tags: tagsByCard.get(card.id) ?? [] })
      }

      return {
        ...board,
        lanes: lanes.map((lane) => ({
          ...lane,
          cards: cardsByLane.get(lane.id) ?? [],
        })),
      }
    },
  }
}

export type BoardRepo = ReturnType<typeof createBoardRepo>
