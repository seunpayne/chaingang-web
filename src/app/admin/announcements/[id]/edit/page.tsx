'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { updateAnnouncement } from '@/app/actions/announcements'

interface Announcement {
  id: string
  title: string
  body: string
  type: 'Event' | 'Urgent' | 'Info'
  active: boolean
  expires_at: string | null
}

export default function EditAnnouncementPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [type, setType] = useState<'Event' | 'Urgent' | 'Info'>('Info')
  const [active, setActive] = useState(true)
  const [expiresAt, setExpiresAt] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/announcements/${id}`)
      if (res.ok) {
        const data: Announcement = await res.json()
        setTitle(data.title)
        setBody(data.body)
        setType(data.type)
        setActive(data.active)
        setExpiresAt(
          data.expires_at
            ? new Date(data.expires_at).toISOString().slice(0, 16)
            : ''
        )
      }
      setLoading(false)
    }
    load()
  }, [id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const result = await updateAnnouncement(id, {
      title,
      body,
      type,
      active,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
    })

    if (result.error) {
      setError(result.error)
      setSaving(false)
    } else {
      router.push('/admin/announcements')
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-cream">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="animate-pulse text-forest-400">Loading...</div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-cream">
      <header className="bg-forest text-cream">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/admin" className="font-display text-xl font-bold text-gold">
            Admin Panel
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/admin/announcements" className="text-sm hover:text-gold transition-colors">
              All Announcements
            </Link>
          </div>
        </div>
      </header>

      <section className="py-8">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="font-display text-3xl font-bold text-forest mb-8">
            Edit Announcement
          </h1>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-500 rounded-lg border border-red-200 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-forest mb-2">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-4 py-2 border border-cream-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-forest mb-2">Body</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
                rows={6}
                className="w-full px-4 py-2 border border-cream-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-forest mb-2">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as 'Event' | 'Urgent' | 'Info')}
                  className="w-full px-4 py-2 border border-cream-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent bg-white"
                >
                  <option value="Info">Info</option>
                  <option value="Event">Event</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-forest mb-2">
                  Expires At (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full px-4 py-2 border border-cream-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="active"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="rounded border-cream-300 text-gold focus:ring-gold"
              />
              <label htmlFor="active" className="text-sm text-forest">
                Active (show to members)
              </label>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <button
                type="submit"
                disabled={saving || !title}
                className="btn-primary disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Update Announcement'}
              </button>
              <Link href="/admin/announcements" className="btn-secondary">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </section>
    </main>
  )
}
