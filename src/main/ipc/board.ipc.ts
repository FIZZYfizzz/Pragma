import { ipcMain } from 'electron'
import type { BoardRepo } from '../repositories/board.repo'
import type { CreateBoardInput, UpdateBoardInput } from '../../shared/types'

export function registerBoardIpc(boards: BoardRepo): void {
  ipcMain.handle('db:board:list', (_, pragmaId: string) => boards.list(pragmaId))

  ipcMain.handle('db:board:full', (_, boardId: string) => boards.getFull(boardId))

  ipcMain.handle('db:board:create', (_, input: CreateBoardInput) =>
    boards.create(input)
  )

  ipcMain.handle('db:board:update', (_, id: string, input: UpdateBoardInput) =>
    boards.update(id, input)
  )

  ipcMain.handle('db:board:delete', (_, id: string) => boards.delete(id))
}
