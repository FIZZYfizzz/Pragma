import { randomUUID } from 'crypto'
import type { Database } from 'better-sqlite3'
import type { PragmaProject, CreatePragmaInput, UpdatePragmaInput } from '../../shared/types'
import { getAppendPosition } from '../../shared/position'

export function createPragmaRepo(db: Database) {
  const findById = db.prepare<[string], PragmaProject>('SELECT * FROM pragmas WHERE id = ?')
  const findByProfile = db.prepare<[string], PragmaProject>(
    'SELECT * FROM pragmas WHERE profileId = ? ORDER BY position ASC, createdAt ASC'
  )

  return {
    list(profileId: string): PragmaProject[] {
      return findByProfile.all(profileId)
    },

    findById(id: string): PragmaProject | undefined {
      return findById.get(id)
    },

    create(input: CreatePragmaInput): PragmaProject {
      const id = randomUUID()
      const createdAt = Date.now()
      const existing = findByProfile.all(input.profileId)
      const position = getAppendPosition(existing)

      db.prepare(`
        INSERT INTO pragmas (id, profileId, name, description, coverColor, position, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        input.profileId,
        input.name,
        input.description ?? null,
        input.coverColor ?? null,
        position,
        createdAt,
      )

      return findById.get(id)!
    },

    update(id: string, input: UpdatePragmaInput): PragmaProject {
      const sets: string[] = []
      const values: unknown[] = []
      if (input.name !== undefined) { sets.push('name = ?'); values.push(input.name) }
      if ('description' in input) { sets.push('description = ?'); values.push(input.description ?? null) }
      if ('coverColor' in input) { sets.push('coverColor = ?'); values.push(input.coverColor ?? null) }
      if (input.position !== undefined) { sets.push('position = ?'); values.push(input.position) }
      if (sets.length > 0) {
        values.push(id)
        db.prepare(`UPDATE pragmas SET ${sets.join(', ')} WHERE id = ?`).run(...values)
      }
      return findById.get(id)!
    },

    delete(id: string): void {
      db.prepare('DELETE FROM pragmas WHERE id = ?').run(id)
    },
  }
}

export type PragmaRepo = ReturnType<typeof createPragmaRepo>
