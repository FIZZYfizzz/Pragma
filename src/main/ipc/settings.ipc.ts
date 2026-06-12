import { ipcMain } from 'electron'
import type { SettingsRepo } from '../repositories/settings.repo'
import type { PinVerifyResult } from '../../shared/types'

const MAX_ATTEMPTS = 5
const BASE_LOCKOUT_MS = 30_000 // doubles with each consecutive lockout

export function registerSettingsIpc(settings: SettingsRepo): void {
  let failedAttempts = 0
  let lockoutCount = 0
  let lockedUntil = 0

  ipcMain.handle('db:settings:get', (_, key: string) => settings.get(key))
  ipcMain.handle('db:settings:set', (_, key: string, value: string) => settings.set(key, value))

  ipcMain.handle('db:pin:exists', () => settings.pinExists())
  ipcMain.handle('db:pin:set', (_, pin: string) => settings.setPin(pin))

  // Requires the current PIN so a hijacked renderer can't silently drop the lock
  ipcMain.handle('db:pin:remove', (_, currentPin: string): boolean => {
    if (typeof currentPin === 'string' && settings.verifyPin(currentPin)) {
      settings.delete('pinHash')
      return true
    }
    return false
  })

  ipcMain.handle('db:pin:verify', (_, pin: string): PinVerifyResult => {
    const now = Date.now()
    if (now < lockedUntil) {
      return { ok: false, lockedUntil, attemptsLeft: 0 }
    }

    if (typeof pin === 'string' && settings.verifyPin(pin)) {
      failedAttempts = 0
      lockoutCount = 0
      lockedUntil = 0
      return { ok: true }
    }

    failedAttempts++
    if (failedAttempts >= MAX_ATTEMPTS) {
      lockoutCount++
      lockedUntil = now + BASE_LOCKOUT_MS * 2 ** (lockoutCount - 1)
      failedAttempts = 0
      return { ok: false, lockedUntil, attemptsLeft: 0 }
    }
    return { ok: false, attemptsLeft: MAX_ATTEMPTS - failedAttempts }
  })
}
