import { ipcMain } from 'electron'
import type { ProfileRepo } from '../repositories/profile.repo'
import type { CreateProfileInput, UpdateProfileInput } from '../../shared/types'

export function registerProfileIpc(profiles: ProfileRepo): void {
  ipcMain.handle('db:profile:list', () => profiles.list())

  ipcMain.handle('db:profile:create', (_, input: CreateProfileInput) =>
    profiles.create(input)
  )

  ipcMain.handle('db:profile:update', (_, id: string, input: UpdateProfileInput) =>
    profiles.update(id, input)
  )

  ipcMain.handle('db:profile:delete', (_, id: string) => profiles.delete(id))
}
