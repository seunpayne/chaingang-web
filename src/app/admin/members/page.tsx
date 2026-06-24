'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Invite {
  id: string
  email: string
  token: string
  expires_at: string
  consumed_at: string | null
  created_at: string
}

interface Member {
  user_id: string
  role: string
  granted_at: string
  email?: string
}

export default function AdminMembersPage() {
  const [invites, setInvites] = useState<Invite[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)

  // Invite form
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteResult, setInviteResult] = useState<{
    type: 'success' | 'error'
    message: string
    inviteUrl?: string
  } | null>(null)

  // Fetch data
  useEffect(() => {
    async function load() {
      try {
        const [invitesRes, membersRes] = await Promise.all([
          fetch('/api/invites/list'),
          fetch('/api/invites/members'),
        ])
        if (invitesRes.ok) setInvites(await invitesRes.json())
        if (membersRes.ok) setMembers(await membersRes.json())
      } catch {
        // Silent on fetch error
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviting(true)
    setInviteResult(null)

    try {
      const res = await fetch('/api/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail }),
      })

      const data = await res.json()

      if (data.success) {
        setInviteResult({
          type: 'success',
          message: `Invite created! Link: ${data.inviteUrl}`,
          inviteUrl: data.inviteUrl,
        })
        setInviteEmail('')
        // Refresh list
        const invitesRes = await fetch('/api/invites/list')
        if (invitesRes.ok) setInvites(await invitesRes.json())
      } else {
        setInviteResult({
          type: 'error',
          message: data.error || 'Failed to create invite',
        })
      }
    } catch {
      setInviteResult({ type: 'error', message: 'Network error' })
    }

    setInviting(false)
  }

  return (
    <main className="min-h-screen bg-cream">
      <header className="bg-forest text-cream">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/admin" className="font-display text-xl font-bold text-gold">
            Admin Panel
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm hover:text-gold transition-colors">
              Dashboard
            </Link>
            <form action="/auth/signout" method="post">
              <button className="text-sm text-cream-200 hover:text-gold transition-colors">
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </header>

      <section className="py-8">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="font-display text-3xl font-bold text-forest mb-8">
            Member Management
          </h1>

          {/* Invite Form */}
          <div className="bg-white p-6 rounded-lg border border-cream-200 mb-8">
            <h2 className="font-display text-xl font-bold text-forest mb-4">
              Invite New Member
            </h2>

            {inviteResult && (
              <div
                className={`mb-4 p-4 rounded-lg border text-sm ${
                  inviteResult.type === 'success'
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-red-50 text-red-500 border-red-200'
                }`}
              >
                <p>{inviteResult.message}</p>
                {inviteResult.inviteUrl && (
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={inviteResult.inviteUrl}
                      className="flex-1 px-3 py-1 text-xs bg-white border rounded font-mono"
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        navigator.clipboard.writeText(inviteResult.inviteUrl!)
                      }
                      className="text-xs bg-forest text-cream px-3 py-1 rounded hover:bg-forest-600"
                    >
                      Copy
                    </button>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleInvite} className="flex gap-3">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                placeholder="member@example.com"
                className="flex-1 px-4 py-2 border border-cream-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
              />
              <button
                type="submit"
                disabled={inviting || !inviteEmail}
                className="btn-primary disabled:opacity-50"
              >
                {inviting ? 'Sending...' : 'Send Invite'}
              </button>
            </form>
            <p className="text-xs text-forest-400 mt-2">
              Invites expire after 7 days. An email is sent automatically via
              Resend.
            </p>
          </div>

          {/* Invite History */}
          <div className="bg-white rounded-lg border border-cream-200 overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-cream-200 bg-cream-50">
              <h2 className="font-display text-lg font-semibold text-forest">
                Invite History
              </h2>
            </div>
            {loading ? (
              <div className="px-6 py-8 text-center text-forest-400 animate-pulse">
                Loading...
              </div>
            ) : invites.length === 0 ? (
              <div className="px-6 py-8 text-center text-forest-400">
                No invites sent yet.
              </div>
            ) : (
              <div className="divide-y divide-cream-100">
                {invites.map((inv) => (
                  <div
                    key={inv.id}
                    className="px-6 py-4 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-medium text-forest">{inv.email}</div>
                      <div className="text-sm text-forest-400">
                        Sent {new Date(inv.created_at).toLocaleDateString()} · Expires{' '}
                        {new Date(inv.expires_at).toLocaleDateString()}
                      </div>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-semibold ${
                        inv.consumed_at
                          ? 'bg-green-100 text-green-700'
                          : new Date(inv.expires_at) < new Date()
                            ? 'bg-red-50 text-red-500'
                            : 'bg-cream-100 text-forest-600'
                      }`}
                    >
                      {inv.consumed_at
                        ? 'Registered'
                        : new Date(inv.expires_at) < new Date()
                          ? 'Expired'
                          : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Member List */}
          <div className="bg-white rounded-lg border border-cream-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-cream-200 bg-cream-50">
              <h2 className="font-display text-lg font-semibold text-forest">
                Registered Members
              </h2>
            </div>
            {loading ? (
              <div className="px-6 py-8 text-center text-forest-400 animate-pulse">
                Loading...
              </div>
            ) : members.length === 0 ? (
              <div className="px-6 py-8 text-center text-forest-400">
                No members registered yet.
              </div>
            ) : (
              <div className="divide-y divide-cream-100">
                {members.map((m) => (
                  <div
                    key={m.user_id}
                    className="px-6 py-3 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-medium text-forest">
                        {m.email || m.user_id.slice(0, 8)}
                      </div>
                      <div className="text-sm text-forest-400">
                        Joined{' '}
                        {new Date(m.granted_at).toLocaleDateString()}
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full font-semibold bg-cream-100 text-forest-600 capitalize">
                      {m.role}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
