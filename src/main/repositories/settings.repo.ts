import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'crypto'
import type { Database } from 'better-sqlite3'

/**
 * PIN storage format: `scrypt:<salt hex>:<hash hex>`.
 * Legacy installs stored a bare unsalted sha256 hex digest — those are
 * verified against sha256 once and transparently re-hashed with scrypt
 * on the next successful unlock.
 */
const SCRYPT_KEYLEN = 32

function hashPin(pin: string, salt: Buffer): Buffer {
  return scryptSync(pin, salt, SCRYPT_KEYLEN)
}

export function createSettingsRepo(db: Database) {
  const get = db.prepare<[string], { value: string }>('SELECT value FROM appSettings WHERE key = ?')
  const set = db.prepare('INSERT OR REPLACE INTO appSettings (key, value) VALUES (?, ?)')
  const del = db.prepare('DELETE FROM appSettings WHERE key = ?')

  function storePin(pin: string): void {
    const salt = randomBytes(16)
    const hash = hashPin(pin, salt)
    set.run('pinHash', `scrypt:${salt.toString('hex')}:${hash.toString('hex')}`)
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
      storePin(pin)
    },

    verifyPin(pin: string): boolean {
      const stored = get.get('pinHash')?.value
      if (!stored) return false

      if (stored.startsWith('scrypt:')) {
        const [, saltHex, hashHex] = stored.split(':')
        if (!saltHex || !hashHex) return false
        const expected = Buffer.from(hashHex, 'hex')
        const actual = hashPin(pin, Buffer.from(saltHex, 'hex'))
        return expected.length === actual.length && timingSafeEqual(actual, expected)
      }

      // Legacy unsalted sha256 — verify, then upgrade in place
      const legacy = createHash('sha256').update(pin).digest()
      const storedBuf = Buffer.from(stored, 'hex')
      const ok = legacy.length === storedBuf.length && timingSafeEqual(legacy, storedBuf)
      if (ok) storePin(pin)
      return ok
    },
  }
}

export type SettingsRepo = ReturnType<typeof createSettingsRepo>
