import { createHash } from 'crypto'
import type { Database } from 'better-sqlite3'

export function createSettingsRepo(db: Database) {
  const get = db.prepare<[string], { value: string }>('SELECT value FROM appSettings WHERE key = ?')
  const set = db.prepare('INSERT OR REPLACE INTO appSettings (key, value) VALUES (?, ?)')
  const del = db.prepare('DELETE FROM appSettings WHERE key = ?')

  function hashPin(pin: string): string {
    return createHash('sha256').update(pin).digest('hex')
  }

  return {
    get(key: string): string | null {
      return get.get(key)?.value ?? null
    },

    set(key: string, value: string): void {
      set.run(key, value)
    },

    delete(key: string): void {
      del.run(key)
    },

    // ─── PIN ────────────────────────────────────────────────────────────────

    pinExists(): boolean {
      return get.get('pinHash') != null
    },

    setPin(pin: string): void {
      set.run('pinHash', hashPin(pin))
    },

    verifyPin(pin: string): boolean {
      const stored = get.get('pinHash')?.value
      if (!stored) return false
      return hashPin(pin) === stored
    },
  }
}

export type SettingsRepo = ReturnType<typeof createSettingsRepo>
