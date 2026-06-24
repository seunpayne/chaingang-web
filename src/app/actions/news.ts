'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServiceClient, isAdmin } from '@/lib/supabase/server'

interface NewsInput {
  title: string
  body: string
  category: string
  cover_image_url?: string
  published?: boolean
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export async function createNewsPost(data: NewsInput) {
  if (!(await isAdmin())) {
    return { error: 'Unauthorized' }
  }

  const supabase = await createServiceClient()
  const slug = generateSlug(data.title)

  const { error } = await supabase.from('news_posts').insert({
    title: data.title,
    slug,
    body: data.body,
    category: data.category,
    cover_image_url: data.cover_image_url || null,
    published: data.published || false,
    published_at: data.published ? new Date().toISOString() : null,
    author_id: (await supabase.auth.getUser()).data.user?.id,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/news')
  return { success: true }
}

export async function updateNewsPost(id: string, data: Partial<NewsInput>) {
  if (!(await isAdmin())) {
    return { error: 'Unauthorized' }
  }

  const supabase = await createServiceClient()
  const updates: Record<string, unknown> = { ...data }

  if (data.title) {
    updates.slug = generateSlug(data.title)
  }

  if (data.published !== undefined) {
    updates.published_at = data.published ? new Date().toISOString() : null
  }

  const { error } = await supabase
    .from('news_posts')
    .update(updates)
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/news')
  revalidatePath(`/news/${updates.slug || ''}`)
  return { success: true }
}

export async function deleteNewsPost(id: string) {
  'use server'
  
  if (!(await isAdmin())) {
    return
  }

  const supabase = await createServiceClient()

  // Soft delete — set deleted_at
  await supabase
    .from('news_posts')
    .update({ deleted_at: new Date().toISOString(), published: false })
    .eq('id', id)

  revalidatePath('/news')
  redirect('/admin/news')
}
