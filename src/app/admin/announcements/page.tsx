import { redirect } from 'next/navigation'
import { createClient, isAdmin } from '@/lib/supabase/server'
import Link from 'next/link'
import { deleteAnnouncement } from '@/app/actions/announcements'

export default async function AdminAnnouncementsPage() {
  if (!(await isAdmin())) {
    redirect('/dashboard')
  }

  const supabase = await createClient()
  const { data: announcements } = await supabase
    .from('announcements')
    .select('id, title, type, active, expires_at, created_at, deleted_at')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

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
          <div className="flex items-center justify-between mb-8">
            <h1 className="font-display text-3xl font-bold text-forest">
              Announcements
            </h1>
            <Link href="/admin/announcements/new" className="btn-primary">
              + New Announcement
            </Link>
          </div>

          <div className="bg-white rounded-lg border border-cream-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-cream-200 bg-cream-50">
              <h2 className="font-display text-lg font-semibold text-forest">
                All Announcements
              </h2>
            </div>
            {!announcements || announcements.length === 0 ? (
              <div className="px-6 py-8 text-center text-forest-400">
                No announcements yet. Create your first one!
              </div>
            ) : (
              <div className="divide-y divide-cream-100">
                {announcements.map((a) => (
                  <div
                    key={a.id}
                    className="px-6 py-4 flex items-center justify-between hover:bg-cream-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-medium text-forest truncate">
                          {a.title}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-semibold ${getTypeClass(a.type)}`}
                        >
                          {a.type}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                            a.active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {a.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="text-sm text-forest-400">
                        Created {new Date(a.created_at).toLocaleDateString()}
                        {a.expires_at &&
                          ` · Expires ${new Date(a.expires_at).toLocaleDateString()}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Link
                        href={`/admin/announcements/${a.id}/edit`}
                        className="text-sm text-forest hover:text-gold transition-colors"
                      >
                        Edit
                      </Link>
                      <form action={deleteAnnouncement}>
                        <input type="hidden" name="id" value={a.id} />
                        <button className="text-sm text-red hover:text-red-600 transition-colors">
                          Delete
                        </button>
                      </form>
                    </div>
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

function getTypeClass(type: string): string {
  switch (type) {
    case 'Urgent':
      return 'bg-red-100 text-red-700'
    case 'Event':
      return 'bg-forest-100 text-forest-700'
    case 'Info':
    default:
      return 'bg-gray-100 text-gray-600'
  }
}
