import type { Database } from 'better-sqlite3'
import { createSettingsRepo } from '../repositories/settings.repo'
import { createProfileRepo } from '../repositories/profile.repo'
import { createPragmaRepo } from '../repositories/pragma.repo'
import { createBoardRepo } from '../repositories/board.repo'
import { createLaneRepo } from '../repositories/lane.repo'
import { createCardRepo } from '../repositories/card.repo'
import { createTagRepo } from '../repositories/tag.repo'
import { registerSettingsIpc } from './settings.ipc'
import { registerProfileIpc } from './profile.ipc'
import { registerPragmaIpc } from './pragma.ipc'
import { registerBoardIpc } from './board.ipc'
import { registerLaneIpc } from './lane.ipc'
import { registerCardIpc } from './card.ipc'
import { registerTagIpc } from './tag.ipc'

export function registerAllIpc(db: Database): void {
  registerSettingsIpc(createSettingsRepo(db))
  registerProfileIpc(createProfileRepo(db))
  registerPragmaIpc(createPragmaRepo(db))
  registerBoardIpc(createBoardRepo(db))
  registerLaneIpc(createLaneRepo(db))
  registerCardIpc(createCardRepo(db))
  registerTagIpc(createTagRepo(db))
}
