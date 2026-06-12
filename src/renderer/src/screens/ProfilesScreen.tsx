import { useEffect, useRef, useState } from 'react'
import type { Profile } from '@shared/types'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { useAppStore } from '@/stores/app.store'
import { toast } from '@/stores/toast.store'

const AVATAR_COLORS = [
  '#7c6af7', // violet (brand default)
  '#60a5fa', // blue
  '#f472b6', // pink
  '#34d399', // emerald
  '#fbbf24', // amber
  '#f87171', // red
  '#a78bfa', // purple
  '#6ee7b7', // teal
]

function avatarInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function ProfileCard({
  profile,
  onSelect,
  onEdit,
}: {
  profile: Profile
  onSelect: () => void
  onEdit: () => void
}) {
  return (
    <div className="relative group">
      <button
        onClick={onSelect}
        className="flex flex-col items-center gap-3 p-5 rounded-2xl transition-colors duration-150 cursor-pointer"
        style={{ background: 'var(--bg-surface)' }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = 'var(--bg-subtle)')
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.background = 'var(--bg-surface)')
        }
      >
        {/* Avatar */}
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-semibold text-white select-none"
          style={{ background: profile.color }}
        >
          {avatarInitials(profile.name)}
        </div>
        {/* Name */}
        <span
          className="text-sm font-medium max-w-[8rem] truncate"
          style={{ color: 'var(--text-primary)' }}
        >
          {profile.name}
        </span>
      </button>

      {/* Edit — visible on hover */}
      <button
        title="Edit profile"
        onClick={onEdit}
        className="absolute top-2 right-2 p-1.5 rounded-lg cursor-pointer opacity-0 group-hover:opacity-70 hover:!opacity-100 transition-opacity"
        style={{ color: 'var(--text-secondary)', background: 'var(--bg-elevated)' }}
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
          <path d="M11.013 1.427a1.75 1.75 0 012.474 0l1.086 1.086a1.75 1.75 0 010 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 01-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61zm1.414 1.06a.25.25 0 00-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 000-.354l-1.086-1.086zM11.189 6.25L9.75 4.81 3.23 11.33a.25.25 0 00-.064.108l-.618 2.162 2.162-.617a.25.25 0 00.108-.064l6.521-6.52-.15-.149z" />
        </svg>
      </button>
    </div>
  )
}

// ─── Edit profile dialog ──────────────────────────────────────────────────────

function EditProfileDialog({
  profile,
  onClose,
  onSaved,
  onDeleted,
}: {
  profile: Profile
  onClose: () => void
  onSaved: (updated: Profile) => void
  onDeleted: (id: string) => void
}) {
  const [name, setName] = useState(profile.name)
  const [color, setColor] = useState(profile.color)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [busy, setBusy] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || busy) return
    setBusy(true)
    await window.pragma.profile.update(profile.id, { name: name.trim(), color })
    onSaved({ ...profile, name: name.trim(), color })
    setBusy(false)
    onClose()
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    setBusy(true)
    await window.pragma.profile.delete(profile.id)
    setBusy(false)
    onDeleted(profile.id)
    toast.success('Profile deleted')
    onClose()
  }

  return (
    <Dialog isOpen onClose={onClose} title="Edit Profile" width="max-w-xs">
      <form onSubmit={handleSave} className="flex flex-col gap-5">
        {/* Avatar preview + color picker */}
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-semibold text-white select-none"
            style={{ background: color }}
          >
            {name.trim() ? avatarInitials(name) : '?'}
          </div>
          <div className="flex gap-2 flex-wrap justify-center">
            {AVATAR_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className="w-6 h-6 rounded-full transition-transform duration-100 cursor-pointer"
                style={{
                  background: c,
                  transform: color === c ? 'scale(1.2)' : undefined,
                  boxShadow:
                    color === c ? `0 0 0 2px var(--bg-elevated), 0 0 0 4px ${c}` : undefined,
                }}
              />
            ))}
          </div>
        </div>

        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={40}
          placeholder="Name"
          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)',
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--color-brand)')}
          onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
        />

        <div className="flex gap-2">
          <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" className="flex-1" disabled={!name.trim() || busy}>
            Save
          </Button>
        </div>

        <div style={{ height: 1, background: 'var(--border-subtle)' }} />

        <Button
          type="button"
          variant="danger"
          size="sm"
          onClick={handleDelete}
          onBlur={() => setConfirmDelete(false)}
          disabled={busy}
        >
          {confirmDelete ? 'Delete profile and ALL its data?' : 'Delete profile'}
        </Button>
      </form>
    </Dialog>
  )
}

