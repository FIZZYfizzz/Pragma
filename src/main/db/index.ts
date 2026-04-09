import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { initSchema } from './schema'

let _db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!_db) throw new Error('Database not initialized. Call initDb() first.')
  return _db
}

export function initDb(): void {
  const dbPath = join(app.getPath('userData'), 'pragma.db')

  _db = new Database(dbPath)

  // WAL mode: better read/write concurrency and crash recovery
  _db.pragma('journal_mode = WAL')
  // Enforce foreign key constraints (SQLite disables them by default)
  _db.pragma('foreign_keys = ON')

  initSchema(_db)
}
