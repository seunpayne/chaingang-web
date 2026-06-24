import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/dashboard')
  }

  // Check if admin
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  const isAdmin = roleData?.role === 'admin'

  return (
    <main className="min-h-screen bg-cream">
      {/* Header */}
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
            <form action="/auth/signout" method="post">
              <button className="text-sm text-cream-200 hover:text-gold transition-colors">
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Welcome */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="font-display text-4xl font-bold text-forest mb-2">
              Welcome, {user.email?.split('@')[0]}
            </h1>
            <p className="text-forest-600">
              {isAdmin ? 'Admin Dashboard' : 'Member Dashboard'}
            </p>
          </div>

          {/* Navigation Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <NavCard
              title="News"
              description="Latest club updates and ride reports"
              href="/news"
            />
            <NavCard
              title="Leaderboard"
              description="Strava stats and club rankings"
              href="/leaderboard"
            />
            <NavCard
              title="Gallery"
              description="Ride photos and Instagram feed"
              href="/gallery"
            />
            <NavCard
              title="Announcements"
              description="Events, urgent updates, and club info"
              href="/announcements"
            />
          </div>
        </div>
      </section>
    </main>
  )
}

function NavCard({
  title,
  description,
  href,
}: {
  title: string
  description: string
  href: string
}) {
  return (
    <Link
      href={href}
      className="bg-white p-6 rounded-lg border border-cream-200 hover:border-gold 
                 hover:shadow-md transition-all duration-200 group"
    >
      <h3 className="font-display text-xl font-bold text-forest group-hover:text-gold transition-colors">
        {title}
      </h3>
      <p className="text-forest-600 text-sm mt-2">{description}</p>
    </Link>
  )
}
