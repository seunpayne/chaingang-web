import { redirect } from 'next/navigation'
import { createClient, isAdmin } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AdminDashboardPage() {
  const admin = await isAdmin()

  if (!admin) {
    redirect('/dashboard')
  }

  const supabase = await createClient()

  // Fetch summary counts
  const { count: newsCount } = await supabase
    .from('news_posts')
    .select('*', { count: 'exact', head: true })
    .eq('published', true)

  const { count: announcementCount } = await supabase
    .from('announcements')
    .select('*', { count: 'exact', head: true })
    .eq('active', true)

  const { count: galleryCount } = await supabase
    .from('gallery_photos')
    .select('*', { count: 'exact', head: true })

  // Last sync time
  const { data: lastSync } = await supabase
    .from('sync_log')
    .select('ran_at, status')
    .eq('sync_type', 'strava_leaderboard')
    .order('ran_at', { ascending: false })
    .limit(1)
    .single()

  return (
    <main className="min-h-screen bg-cream">
      <header className="bg-forest text-cream">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="font-display text-xl font-bold text-gold">
            CHAINGANG
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

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="font-display text-4xl font-bold text-forest mb-8">
            Admin Panel
          </h1>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <SummaryCard
              title="News Posts"
              value={newsCount ?? 0}
              href="/admin/news"
              label="Manage News"
            />
            <SummaryCard
              title="Active Announcements"
              value={announcementCount ?? 0}
              href="/admin/announcements"
              label="Manage Announcements"
            />
            <SummaryCard
              title="Gallery Photos"
              value={galleryCount ?? 0}
              href="/admin/gallery"
              label="Manage Gallery"
            />
            <SummaryCard
              title="Last Strava Sync"
              value={lastSync ? new Date(lastSync.ran_at).toLocaleDateString() : 'Never'}
              href="/admin"
              label={lastSync?.status === 'success' ? 'Synced ✓' : lastSync?.status === 'failed' ? 'Failed ✗' : 'N/A'}
            />
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl">
            <QuickLink href="/admin/news" title="News" description="Create and manage news posts" />
            <QuickLink href="/admin/announcements" title="Announcements" description="Post club announcements" />
            <QuickLink href="/admin/gallery" title="Gallery" description="Upload ride photos" />
            <QuickLink href="/admin/members" title="Members" description="Invite and manage members" />
          </div>
        </div>
      </section>
    </main>
  )
}

function SummaryCard({
  title,
  value,
  href,
  label,
}: {
  title: string
  value: string | number
  href: string
  label: string
}) {
  return (
    <Link
      href={href}
      className="bg-white p-6 rounded-lg border border-cream-200 hover:border-gold 
                 hover:shadow-md transition-all duration-200"
    >
      <div className="text-sm text-forest-500 mb-1">{title}</div>
      <div className="font-display text-3xl font-bold text-forest mb-2">{value}</div>
      <div className="text-sm text-gold font-medium">{label} →</div>
    </Link>
  )
}

function QuickLink({
  href,
  title,
  description,
}: {
  href: string
  title: string
  description: string
}) {
  return (
    <Link
      href={href}
      className="bg-white p-5 rounded-lg border border-cream-200 hover:border-gold 
                 hover:shadow-md transition-all duration-200 group"
    >
      <h3 className="font-display text-lg font-bold text-forest group-hover:text-gold transition-colors">
        {title}
      </h3>
      <p className="text-forest-600 text-sm mt-1">{description}</p>
    </Link>
  )
}
