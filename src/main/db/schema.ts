import type { Database } from 'better-sqlite3'

/**
 * Creates all tables on first run.
 * Every statement uses IF NOT EXISTS so this is safe to call on every launch.
 * Foreign keys cascade deletes down the hierarchy:
 *   Profile → Pragma → Board → Lane → Card
 */
export function initSchema(db: Database): void {
  db.exec(`
    -- Key/value store for app-level settings (PIN hash, active profile, theme, etc.)
    CREATE TABLE IF NOT EXISTS appSettings (
      key       TEXT PRIMARY KEY,
      value     TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS profiles (
      id        TEXT PRIMARY KEY,
      name      TEXT NOT NULL,
      color     TEXT NOT NULL DEFAULT '#7c6af7',
      createdAt INTEGER NOT NULL
    );

    -- A "Pragma" is the top-level project container (Profile → Pragma → Board)
    CREATE TABLE IF NOT EXISTS pragmas (
      id          TEXT PRIMARY KEY,
      profileId   TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      name        TEXT NOT NULL,
      description TEXT,
      coverColor  TEXT,
      position    REAL NOT NULL DEFAULT 0,
      createdAt   INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS boards (
      id         TEXT PRIMARY KEY,
      pragmaId   TEXT NOT NULL REFERENCES pragmas(id) ON DELETE CASCADE,
      name       TEXT NOT NULL,
      coverColor TEXT,
      position   REAL NOT NULL DEFAULT 0,
      createdAt  INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS lanes (
      id        TEXT PRIMARY KEY,
      boardId   TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
      name      TEXT NOT NULL,
      color     TEXT,
      position  REAL NOT NULL DEFAULT 0,
      createdAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cards (
      id          TEXT PRIMARY KEY,
      laneId      TEXT NOT NULL REFERENCES lanes(id) ON DELETE CASCADE,
      title       TEXT NOT NULL,
      description TEXT,
      priority    TEXT NOT NULL DEFAULT 'none',
      dueDate     INTEGER,
      position    REAL NOT NULL DEFAULT 0,
      isArchived  INTEGER NOT NULL DEFAULT 0,
      createdAt   INTEGER NOT NULL,
      updatedAt   INTEGER NOT NULL
    );

    -- Tags belong to a Pragma — shared across all boards within that Pragma
    CREATE TABLE IF NOT EXISTS tags (
      id        TEXT PRIMARY KEY,
      pragmaId  TEXT NOT NULL REFERENCES pragmas(id) ON DELETE CASCADE,
      name      TEXT NOT NULL,
      color     TEXT NOT NULL DEFAULT '#7c6af7',
      createdAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cardTags (
      cardId TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
      tagId  TEXT NOT NULL REFERENCES tags(id)  ON DELETE CASCADE,
      PRIMARY KEY (cardId, tagId)
    );

    -- Indexes on foreign keys for faster cascaded queries
    CREATE INDEX IF NOT EXISTS idx_pragmas_profileId   ON pragmas(profileId);
    CREATE INDEX IF NOT EXISTS idx_boards_pragmaId     ON boards(pragmaId);
    CREATE INDEX IF NOT EXISTS idx_lanes_boardId       ON lanes(boardId);
    CREATE INDEX IF NOT EXISTS idx_cards_laneId        ON cards(laneId);
    CREATE INDEX IF NOT EXISTS idx_tags_pragmaId       ON tags(pragmaId);
    CREATE INDEX IF NOT EXISTS idx_cardTags_cardId     ON cardTags(cardId);
    CREATE INDEX IF NOT EXISTS idx_cardTags_tagId      ON cardTags(tagId);
    CREATE INDEX IF NOT EXISTS idx_cards_isArchived    ON cards(isArchived);
  `)
}
