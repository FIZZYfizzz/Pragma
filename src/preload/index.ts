import { contextBridge, ipcRenderer } from 'electron'

/**
 * The preload script bridges the Electron main process and the React renderer.
 * Everything exposed here is available as `window.pragma` in the renderer.
 *
 * Security rules:
 *   - contextIsolation: true  (renderer cannot access Node APIs directly)
 *   - Only expose the exact channels needed — no generic ipcRenderer passthrough
 */

const pragmaAPI = {
  // ─── Window controls ──────────────────────────────────────────────────────
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close'),
    isMaximized: (): Promise<boolean> => ipcRenderer.invoke('window:isMaximized'),
    onMaximizeChange: (cb: (maximized: boolean) => void) => {
      // Poll isn't ideal but avoids extra IPC channels for Phase 1
      // Phase 7 polish: replace with ipcMain event emissions on maximize/unmaximize
      const handler = (_: Electron.IpcRendererEvent, val: boolean) => cb(val)
      ipcRenderer.on('window:maximized-changed', handler)
      return () => ipcRenderer.off('window:maximized-changed', handler)
    },
  },
}

contextBridge.exposeInMainWorld('pragma', pragmaAPI)

export type PragmaAPI = typeof pragmaAPI
