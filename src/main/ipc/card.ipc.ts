import { ipcMain } from 'electron'
import type { CardRepo } from '../repositories/card.repo'
import type { CreateCardInput, UpdateCardInput } from '../../shared/types'

export function registerCardIpc(cards: CardRepo): void {
  ipcMain.handle('db:card:list', (_, laneId: string) => cards.list(laneId))

  ipcMain.handle('db:card:create', (_, input: CreateCardInput) =>
    cards.create(input)
  )

  ipcMain.handle('db:card:update', (_, id: string, input: UpdateCardInput) =>
    cards.update(id, input)
  )

  ipcMain.handle('db:card:move', (_, cardId: string, laneId: string, position: number) =>
    cards.move(cardId, laneId, position)
  )

  ipcMain.handle('db:card:delete', (_, id: string) => cards.delete(id))
}
