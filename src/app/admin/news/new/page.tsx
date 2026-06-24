'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { createNewsPost } from '@/app/actions/news'

// Dynamic import to avoid SSR issues with Tiptap
const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), {
  ssr: false,
  loading: () => (
    <div className="min-h-[300px] border rounded-lg bg-cream-50 animate-pulse flex items-center justify-center">
      <span className="text-forest-400">Loading editor...</span>
    </div>
  ),
})

export default function NewNewsPostPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [category, setCategory] = useState('Ride Recap')
  const [published, setPublished] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const result = await createNewsPost({ title, body, category, published })

    if (result.error) {
      setError(result.error)
      setSaving(false)
    } else {
      router.push('/admin/news')
    }
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
            New News Post
          </h1>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-500 rounded-lg border border-red-200 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-forest mb-2">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-4 py-2 border border-cream-300 rounded-lg 
                           focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
                placeholder="Post title..."
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-forest mb-2">
                Category
              </label>
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

            {/* Body — Rich Text Editor */}
            <div>
              <label className="block text-sm font-semibold text-forest mb-2">
                Body
              </label>
              <RichTextEditor content={body} onChange={setBody} />
            </div>

            {/* Publish toggle */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="published"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="rounded border-cream-300 text-gold focus:ring-gold"
              />
              <label htmlFor="published" className="text-sm text-forest">
                Publish immediately
              </label>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4">
              <button
                type="submit"
                disabled={saving || !title}
                className="btn-primary disabled:opacity-50"
              >
                {saving ? 'Saving...' : published ? 'Publish' : 'Save Draft'}
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
