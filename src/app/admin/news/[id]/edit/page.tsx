'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { updateNewsPost } from '@/app/actions/news'
import { createClient } from '@/lib/supabase/client'

const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), {
  ssr: false,
  loading: () => (
    <div className="min-h-[300px] border rounded-lg bg-cream-50 animate-pulse flex items-center justify-center">
      <span className="text-forest-400">Loading editor...</span>
    </div>
  ),
})

export default function EditNewsPostPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [category, setCategory] = useState('Ride Recap')
  const [published, setPublished] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadPost() {
      const supabase = createClient()
      const { data: post } = await supabase
        .from('news_posts')
        .select('*')
        .eq('id', id)
        .single()

      if (post) {
        setTitle(post.title)
        setBody(post.body)
        setCategory(post.category)
        setPublished(post.published)
      }
      setLoading(false)
    }
    loadPost()
  }, [id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const result = await updateNewsPost(id, { title, body, category, published })

    if (result.error) {
      setError(result.error)
      setSaving(false)
    } else {
      router.push('/admin/news')
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-cream flex items-center justify-center">
        <span className="text-forest-400">Loading...</span>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-cream">
      <header className="bg-forest text-cream">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/admin" className="font-display text-xl font-bold text-gold">
            Admin Panel
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/admin/news" className="text-sm hover:text-gold transition-colors">
              All Posts
            </Link>
          </div>
        </div>
      </header>

      <section className="py-8">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="font-display text-3xl font-bold text-forest mb-8">
            Edit News Post
          </h1>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-500 rounded-lg border border-red-200 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-forest mb-2">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-4 py-2 border border-cream-300 rounded-lg 
                           focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-forest mb-2">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 border border-cream-300 rounded-lg 
                           focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent bg-white"
              >
                <option value="Ride Recap">Ride Recap</option>
                <option value="Trail News">Trail News</option>
                <option value="Community">Community</option>
                <option value="Member Spotlight">Member Spotlight</option>
                <option value="Announcement">Announcement</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-forest mb-2">Body</label>
              <RichTextEditor content={body} onChange={setBody} />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="published"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="rounded border-cream-300 text-gold focus:ring-gold"
              />
              <label htmlFor="published" className="text-sm text-forest">
                Published
              </label>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <button
                type="submit"
                disabled={saving || !title}
                className="btn-primary disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <Link href="/admin/news" className="btn-secondary">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </section>
    </main>
  )
}
