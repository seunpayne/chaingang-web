import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

type TabKey = 'km' | 'elevation' | 'rides' | 'koms'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'km', label: 'Kilometres' },
  { key: 'elevation', label: 'Elevation' },
  { key: 'rides', label: 'Rides' },
  { key: 'koms', label: 'KOMs/QOMs' },
]

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: { tab?: string }
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/leaderboard')
  }

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  const isAdmin = roleData?.role === 'admin'

  // Current month YYYY-MM-01
  const periodMonth = new Date().toISOString().slice(0, 7) + '-01'

  const activeTab: TabKey = (searchParams.tab as TabKey) || 'km'

  const orderColumn = {
    km: 'total_km',
    elevation: 'total_elevation_m',
    rides: 'rides_attended',
    koms: 'kom_qom_count',
  }[activeTab]

  const { data: entries } = await supabase
    .from('leaderboard_cache')
    .select(
      'id, strava_athlete_id, display_name, strava_handle, avatar_url, total_km, total_elevation_m, rides_attended, kom_qom_count, synced_at'
    )
    .eq('period_month', periodMonth)
    .order(orderColumn, { ascending: false })

  // Get last sync time
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
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="font-display text-4xl font-bold text-forest mb-1">
                Leaderboard
              </h1>
              <p className="text-forest-400 text-sm">
                {new Date(periodMonth).toLocaleDateString('en-NG', {
                  year: 'numeric',
                  month: 'long',
                })}
              </p>
            </div>
            {lastSync && (
              <div className="text-sm text-forest-400">
                Last synced:{' '}
                {new Date(lastSync.ran_at).toLocaleDateString('en-NG', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                <span
                  className={`ml-2 inline-block w-2 h-2 rounded-full ${
                    lastSync.status === 'success' ? 'bg-green-500' : 'bg-red-500'
                  }`}
                />
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-8 border-b border-cream-200">
            {TABS.map((tab) => (
              <a
                key={tab.key}
                href={`/leaderboard?tab=${tab.key}`}
                className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-gold text-gold'
                    : 'border-transparent text-forest-400 hover:text-forest'
                }`}
              >
                {tab.label}
              </a>
            ))}
          </div>

          {/* Leaderboard Table */}
          {!entries || entries.length === 0 ? (
            <div className="bg-white p-12 rounded-lg border border-cream-200 text-center">
              <p className="text-forest-400 text-lg">
                No leaderboard data yet.
              </p>
              <p className="text-forest-300 text-sm mt-2">
                The leaderboard auto-syncs every Monday at 2:00 AM WAT.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-cream-200 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-forest-50 border-b border-cream-200">
                    <th className="text-left px-6 py-3 text-sm font-semibold text-forest-400 w-16">
                      #
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-forest-400">
                      Rider
                    </th>
                    <th className="text-right px-6 py-3 text-sm font-semibold text-forest-400">
                      {activeTab === 'km'
                        ? 'KM'
                        : activeTab === 'elevation'
                          ? 'Elev (m)'
                          : activeTab === 'rides'
                            ? 'Rides'
                            : 'KOMs'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-100">
                  {entries.map((entry, idx) => (
                    <tr
                      key={entry.id}
                      className={`hover:bg-cream-50 transition-colors ${
                        idx === 0 ? 'bg-gold-50' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <span
                          className={`font-display text-lg font-bold ${
                            idx < 3 ? 'text-gold' : 'text-forest-300'
                          }`}
                        >
                          {idx + 1}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {entry.avatar_url ? (
                            <img
                              src={entry.avatar_url}
                              alt=""
                              className="w-8 h-8 rounded-full"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-forest text-cream flex items-center justify-center text-xs font-bold">
                              {entry.display_name
                                .split(' ')
                                .map((n: string) => n[0])
                                .join('')
                                .slice(0, 2)
                                .toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-forest">
                              {entry.display_name}
                            </div>
                            {entry.strava_handle && (
                              <div className="text-xs text-forest-400">
                                @{entry.strava_handle}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-semibold text-forest">
                        {activeTab === 'km'
                          ? entry.total_km.toLocaleString()
                          : activeTab === 'elevation'
                            ? entry.total_elevation_m.toLocaleString()
                            : activeTab === 'rides'
                              ? entry.rides_attended
                              : entry.kom_qom_count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Disclaimer */}
          <div className="mt-8 p-4 bg-cream-50 border border-cream-200 rounded-lg">
            <p className="text-sm text-forest-400 leading-relaxed">
              <strong className="text-forest">⚠️ Disclaimer:</strong> The Strava
              Club Activities API is capped at the most recent 200 activities per
              request. This leaderboard reflects the data available within that
              rolling window and may not represent the complete monthly activity
              history for all members. Leaderboard data is cached and synced
              weekly (Mondays at 2:00 AM WAT).
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
