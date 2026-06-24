'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServiceClient, createClient, isAdmin } from '@/lib/supabase/server'

export interface AnnouncementInput {
  title: string
  body: string
  type: 'Event' | 'Urgent' | 'Info'
  active?: boolean
  expires_at?: string | null
}

export async function createAnnouncement(data: AnnouncementInput) {
  if (!(await isAdmin())) {
    return { error: 'Unauthorized' }
  }

  const supabase = await createServiceClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { error } = await supabase.from('announcements').insert({
    title: data.title,
    body: data.body,
    type: data.type,
    active: data.active ?? true,
    expires_at: data.expires_at || null,
    author_id: user?.id,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/announcements')
  return { success: true }
}

export async function updateAnnouncement(id: string, data: Partial<AnnouncementInput>) {
  if (!(await isAdmin())) {
    return { error: 'Unauthorized' }
  }

  const supabase = await createServiceClient()
  const updates: Record<string, unknown> = { ...data }

  const { error } = await supabase
    .from('announcements')
    .update(updates)
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/announcements')
  return { success: true }
}

export async function deleteAnnouncement(id: string) {
  'use server'

  if (!(await isAdmin())) {
    return
  }

  const supabase = await createServiceClient()
  await supabase
    .from('announcements')
    .update({ deleted_at: new Date().toISOString(), active: false })
    .eq('id', id)

  revalidatePath('/announcements')
  redirect('/admin/announcements')
}

/**
 * Fetch active announcements for the ticker (public-facing).
 * Returns only active, non-deleted, non-expired announcements.
 */
export async function getActiveAnnouncements() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('announcements')
    .select('id, title, type')
    .eq('active', true)
    .is('deleted_at', null)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order('created_at', { ascending: false })
    .limit(5)

  return data ?? []
}
