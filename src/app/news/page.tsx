import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import sanitizeHtml from 'sanitize-html'

export const revalidate = 60 // ISR every 60 seconds

export default async function NewsPage() {
  const supabase = await createClient()

  const { data: posts } = await supabase
    .from('news_posts')
    .select('id, title, slug, category, cover_image_url, published_at, body')
    .eq('published', true)
    .is('deleted_at', null)
    .order('published_at', { ascending: false })

  return (
    <main className="min-h-screen bg-cream">
      {/* Header */}
      <header className="bg-forest text-cream">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="font-display text-xl font-bold text-gold">
            CHAINGANG
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm hover:text-gold transition-colors">
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="font-display text-4xl font-bold text-forest text-center mb-12">
            Club News
          </h1>

          {!posts || posts.length === 0 ? (
            <div className="text-center text-forest-500 py-12">
              <p className="text-lg">No news posts yet.</p>
              <p className="text-sm mt-2">Check back soon for club updates, ride reports, and more.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/news/${post.slug}`}
                  className="bg-white rounded-lg border border-cream-200 overflow-hidden 
                             hover:shadow-lg hover:border-gold transition-all duration-200 group"
                >
                  {post.cover_image_url && (
                    <div className="aspect-video bg-cream-100 overflow-hidden">
                      <img
                        src={post.cover_image_url}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-semibold text-gold bg-gold-50 px-2 py-0.5 rounded">
                        {post.category}
                      </span>
                      {post.published_at && (
                        <span className="text-xs text-forest-400">
                          {new Date(post.published_at).toLocaleDateString('en-NG', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                      )}
                    </div>
                    <h2 className="font-display text-xl font-bold text-forest group-hover:text-gold transition-colors mb-2">
                      {post.title}
                    </h2>
                    <p className="text-forest-600 text-sm line-clamp-3">
                      {stripHtml(post.body).slice(0, 150)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

function stripHtml(html: string): string {
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
}
