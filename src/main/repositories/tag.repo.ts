import { randomUUID } from 'crypto'
import type { Database } from 'better-sqlite3'
import type { Tag, CreateTagInput, UpdateTagInput } from '../../shared/types'

export function createTagRepo(db: Database) {
  const findById = db.prepare<[string], Tag>('SELECT * FROM tags WHERE id = ?')
  const findByPragma = db.prepare<[string], Tag>(
    'SELECT * FROM tags WHERE pragmaId = ? ORDER BY name ASC'
  )
  const findByCard = db.prepare<[string], Tag>(`
    SELECT t.* FROM tags t
    JOIN cardTags ct ON ct.tagId = t.id
    WHERE ct.cardId = ?
    ORDER BY t.name ASC
  `)

  return {
    listByPragma(pragmaId: string): Tag[] {
      return findByPragma.all(pragmaId)
    },

    listByCard(cardId: string): Tag[] {
      return findByCard.all(cardId)
    },

    findById(id: string): Tag | undefined {
      return findById.get(id)
    },

    create(input: CreateTagInput): Tag {
      const id = randomUUID()
      const createdAt = Date.now()
      db.prepare('INSERT INTO tags (id, pragmaId, name, color, createdAt) VALUES (?, ?, ?, ?, ?)')
        .run(id, input.pragmaId, input.name, input.color, createdAt)
      return findById.get(id)!
    },

    update(id: string, input: UpdateTagInput): Tag {
      const sets: string[] = []
      const values: unknown[] = []
      if (input.name !== undefined) { sets.push('name = ?'); values.push(input.name) }
      if (input.color !== undefined) { sets.push('color = ?'); values.push(input.color) }
      if (sets.length > 0) {
        values.push(id)
        db.prepare(`UPDATE tags SET ${sets.join(', ')} WHERE id = ?`).run(...values)
      }
      return findById.get(id)!
    },

    delete(id: string): void {
      db.prepare('DELETE FROM tags WHERE id = ?').run(id)
    },

    // ─── Card-tag associations ─────────────────────────────────────────────

    addToCard(cardId: string, tagId: string): void {
      db.prepare('INSERT OR IGNORE INTO cardTags (cardId, tagId) VALUES (?, ?)').run(cardId, tagId)
    },

    removeFromCard(cardId: string, tagId: string): void {
      db.prepare('DELETE FROM cardTags WHERE cardId = ? AND tagId = ?').run(cardId, tagId)
    },
  }
}

export type TagRepo = ReturnType<typeof createTagRepo>
