'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient, isAdmin } from '@/lib/supabase/server'

export async function uploadGalleryPhoto(formData: FormData) {
  if (!(await isAdmin())) {
    return { error: 'Unauthorized' }
  }

  const file = formData.get('file') as File
  const caption = (formData.get('caption') as string) || ''
  const rideTag = (formData.get('ride_tag') as string) || ''
  const photoDate = (formData.get('photo_date') as string) || null

  if (!file) {
    return { error: 'No file provided' }
  }

  if (!file.type.startsWith('image/')) {
    return { error: 'File must be an image' }
  }

  const supabase = await createServiceClient()

  // Generate unique storage path
  const ext = file.name.split('.').pop() || 'jpg'
  const timestamp = Date.now()
  const randomStr = Math.random().toString(36).slice(2, 8)
  const storagePath = `${timestamp}-${randomStr}.${ext}`

  // Upload to Supabase Storage
  const arrayBuffer = await file.arrayBuffer()
  const buffer = new Uint8Array(arrayBuffer)

  const { error: uploadError } = await supabase.storage
    .from('gallery')
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    return { error: uploadError.message }
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from('gallery').getPublicUrl(storagePath)

  // Insert into gallery_photos table
  const { error: insertError } = await supabase.from('gallery_photos').insert({
    storage_path: storagePath,
    public_url: publicUrl,
    caption,
    ride_tag: rideTag || null,
    photo_date: photoDate || null,
    uploaded_by: (await supabase.auth.getUser()).data.user?.id,
  })

  if (insertError) {
    // Clean up uploaded file on DB insert failure
    await supabase.storage.from('gallery').remove([storagePath])
    return { error: insertError.message }
  }

  revalidatePath('/gallery')
  return { success: true, public_url: publicUrl }
}

export async function deleteGalleryPhoto(id: string) {
  'use server'

  if (!(await isAdmin())) {
    return { error: 'Unauthorized' }
  }

  const supabase = await createServiceClient()

  // Get storage path first
  const { data: photo } = await supabase
    .from('gallery_photos')
    .select('storage_path')
    .eq('id', id)
    .single()

  // Soft delete in DB
  await supabase
    .from('gallery_photos')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  // Remove from storage
  if (photo?.storage_path) {
    await supabase.storage.from('gallery').remove([photo.storage_path])
  }

  revalidatePath('/gallery')
  return { success: true }
}
