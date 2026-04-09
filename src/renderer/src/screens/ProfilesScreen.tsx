import { useEffect, useRef, useState } from 'react'
import type { Profile } from '@shared/types'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/Button'
import { useAppStore } from '@/stores/app.store'

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
}: {
  profile: Profile
  onSelect: () => void
}) {
  return (
    <button
      onClick={onSelect}
      className="flex flex-col items-center gap-3 p-5 rounded-2xl transition-colors duration-150 cursor-pointer group"
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
  )
}

export function ProfilesScreen() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(AVATAR_COLORS[0])
  const [creating, setCreating] = useState(false)
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
            <ProfileCard key={p.id} profile={p} onSelect={() => selectProfile(p.id)} />
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
                    ringColor: color,
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
    </div>
  )
}
