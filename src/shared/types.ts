// ─── Domain types shared between main process and renderer ───────────────────
// All timestamps are Unix milliseconds (Date.now()).
// SQLite booleans are stored as 0 | 1.

export interface Profile {
  id: string
  name: string
  color: string        // hex — used for avatar background
  createdAt: number
}

// Named PragmaProject to avoid collision with the Pragma namespace/app name.
// In the UI this is simply called a "Pragma".
export interface PragmaProject {
  id: string
  profileId: string
  name: string
  description: string | null
  coverColor: string | null
  position: number
  createdAt: number
}

export interface Board {
  id: string
  pragmaId: string
  name: string
  coverColor: string | null
  position: number
  createdAt: number
}

export interface Lane {
  id: string
  boardId: string
  name: string
  color: string | null
  position: number
  createdAt: number
}

export type Priority = 'none' | 'low' | 'medium' | 'high' | 'urgent'

export interface Card {
  id: string
  laneId: string
  title: string
  description: string | null
  priority: Priority
  dueDate: number | null
  position: number
  isArchived: 0 | 1
  createdAt: number
  updatedAt: number
}

export interface Tag {
  id: string
  pragmaId: string
  name: string
  color: string
  createdAt: number
}

// ─── Composed types (returned by full-load queries) ───────────────────────────

export interface CardWithTags extends Card {
  tags: Tag[]
}

export interface LaneWithCards extends Lane {
  cards: CardWithTags[]
}

export interface BoardWithLanes extends Board {
  lanes: LaneWithCards[]
}

// ─── Input types (what the renderer sends to create/update) ──────────────────

export interface CreateProfileInput {
  name: string
  color: string
}

export interface UpdateProfileInput {
  name?: string
  color?: string
}

export interface CreatePragmaInput {
  profileId: string
  name: string
  description?: string
  coverColor?: string
}

export interface UpdatePragmaInput {
  name?: string
  description?: string | null
  coverColor?: string | null
  position?: number
}

export interface CreateBoardInput {
  pragmaId: string
  name: string
  coverColor?: string
  template?: BoardTemplate
}

export interface UpdateBoardInput {
  name?: string
  coverColor?: string | null
  position?: number
}

export interface CreateLaneInput {
  boardId: string
  name: string
  color?: string
}

export interface UpdateLaneInput {
  name?: string
  color?: string | null
  position?: number
}

export interface CreateCardInput {
  laneId: string
  title: string
  description?: string
  priority?: Priority
  dueDate?: number
}

export interface UpdateCardInput {
  title?: string
  description?: string | null
  priority?: Priority
  dueDate?: number | null
  position?: number
  laneId?: string
  isArchived?: 0 | 1
}

export interface CreateTagInput {
  pragmaId: string
  name: string
  color: string
}

export interface UpdateTagInput {
  name?: string
  color?: string
}

// ─── PIN ──────────────────────────────────────────────────────────────────────

export interface PinVerifyResult {
  ok: boolean
  /** Epoch ms until which further attempts are rejected (set when locked out) */
  lockedUntil?: number
  /** Failed attempts remaining before lockout (omitted on success) */
  attemptsLeft?: number
}

// ─── Board templates ──────────────────────────────────────────────────────────

export type BoardTemplate = 'blank' | 'kanban' | 'sprint' | 'simple'

export const BOARD_TEMPLATES: Record<BoardTemplate, { label: string; lanes: string[] }> = {
  blank: {
    label: 'Blank',
    lanes: [],
  },
  kanban: {
    label: 'Kanban',
    lanes: ['Backlog', 'In Progress', 'Review', 'Done'],
  },
  sprint: {
    label: 'Sprint',
    lanes: ['To Do', 'In Progress', 'Blocked', 'Done'],
  },
  simple: {
    label: 'Simple',
    lanes: ['To Do', 'Done'],
  },
}
