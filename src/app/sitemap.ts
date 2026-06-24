import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://chaingang.ng'

  // Base static routes
  const routes: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
  ]

  // Dynamic: news posts
  try {
    const supabase = await createClient()
    const { data: posts } = await supabase
      .from('news_posts')
      .select('slug, published_at')
      .eq('published', true)
      .is('deleted_at', null)

    if (posts) {
      for (const post of posts) {
        routes.push({
          url: `${siteUrl}/news/${post.slug}`,
          lastModified: post.published_at
            ? new Date(post.published_at)
            : new Date(),
          changeFrequency: 'monthly',
          priority: 0.7,
        })
      }
    }
  } catch {
    // Supabase unavailable — return static routes only
  }

  // News index page
  routes.push({
    url: `${siteUrl}/news`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.8,
  })

  return routes
}
