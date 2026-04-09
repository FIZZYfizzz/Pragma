import { randomUUID } from 'crypto'
import type { Database } from 'better-sqlite3'
import type { Profile, CreateProfileInput, UpdateProfileInput } from '../../shared/types'

export function createProfileRepo(db: Database) {
  const findAll = db.prepare<[], Profile>('SELECT * FROM profiles ORDER BY createdAt ASC')
  const findById = db.prepare<[string], Profile>('SELECT * FROM profiles WHERE id = ?')
  const insert = db.prepare('INSERT INTO profiles (id, name, color, createdAt) VALUES (?, ?, ?, ?)')
  const remove = db.prepare('DELETE FROM profiles WHERE id = ?')

  return {
    list(): Profile[] {
      return findAll.all()
    },

    findById(id: string): Profile | undefined {
      return findById.get(id)
    },

    create(input: CreateProfileInput): Profile {
      const id = randomUUID()
      const createdAt = Date.now()
      insert.run(id, input.name, input.color, createdAt)
      return { id, name: input.name, color: input.color, createdAt }
    },

    update(id: string, input: UpdateProfileInput): Profile {
      const sets: string[] = []
      const values: unknown[] = []
      if (input.name !== undefined) { sets.push('name = ?'); values.push(input.name) }
      if (input.color !== undefined) { sets.push('color = ?'); values.push(input.color) }
      if (sets.length > 0) {
        values.push(id)
        db.prepare(`UPDATE profiles SET ${sets.join(', ')} WHERE id = ?`).run(...values)
      }
      return findById.get(id)!
    },

    delete(id: string): void {
      remove.run(id)
    },
  }
}

export type ProfileRepo = ReturnType<typeof createProfileRepo>