export function ProfilesScreen() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(AVATAR_COLORS[0])
  const [creating, setCreating] = useState(false)
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)

  const setView = useAppStore((s) => s.setView)
  const setActiveProfile = useAppStore((s) => s.setActiveProfile)

  useEffect(() => {
    window.pragma.profile.list().then((list) => {
      setProfiles(list as Profile[])
      setLoading(false)
      // No profiles yet → open create form immediately
      if ((list as Profile[]).length === 0) setShowCreate(true)
    })
  }, [])

  // Focus name input when create form opens
  useEffect(() => {
    if (showCreate) {
      setTimeout(() => nameInputRef.current?.focus(), 50)
    }
  }, [showCreate])

  function selectProfile(id: string) {
    setActiveProfile(id)
    setView('home')
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim() || creating) return
    setCreating(true)
    const profile = (await window.pragma.profile.create({
      name: newName.trim(),
      color: newColor,
    })) as Profile
    const isFirst = profiles.length === 0
    setProfiles((p) => [...p, profile])
    setNewName('')
    setNewColor(AVATAR_COLORS[0])
    setShowCreate(false)
    setCreating(false)
    if (isFirst) selectProfile(profile.id)
  }

  if (loading) return null

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-8 p-8">
      {/* Heading — hide when showing first-run create form */}
      {!(profiles.length === 0 && showCreate) && (
        <h1
          className="text-xl font-semibold tracking-tight"
          style={{ color: 'var(--text-primary)' }}
        >
          Who's using Pragma?
        </h1>
      )}

      {/* Profile grid */}
      {profiles.length > 0 && (
        <div className="flex flex-wrap gap-3 justify-center max-w-xl">
          {profiles.map((p) => (
            <ProfileCard
              key={p.id}
              profile={p}
              onSelect={() => selectProfile(p.id)}
              onEdit={() => setEditingProfile(p)}
            />
          ))}

          {/* Add profile tile */}
          {!showCreate && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex flex-col items-center gap-3 p-5 rounded-2xl transition-colors duration-150 cursor-pointer"
              style={{ background: 'var(--bg-surface)' }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = 'var(--bg-subtle)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = 'var(--bg-surface)')
              }
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl"
                style={{
                  border: '2px dashed var(--border-medium)',
                  color: 'var(--text-tertiary)',
                }}
              >
                +
              </div>
              <span className="text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>
                Add Profile
              </span>
            </button>
          )}
        </div>
      )}

      {/* Create profile form */}
      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="flex flex-col gap-5 w-full max-w-xs rounded-2xl p-6"
          style={{ background: 'var(--bg-surface)', boxShadow: 'var(--shadow-panel)' }}
        >
          <h2
            className="text-base font-semibold text-center"
            style={{ color: 'var(--text-primary)' }}
          >
            {profiles.length === 0 ? 'Create your first profile' : 'New Profile'}
          </h2>

          {/* Avatar preview + color picker */}
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-semibold text-white select-none"
              style={{ background: newColor }}
            >
              {newName.trim() ? avatarInitials(newName) : '?'}
            </div>
            <div className="flex gap-2 flex-wrap justify-center">
              {AVATAR_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewColor(color)}
                  className={cn(
                    'w-6 h-6 rounded-full transition-transform duration-100 cursor-pointer',
                    newColor === color && 'scale-125 ring-2 ring-offset-2'
                  )}
                  style={{
                    background: color,
                    outlineColor: color,
                    boxShadow:
                      newColor === color
                        ? `0 0 0 2px var(--bg-surface), 0 0 0 4px ${color}`
                        : undefined,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Name input */}
          <input
            ref={nameInputRef}
            type="text"
            placeholder="Your name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            maxLength={40}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-colors"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
            }}
            onFocus={(e) =>
              (e.currentTarget.style.borderColor = 'var(--color-brand)')
            }
            onBlur={(e) =>
              (e.currentTarget.style.borderColor = 'var(--border-subtle)')
            }
          />

          {/* Actions */}
          <div className="flex gap-2">
            {profiles.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                className="flex-1"
                onClick={() => {
                  setShowCreate(false)
                  setNewName('')
                  setNewColor(AVATAR_COLORS[0])
                }}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={!newName.trim() || creating}
            >
              {creating ? 'Creating…' : 'Create'}
            </Button>
          </div>
        </form>
      )}

      {/* Edit profile dialog */}
      {editingProfile && (
        <EditProfileDialog
          profile={editingProfile}
          onClose={() => setEditingProfile(null)}
          onSaved={(updated) =>
            setProfiles((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
          }
          onDeleted={(id) =>
            setProfiles((prev) => prev.filter((p) => p.id !== id))
          }
        />
      )}
    </div>
  )
}
