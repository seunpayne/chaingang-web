'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import imageCompression from 'browser-image-compression'
import { uploadGalleryPhoto } from '@/app/actions/gallery'

export default function AdminGalleryPage() {
  const [caption, setCaption] = useState('')
  const [rideTag, setRideTag] = useState('')
  const [photoDate, setPhotoDate] = useState('')
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    const file = fileRef.current?.files?.[0]
    if (!file) {
      setStatus({ type: 'error', message: 'Please select an image file' })
      return
    }

    setUploading(true)
    setStatus(null)

    try {
      // Client-side compression to 1200px max dimension
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
      })

      const formData = new FormData()
      formData.append('file', compressedFile, file.name)
      formData.append('caption', caption)
      formData.append('ride_tag', rideTag)
      formData.append('photo_date', photoDate || '')

      const result = await uploadGalleryPhoto(formData)

      if (result.error) {
        setStatus({ type: 'error', message: result.error })
      } else {
        setStatus({ type: 'success', message: 'Photo uploaded successfully!' })
        setCaption('')
        setRideTag('')
        setPhotoDate('')
        setPreview(null)
        if (fileRef.current) fileRef.current.value = ''
      }
    } catch (err) {
      setStatus({
        type: 'error',
        message: err instanceof Error ? err.message : 'Upload failed',
      })
    } finally {
      setUploading(false)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (ev) => setPreview(ev.target?.result as string)
      reader.readAsDataURL(file)
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
            <Link href="/gallery" className="text-sm hover:text-gold transition-colors">
              View Gallery
            </Link>
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
        <div className="max-w-2xl mx-auto px-4">
          <h1 className="font-display text-3xl font-bold text-forest mb-8">
            Upload Photos
          </h1>

          {status && (
            <div
              className={`mb-6 p-4 rounded-lg border text-sm ${
                status.type === 'success'
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-red-50 text-red-500 border-red-200'
              }`}
            >
              {status.message}
            </div>
          )}

          <form onSubmit={handleUpload} className="space-y-6 bg-white p-6 rounded-lg border border-cream-200">
            {/* File input */}
            <div>
              <label className="block text-sm font-semibold text-forest mb-2">
                Photo <span className="text-red font-normal">*</span>
              </label>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                required
                className="w-full text-sm text-forest-600 file:mr-4 file:py-2 file:px-4
                           file:rounded file:border-0 file:text-sm file:font-semibold
                           file:bg-forest file:text-cream hover:file:bg-forest-600
                           file:transition-colors cursor-pointer"
              />
              <p className="text-xs text-forest-400 mt-1">
                Images are automatically compressed to 1200px max dimension.
              </p>
            </div>

            {/* Preview */}
            {preview && (
              <div className="border border-cream-200 rounded-lg overflow-hidden">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full max-h-64 object-contain bg-cream-50"
                />
              </div>
            )}

            {/* Caption */}
            <div>
              <label className="block text-sm font-semibold text-forest mb-2">
                Caption
              </label>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full px-4 py-2 border border-cream-300 rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
                placeholder="Describe this photo..."
              />
            </div>

            {/* Ride Tag */}
            <div>
              <label className="block text-sm font-semibold text-forest mb-2">
                Ride Tag (Optional)
              </label>
              <input
                type="text"
                value={rideTag}
                onChange={(e) => setRideTag(e.target.value)}
                className="w-full px-4 py-2 border border-cream-300 rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
                placeholder="e.g. Saturday Group Ride, MTB Clinic"
              />
            </div>

            {/* Photo Date */}
            <div>
              <label className="block text-sm font-semibold text-forest mb-2">
                Photo Date (Optional)
              </label>
              <input
                type="date"
                value={photoDate}
                onChange={(e) => setPhotoDate(e.target.value)}
                className="w-full px-4 py-2 border border-cream-300 rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={uploading}
              className="btn-primary w-full disabled:opacity-50"
            >
              {uploading ? 'Uploading & Compressing...' : 'Upload Photo'}
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}
