import { ipcMain } from 'electron'
import type { PragmaRepo } from '../repositories/pragma.repo'
import type { CreatePragmaInput, UpdatePragmaInput } from '../../shared/types'

export function registerPragmaIpc(pragmas: PragmaRepo): void {
  ipcMain.handle('db:pragma:list', (_, profileId: string) => pragmas.list(profileId))

  ipcMain.handle('db:pragma:create', (_, input: CreatePragmaInput) =>
    pragmas.create(input)
  )

  ipcMain.handle('db:pragma:update', (_, id: string, input: UpdatePragmaInput) =>
    pragmas.update(id, input)
  )

  ipcMain.handle('db:pragma:delete', (_, id: string) => pragmas.delete(id))
}
