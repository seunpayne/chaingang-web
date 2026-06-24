import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AnnouncementsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/announcements')
  }

  // Check if admin
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  const isAdmin = roleData?.role === 'admin'

  // Fetch active announcements for members (non-expired, non-deleted)
  const { data: announcements } = await supabase
    .from('announcements')
    .select('id, title, body, type, created_at, expires_at')
    .eq('active', true)
    .is('deleted_at', null)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen bg-cream">
      <header className="bg-forest text-cream">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="font-display text-xl font-bold text-gold">
            CHAINGANG
          </Link>
          <div className="flex items-center gap-4">
            {isAdmin && (
              <Link href="/admin" className="text-sm hover:text-gold transition-colors">
                Admin Panel
              </Link>
            )}
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

      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="font-display text-4xl font-bold text-forest mb-8">
            Announcements
          </h1>

          {!announcements || announcements.length === 0 ? (
            <div className="bg-white p-12 rounded-lg border border-cream-200 text-center">
              <p className="text-forest-400 text-lg">No active announcements right now.</p>
              <p className="text-forest-300 text-sm mt-2">
                Check back soon for ride updates, events, and club news.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {announcements.map((a) => (
                <div
                  key={a.id}
                  className="bg-white p-6 rounded-lg border border-cream-200 hover:border-gold transition-colors"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <span className={getTypeBadge(a.type)}>{a.type}</span>
                    <h2 className="font-display text-xl font-bold text-forest flex-1">
                      {a.title}
                    </h2>
                  </div>
                  <p className="text-forest-600 whitespace-pre-wrap">{a.body}</p>
                  <div className="mt-4 text-sm text-forest-400">
                    Posted {new Date(a.created_at).toLocaleDateString('en-NG', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                    {a.expires_at && (
                      <span className="ml-2">
                        · Expires{' '}
                        {new Date(a.expires_at).toLocaleDateString('en-NG')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

function getTypeBadge(type: string): string {
  const base = 'text-xs px-2 py-1 rounded-full font-semibold shrink-0 mt-1 '
  switch (type) {
    case 'Urgent':
      return base + 'bg-red text-white'
    case 'Event':
      return base + 'bg-forest text-cream'
    case 'Info':
    default:
      return base + 'bg-gray-500 text-white'
  }
}
