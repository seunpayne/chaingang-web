import { redirect } from 'next/navigation'
import { createClient, isAdmin } from '@/lib/supabase/server'
import Link from 'next/link'

async function handleDelete(formData: FormData) {
  'use server'
  const id = formData.get('id') as string
  if (!(await isAdmin())) return
  const supabase = await createClient()
  await supabase
    .from('news_posts')
    .update({ deleted_at: new Date().toISOString(), published: false })
    .eq('id', id)
  redirect('/admin/news')
}

export default async function AdminNewsPage() {
  if (!(await isAdmin())) {
    redirect('/dashboard')
  }

  const supabase = await createClient()
  const { data: posts } = await supabase
    .from('news_posts')
    .select('id, title, slug, category, published, published_at, created_at, deleted_at')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  // Recoverable posts (soft deleted, within 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const { data: deletedPosts } = await supabase
    .from('news_posts')
    .select('id, title, slug, deleted_at')
    .not('deleted_at', 'is', null)
    .gte('deleted_at', thirtyDaysAgo.toISOString())
    .order('deleted_at', { ascending: false })

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
              News Posts
            </h1>
            <Link href="/admin/news/new" className="btn-primary">
              + New Post
            </Link>
          </div>

          {/* Active Posts */}
          <div className="bg-white rounded-lg border border-cream-200 overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-cream-200 bg-cream-50">
              <h2 className="font-display text-lg font-semibold text-forest">
                Published & Drafts
              </h2>
            </div>
            {!posts || posts.length === 0 ? (
              <div className="px-6 py-8 text-center text-forest-400">
                No posts yet. Create your first one!
              </div>
            ) : (
              <div className="divide-y divide-cream-100">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className="px-6 py-4 flex items-center justify-between hover:bg-cream-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-medium text-forest truncate">
                          {post.title}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                            post.published
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {post.published ? 'Published' : 'Draft'}
                        </span>
                      </div>
                      <div className="text-sm text-forest-400">
                        {post.category} &middot;{' '}
                        {new Date(post.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Link
                        href={`/admin/news/${post.id}/edit`}
                        className="text-sm text-forest hover:text-gold transition-colors"
                      >
                        Edit
                      </Link>
                      <Link
                        href={`/news/${post.slug}`}
                        target="_blank"
                        className="text-sm text-forest-400 hover:text-forest transition-colors"
                      >
                        View
                      </Link>
                      <form action={handleDelete}>
                        <input type="hidden" name="id" value={post.id} />
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

          {/* Recovery Window — Soft-deleted posts */}
          {deletedPosts && deletedPosts.length > 0 && (
            <div className="bg-red-50 rounded-lg border border-red-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-red-200 bg-red-50">
                <h2 className="font-display text-lg font-semibold text-red">
                  Recovery Bin (30-day window)
                </h2>
              </div>
              <div className="divide-y divide-red-100">
                {deletedPosts.map((post) => (
                  <div
                    key={post.id}
                    className="px-6 py-4 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-medium text-forest-600">{post.title}</span>
                      <span className="text-sm text-red-400 ml-3">
                        Deleted:{' '}
                        {post.deleted_at
                          ? new Date(post.deleted_at).toLocaleDateString()
                          : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
