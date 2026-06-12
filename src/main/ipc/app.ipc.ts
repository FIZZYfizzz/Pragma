import { ipcMain, dialog } from 'electron'
import { writeFileSync, readFileSync } from 'fs'
import { randomUUID } from 'crypto'
import type { Database } from 'better-sqlite3'

interface PragmaExport {
  version: number
  pragma: Record<string, unknown>
  boards: Record<string, unknown>[]
  lanes: Record<string, unknown>[]
  cards: Record<string, unknown>[]
  tags: Record<string, unknown>[]
  cardTags: Record<string, unknown>[]
}

interface BoardExport {
  version: number
  type: 'board'
  board: Record<string, unknown>
  lanes: Record<string, unknown>[]
  cards: Record<string, unknown>[]
  tags: Record<string, unknown>[]
  cardTags: Record<string, unknown>[]
}

// Strip characters Windows forbids in filenames
function safeFileName(name: unknown): string {
  return String(name).replace(/[<>:"/\\|?*]/g, '_').trim() || 'export'
}

export function registerAppIpc(db: Database): void {
  // ─── Export ──────────────────────────────────────────────────────────────────

  ipcMain.handle('app:export-pragma', async (_, pragmaId: string) => {
    const pragma = db.prepare('SELECT * FROM pragmas WHERE id = ?').get(pragmaId) as Record<string, unknown>
    if (!pragma) return { success: false, error: 'Pragma not found' }

    const boards = db
      .prepare('SELECT * FROM boards WHERE pragmaId = ? ORDER BY position ASC')
      .all(pragmaId) as Record<string, unknown>[]

    const boardIds = boards.map((b) => b['id'] as string)

    const lanes =
      boardIds.length > 0
        ? (db
            .prepare(
              `SELECT * FROM lanes WHERE boardId IN (${boardIds.map(() => '?').join(',')}) ORDER BY position ASC`
            )
            .all(...boardIds) as Record<string, unknown>[])
        : []

    const laneIds = lanes.map((l) => l['id'] as string)

    const cards =
      laneIds.length > 0
        ? (db
            .prepare(
              `SELECT * FROM cards WHERE laneId IN (${laneIds.map(() => '?').join(',')}) ORDER BY position ASC`
            )
            .all(...laneIds) as Record<string, unknown>[])
        : []

    const cardIds = cards.map((c) => c['id'] as string)

    const tags = db
      .prepare('SELECT * FROM tags WHERE pragmaId = ? ORDER BY name ASC')
      .all(pragmaId) as Record<string, unknown>[]

    const cardTags =
      cardIds.length > 0
        ? (db
            .prepare(
              `SELECT * FROM cardTags WHERE cardId IN (${cardIds.map(() => '?').join(',')})`
            )
            .all(...cardIds) as Record<string, unknown>[])
        : []

    const exportData: PragmaExport = { version: 1, pragma, boards, lanes, cards, tags, cardTags }

    const { canceled, filePath } = await dialog.showSaveDialog({
      defaultPath: `${safeFileName(pragma['name'])}.pragma`,
      filters: [{ name: 'Pragma files', extensions: ['pragma'] }],
    })

    if (canceled || !filePath) return { success: false }

    writeFileSync(filePath, JSON.stringify(exportData, null, 2), 'utf-8')
    return { success: true, path: filePath }
  })

  // ─── Export board ────────────────────────────────────────────────────────────

  ipcMain.handle('app:export-board', async (_, boardId: string) => {
    const board = db.prepare('SELECT * FROM boards WHERE id = ?').get(boardId) as Record<string, unknown>
    if (!board) return { success: false, error: 'Board not found' }

    const lanes = db
      .prepare('SELECT * FROM lanes WHERE boardId = ? ORDER BY position ASC')
      .all(boardId) as Record<string, unknown>[]

    const laneIds = lanes.map((l) => l['id'] as string)

    const cards =
      laneIds.length > 0
        ? (db
            .prepare(
              `SELECT * FROM cards WHERE laneId IN (${laneIds.map(() => '?').join(',')}) ORDER BY position ASC`
            )
            .all(...laneIds) as Record<string, unknown>[])
        : []

    const cardIds = cards.map((c) => c['id'] as string)

    const cardTags =
      cardIds.length > 0
        ? (db
            .prepare(`SELECT * FROM cardTags WHERE cardId IN (${cardIds.map(() => '?').join(',')})`)
            .all(...cardIds) as Record<string, unknown>[])
        : []

    // Only the tags actually used on this board's cards
    const usedTagIds = [...new Set(cardTags.map((ct) => ct['tagId'] as string))]
    const tags =
      usedTagIds.length > 0
        ? (db
            .prepare(`SELECT * FROM tags WHERE id IN (${usedTagIds.map(() => '?').join(',')})`)
            .all(...usedTagIds) as Record<string, unknown>[])
        : []

    const exportData: BoardExport = { version: 1, type: 'board', board, lanes, cards, tags, cardTags }

    const { canceled, filePath } = await dialog.showSaveDialog({
      defaultPath: `${safeFileName(board['name'])}.pragmaboard`,
      filters: [{ name: 'Pragma board files', extensions: ['pragmaboard'] }],
    })

    if (canceled || !filePath) return { success: false }

    writeFileSync(filePath, JSON.stringify(exportData, null, 2), 'utf-8')
    return { success: true, path: filePath }
  })

  // ─── Import board ────────────────────────────────────────────────────────────

  ipcMain.handle('app:import-board', async (_, pragmaId: string) => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      filters: [{ name: 'Pragma board files', extensions: ['pragmaboard'] }],
      properties: ['openFile'],
    })

    if (canceled || filePaths.length === 0) return { success: false }

    let data: BoardExport
    try {
      data = JSON.parse(readFileSync(filePaths[0]!, 'utf-8')) as BoardExport
    } catch {
      return { success: false, error: 'Invalid .pragmaboard file' }
    }

    if (data.version !== 1 || data.type !== 'board') {
      return { success: false, error: 'Unsupported file version' }
    }

    const idMap = new Map<string, string>()
    const newId = (oldId: string): string => {
      if (!idMap.has(oldId)) idMap.set(oldId, randomUUID())
      return idMap.get(oldId)!
    }

    const now = Date.now()
    const maxPosition = (db
      .prepare('SELECT MAX(position) as m FROM boards WHERE pragmaId = ?')
      .get(pragmaId) as { m: number | null }).m ?? 0

    db.transaction(() => {
      const boardId = newId(data.board['id'] as string)

      db.prepare(
        'INSERT INTO boards (id, pragmaId, name, coverColor, position, createdAt) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(
        boardId,
        pragmaId,
        `${data.board['name']} (imported)`,
        data.board['coverColor'] ?? null,
        maxPosition + 1000,
        now
      )

      for (const lane of data.lanes) {
        db.prepare(
          'INSERT INTO lanes (id, boardId, name, color, position, createdAt) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(newId(lane['id'] as string), boardId, lane['name'], lane['color'] ?? null, lane['position'], now)
      }

      for (const card of data.cards) {
        db.prepare(
          'INSERT INTO cards (id, laneId, title, description, priority, dueDate, position, isArchived, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        ).run(
          newId(card['id'] as string),
          newId(card['laneId'] as string),
          card['title'],
          card['description'] ?? null,
          card['priority'] ?? 'none',
          card['dueDate'] ?? null,
          card['position'],
          0,
          now,
          now
        )
      }

      // Tags live at the pragma level — reuse an existing tag with the same name,
      // otherwise create it in the target pragma
      const findTag = db.prepare('SELECT id FROM tags WHERE pragmaId = ? AND name = ? COLLATE NOCASE')
      for (const tag of data.tags) {
        const existing = findTag.get(pragmaId, tag['name']) as { id: string } | undefined
        if (existing) {
          idMap.set(tag['id'] as string, existing.id)
        } else {
          db.prepare(
            'INSERT INTO tags (id, pragmaId, name, color, createdAt) VALUES (?, ?, ?, ?, ?)'
          ).run(newId(tag['id'] as string), pragmaId, tag['name'], tag['color'], now)
        }
      }

      for (const ct of data.cardTags) {
        const cardId = ct['cardId'] as string
        const tagId = ct['tagId'] as string
        if (idMap.has(cardId) && idMap.has(tagId)) {
          db.prepare('INSERT OR IGNORE INTO cardTags (cardId, tagId) VALUES (?, ?)').run(
            idMap.get(cardId),
            idMap.get(tagId)
          )
        }
      }
    })()

    return { success: true, boardId: idMap.get(data.board['id'] as string) }
  })

  // ─── Import ──────────────────────────────────────────────────────────────────

  ipcMain.handle('app:import-pragma', async (_, profileId: string) => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      filters: [{ name: 'Pragma files', extensions: ['pragma'] }],
      properties: ['openFile'],
    })

    if (canceled || filePaths.length === 0) return { success: false }

    let data: PragmaExport
    try {
      data = JSON.parse(readFileSync(filePaths[0]!, 'utf-8')) as PragmaExport
    } catch {
      return { success: false, error: 'Invalid .pragma file' }
    }

    if (data.version !== 1) return { success: false, error: 'Unsupported file version' }

    // Map old IDs → new IDs
    const idMap = new Map<string, string>()
    const newId = (oldId: string): string => {
      if (!idMap.has(oldId)) idMap.set(oldId, randomUUID())
      return idMap.get(oldId)!
    }

    const now = Date.now()
    const maxPosition = (db
      .prepare('SELECT MAX(position) as m FROM pragmas WHERE profileId = ?')
      .get(profileId) as { m: number | null }).m ?? 0

    db.transaction(() => {
      const pragmaId = newId(data.pragma['id'] as string)

      db.prepare(
        'INSERT INTO pragmas (id, profileId, name, description, coverColor, position, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).run(
        pragmaId,
        profileId,
        `${data.pragma['name']} (imported)`,
        data.pragma['description'] ?? null,
        data.pragma['coverColor'] ?? null,
        maxPosition + 1000,
        now
      )

      for (const board of data.boards) {
        db.prepare(
          'INSERT INTO boards (id, pragmaId, name, coverColor, position, createdAt) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(newId(board['id'] as string), pragmaId, board['name'], board['coverColor'] ?? null, board['position'], now)
      }

      for (const lane of data.lanes) {
        db.prepare(
          'INSERT INTO lanes (id, boardId, name, color, position, createdAt) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(
          newId(lane['id'] as string),
          newId(lane['boardId'] as string),
          lane['name'],
          lane['color'] ?? null,
          lane['position'],
          now
        )
      }

      for (const card of data.cards) {
        db.prepare(
          'INSERT INTO cards (id, laneId, title, description, priority, dueDate, position, isArchived, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        ).run(
          newId(card['id'] as string),
          newId(card['laneId'] as string),
          card['title'],
          card['description'] ?? null,
          card['priority'] ?? 'none',
          card['dueDate'] ?? null,
          card['position'],
          0,
          now,
          now
        )
      }

      for (const tag of data.tags) {
        db.prepare(
          'INSERT INTO tags (id, pragmaId, name, color, createdAt) VALUES (?, ?, ?, ?, ?)'
        ).run(newId(tag['id'] as string), pragmaId, tag['name'], tag['color'], now)
      }

      for (const ct of data.cardTags) {
        const cardId = ct['cardId'] as string
        const tagId = ct['tagId'] as string
        if (idMap.has(cardId) && idMap.has(tagId)) {
          db.prepare('INSERT OR IGNORE INTO cardTags (cardId, tagId) VALUES (?, ?)').run(
            newId(cardId),
            newId(tagId)
          )
        }
      }
    })()

    return { success: true, pragmaId: idMap.get(data.pragma['id'] as string) }
  })
}
