import { randomUUID } from 'crypto'
import type { Database } from 'better-sqlite3'
import type { Card, CreateCardInput, UpdateCardInput } from '../../shared/types'
import { getAppendPosition } from '../../shared/position'

export function createCardRepo(db: Database) {
  const findById = db.prepare<[string], Card>('SELECT * FROM cards WHERE id = ?')
  const findByLane = db.prepare<[string], Card>(
    'SELECT * FROM cards WHERE laneId = ? AND isArchived = 0 ORDER BY position ASC'
  )

  return {
    list(laneId: string): Card[] {
      return findByLane.all(laneId)
    },

    findById(id: string): Card | undefined {
      return findById.get(id)
    },

    create(input: CreateCardInput): Card {
      const id = randomUUID()
      const now = Date.now()
      const existing = findByLane.all(input.laneId)
      const position = getAppendPosition(existing)

      db.prepare(`
        INSERT INTO cards (id, laneId, title, description, priority, dueDate, position, isArchived, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
      `).run(
        id,
        input.laneId,
        input.title,
        input.description ?? null,
        input.priority ?? 'none',
        input.dueDate ?? null,
        position,
        now,
        now,
      )

      return findById.get(id)!
    },

    update(id: string, input: UpdateCardInput): Card {
      const sets: string[] = ['updatedAt = ?']
      const values: unknown[] = [Date.now()]

      if (input.title !== undefined) { sets.push('title = ?'); values.push(input.title) }
      if ('description' in input) { sets.push('description = ?'); values.push(input.description ?? null) }
      if (input.priority !== undefined) { sets.push('priority = ?'); values.push(input.priority) }
      if ('dueDate' in input) { sets.push('dueDate = ?'); values.push(input.dueDate ?? null) }
      if (input.position !== undefined) { sets.push('position = ?'); values.push(input.position) }
      if (input.laneId !== undefined) { sets.push('laneId = ?'); values.push(input.laneId) }
      if (input.isArchived !== undefined) { sets.push('isArchived = ?'); values.push(input.isArchived) }

      values.push(id)
      db.prepare(`UPDATE cards SET ${sets.join(', ')} WHERE id = ?`).run(...values)
      return findById.get(id)!
    },

    // Move a card to a different lane and/or position atomically
    move(cardId: string, laneId: string, position: number): Card {
      const now = Date.now()
      db.prepare('UPDATE cards SET laneId = ?, position = ?, updatedAt = ? WHERE id = ?')
        .run(laneId, position, now, cardId)
      return findById.get(cardId)!
    },

    delete(id: string): void {
      db.prepare('DELETE FROM cards WHERE id = ?').run(id)
    },
  }
}

export type CardRepo = ReturnType<typeof createCardRepo>
