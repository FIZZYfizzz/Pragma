import { contextBridge, ipcRenderer } from 'electron'
import type {
  CreateProfileInput, UpdateProfileInput,
  CreatePragmaInput, UpdatePragmaInput,
  CreateBoardInput, UpdateBoardInput,
  CreateLaneInput, UpdateLaneInput,
  CreateCardInput, UpdateCardInput,
  CreateTagInput, UpdateTagInput,
} from '../shared/types'

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
      const handler = (_: Electron.IpcRendererEvent, val: boolean) => cb(val)
      ipcRenderer.on('window:maximized-changed', handler)
      return () => ipcRenderer.off('window:maximized-changed', handler)
    },
  },

  // ─── Settings & PIN ───────────────────────────────────────────────────────
  settings: {
    get: (key: string): Promise<string | undefined> => ipcRenderer.invoke('db:settings:get', key),
    set: (key: string, value: string): Promise<void> => ipcRenderer.invoke('db:settings:set', key, value),
  },
  pin: {
    exists: (): Promise<boolean> => ipcRenderer.invoke('db:pin:exists'),
    set: (pin: string): Promise<void> => ipcRenderer.invoke('db:pin:set', pin),
    verify: (pin: string): Promise<boolean> => ipcRenderer.invoke('db:pin:verify', pin),
  },

  // ─── Profiles ─────────────────────────────────────────────────────────────
  profile: {
    list: () => ipcRenderer.invoke('db:profile:list'),
    create: (input: CreateProfileInput) => ipcRenderer.invoke('db:profile:create', input),
    update: (id: string, input: UpdateProfileInput) => ipcRenderer.invoke('db:profile:update', id, input),
    delete: (id: string) => ipcRenderer.invoke('db:profile:delete', id),
  },

  // ─── Pragmas ──────────────────────────────────────────────────────────────
  pragma: {
    list: (profileId: string) => ipcRenderer.invoke('db:pragma:list', profileId),
    create: (input: CreatePragmaInput) => ipcRenderer.invoke('db:pragma:create', input),
    update: (id: string, input: UpdatePragmaInput) => ipcRenderer.invoke('db:pragma:update', id, input),
    delete: (id: string) => ipcRenderer.invoke('db:pragma:delete', id),
  },

  // ─── Boards ───────────────────────────────────────────────────────────────
  board: {
    list: (pragmaId: string) => ipcRenderer.invoke('db:board:list', pragmaId),
    full: (boardId: string) => ipcRenderer.invoke('db:board:full', boardId),
    create: (input: CreateBoardInput) => ipcRenderer.invoke('db:board:create', input),
    update: (id: string, input: UpdateBoardInput) => ipcRenderer.invoke('db:board:update', id, input),
    delete: (id: string) => ipcRenderer.invoke('db:board:delete', id),
  },

  // ─── Lanes ────────────────────────────────────────────────────────────────
  lane: {
    list: (boardId: string) => ipcRenderer.invoke('db:lane:list', boardId),
    create: (input: CreateLaneInput) => ipcRenderer.invoke('db:lane:create', input),
    update: (id: string, input: UpdateLaneInput) => ipcRenderer.invoke('db:lane:update', id, input),
    delete: (id: string) => ipcRenderer.invoke('db:lane:delete', id),
  },

  // ─── Cards ────────────────────────────────────────────────────────────────
  card: {
    list: (laneId: string) => ipcRenderer.invoke('db:card:list', laneId),
    create: (input: CreateCardInput) => ipcRenderer.invoke('db:card:create', input),
    update: (id: string, input: UpdateCardInput) => ipcRenderer.invoke('db:card:update', id, input),
    move: (cardId: string, laneId: string, position: number) =>
      ipcRenderer.invoke('db:card:move', cardId, laneId, position),
    delete: (id: string) => ipcRenderer.invoke('db:card:delete', id),
  },

  // ─── Tags ─────────────────────────────────────────────────────────────────
  tag: {
    listByPragma: (pragmaId: string) => ipcRenderer.invoke('db:tag:listByPragma', pragmaId),
    listByCard: (cardId: string) => ipcRenderer.invoke('db:tag:listByCard', cardId),
    create: (input: CreateTagInput) => ipcRenderer.invoke('db:tag:create', input),
    update: (id: string, input: UpdateTagInput) => ipcRenderer.invoke('db:tag:update', id, input),
    delete: (id: string) => ipcRenderer.invoke('db:tag:delete', id),
    addToCard: (cardId: string, tagId: string) => ipcRenderer.invoke('db:tag:addToCard', cardId, tagId),
    removeFromCard: (cardId: string, tagId: string) => ipcRenderer.invoke('db:tag:removeFromCard', cardId, tagId),
  },
}

contextBridge.exposeInMainWorld('pragma', pragmaAPI)

export type PragmaAPI = typeof pragmaAPI
