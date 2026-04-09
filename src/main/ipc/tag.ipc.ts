import { ipcMain } from 'electron'
import type { TagRepo } from '../repositories/tag.repo'
import type { CreateTagInput, UpdateTagInput } from '../../shared/types'

export function registerTagIpc(tags: TagRepo): void {
  ipcMain.handle('db:tag:listByPragma', (_, pragmaId: string) => tags.listByPragma(pragmaId))

  ipcMain.handle('db:tag:listByCard', (_, cardId: string) => tags.listByCard(cardId))

  ipcMain.handle('db:tag:create', (_, input: CreateTagInput) => tags.create(input))

  ipcMain.handle('db:tag:update', (_, id: string, input: UpdateTagInput) =>
    tags.update(id, input)
  )

  ipcMain.handle('db:tag:delete', (_, id: string) => tags.delete(id))

  ipcMain.handle('db:tag:addToCard', (_, cardId: string, tagId: string) =>
    tags.addToCard(cardId, tagId)
  )

  ipcMain.handle('db:tag:removeFromCard', (_, cardId: string, tagId: string) =>
    tags.removeFromCard(cardId, tagId)
  )
}
