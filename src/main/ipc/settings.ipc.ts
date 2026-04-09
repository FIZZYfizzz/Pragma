import { ipcMain } from 'electron'
import type { SettingsRepo } from '../repositories/settings.repo'

export function registerSettingsIpc(settings: SettingsRepo): void {
  ipcMain.handle('db:settings:get', (_, key: string) => settings.get(key))
  ipcMain.handle('db:settings:set', (_, key: string, value: string) => settings.set(key, value))

  ipcMain.handle('db:pin:exists', () => settings.pinExists())
  ipcMain.handle('db:pin:set', (_, pin: string) => settings.setPin(pin))
  ipcMain.handle('db:pin:verify', (_, pin: string) => settings.verifyPin(pin))
}
