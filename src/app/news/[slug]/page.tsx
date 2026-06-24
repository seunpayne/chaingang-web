import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import sanitizeHtml from 'sanitize-html'

export const revalidate = 60

export default async function NewsPostPage({
  params,
}: {
  params: { slug: string }
}) {
  const supabase = await createClient()

  const { data: post } = await supabase
    .from('news_posts')
    .select('*')
    .eq('slug', params.slug)
    .is('deleted_at', null)
    .single()

  if (!post || (!post.published)) {
    notFound()
  }

  // XSS sanitization on Tiptap HTML output
  const sanitizedBody = sanitizeHtml(post.body, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'div',
    ]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ['src', 'alt', 'width', 'height', 'class'],
      a: ['href', 'target', 'rel', 'class'],
      span: ['class', 'style'],
      div: ['class'],
    },
  })

  return (
    <main className="min-h-screen bg-cream">
      {/* Header */}
      <header className="bg-forest text-cream">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="font-display text-xl font-bold text-gold">
            CHAINGANG
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/news" className="text-sm hover:text-gold transition-colors">
              All News
            </Link>
            <Link href="/dashboard" className="text-sm hover:text-gold transition-colors">
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <article className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          {/* Category + Date */}
          <div className="flex items-center gap-3 mb-6">
            <span className="text-sm font-semibold text-gold bg-gold-50 px-3 py-1 rounded">
              {post.category}
            </span>
            {post.published_at && (
              <span className="text-sm text-forest-400">
                {new Date(post.published_at).toLocaleDateString('en-NG', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="font-display text-4xl md:text-5xl font-bold text-forest mb-8">
            {post.title}
          </h1>

          {/* Cover Image */}
          {post.cover_image_url && (
            <div className="aspect-video bg-cream-100 rounded-lg overflow-hidden mb-10">
              <img
                src={post.cover_image_url}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Body — sanitized HTML */}
          <div
            className="rich-text-content max-w-none"
            dangerouslySetInnerHTML={{ __html: sanitizedBody }}
          />
        </div>
      </article>
    </main>
  )
}
