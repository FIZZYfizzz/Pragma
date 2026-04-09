import { ipcMain } from 'electron'
import type { LaneRepo } from '../repositories/lane.repo'
import type { CreateLaneInput, UpdateLaneInput } from '../../shared/types'

export function registerLaneIpc(lanes: LaneRepo): void {
  ipcMain.handle('db:lane:list', (_, boardId: string) => lanes.list(boardId))

  ipcMain.handle('db:lane:create', (_, input: CreateLaneInput) =>
    lanes.create(input)
  )

  ipcMain.handle('db:lane:update', (_, id: string, input: UpdateLaneInput) =>
    lanes.update(id, input)
  )

  ipcMain.handle('db:lane:delete', (_, id: string) => lanes.delete(id))
}
