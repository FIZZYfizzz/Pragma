import { randomUUID } from 'crypto'
import type { Database } from 'better-sqlite3'
import type { Lane, CreateLaneInput, UpdateLaneInput } from '../../shared/types'
import { getAppendPosition } from '../../shared/position'

export function createLaneRepo(db: Database) {
  const findById = db.prepare<[string], Lane>('SELECT * FROM lanes WHERE id = ?')
  const findByBoard = db.prepare<[string], Lane>(
    'SELECT * FROM lanes WHERE boardId = ? ORDER BY position ASC'
  )

  return {
    list(boardId: string): Lane[] {
      return findByBoard.all(boardId)
    },

    findById(id: string): Lane | undefined {
      return findById.get(id)
    },

    create(input: CreateLaneInput): Lane {
      const id = randomUUID()
      const createdAt = Date.now()
      const existing = findByBoard.all(input.boardId)
      const position = getAppendPosition(existing)

      db.prepare(`
        INSERT INTO lanes (id, boardId, name, color, position, createdAt)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(id, input.boardId, input.name, input.color ?? null, position, createdAt)

      return findById.get(id)!
    },

    update(id: string, input: UpdateLaneInput): Lane {
      const sets: string[] = []
      const values: unknown[] = []
      if (input.name !== undefined) { sets.push('name = ?'); values.push(input.name) }
      if ('color' in input) { sets.push('color = ?'); values.push(input.color ?? null) }
      if (input.position !== undefined) { sets.push('position = ?'); values.push(input.position) }
      if (sets.length > 0) {
        values.push(id)
        db.prepare(`UPDATE lanes SET ${sets.join(', ')} WHERE id = ?`).run(...values)
      }
      return findById.get(id)!
    },

    delete(id: string): void {
      db.prepare('DELETE FROM lanes WHERE id = ?').run(id)
    },
  }
}

export type LaneRepo = ReturnType<typeof createLaneRepo>
