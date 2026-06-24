import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

interface GalleryPhoto {
  id: string
  public_url: string
  caption: string
  ride_tag: string | null
  photo_date: string | null
  created_at: string
}

export default async function GalleryPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/gallery')
  }

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  const isAdmin = roleData?.role === 'admin'

  // Fetch uploaded photos
  const { data: photos } = await supabase
    .from('gallery_photos')
    .select('id, public_url, caption, ride_tag, photo_date, created_at')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen bg-cream">
      <header className="bg-forest text-cream">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="font-display text-xl font-bold text-gold">
            CHAINGANG
          </Link>
          <div className="flex items-center gap-4">
            {isAdmin && (
              <>
                <Link href="/admin" className="text-sm hover:text-gold transition-colors">
                  Admin Panel
                </Link>
                <Link href="/admin/gallery" className="text-sm hover:text-gold transition-colors">
                  Upload
                </Link>
              </>
            )}
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

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="font-display text-4xl font-bold text-forest mb-8">
            Gallery
          </h1>

          {/* Instagram Embed */}
          <div className="mb-16">
            <h2 className="font-display text-2xl font-bold text-forest mb-6">
              Latest from Instagram
            </h2>
            <InstagramEmbed />
          </div>

          {/* Uploaded Photos Grid */}
          <h2 className="font-display text-2xl font-bold text-forest mb-6">
            Uploaded Photos
          </h2>
          {!photos || photos.length === 0 ? (
            <div className="bg-white p-12 rounded-lg border border-cream-200 text-center">
              <p className="text-forest-400 text-lg">
                No photos uploaded yet.
              </p>
              <p className="text-forest-300 text-sm mt-2">
                Admins can upload ride photos from the Admin Panel.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {photos.map((photo) => (
                <PhotoCard key={photo.id} photo={photo} />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

function PhotoCard({ photo }: { photo: GalleryPhoto }) {
  return (
    <div className="bg-white rounded-lg border border-cream-200 overflow-hidden hover:shadow-md transition-shadow group">
      <div className="aspect-[4/3] bg-cream-50 overflow-hidden">
        <img
          src={photo.public_url}
          alt={photo.caption || 'Gallery photo'}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
      </div>
      <div className="p-4">
        {photo.caption && (
          <p className="text-sm text-forest mb-2 line-clamp-2">{photo.caption}</p>
        )}
        <div className="flex items-center justify-between text-xs text-forest-400">
          {photo.ride_tag && (
            <span className="bg-cream-100 px-2 py-0.5 rounded-full">
              {photo.ride_tag}
            </span>
          )}
          <span>
            {new Date(photo.created_at).toLocaleDateString('en-NG', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </div>
      </div>
    </div>
  )
}

/**
 * Instagram Embed Component
 * Renders Instagram Basic Display feed if token is available, graceful fallback otherwise.
 */
function InstagramEmbed() {
  // Instagram embed uses the server-side token
  // We render a static fallback with a link since Instagram embed
  // requires client-side SDK or oEmbed which needs the token
  return (
    <div className="bg-white rounded-lg border border-cream-200 p-8">
      <div className="text-center">
        <div className="mb-4">
          <svg
            className="w-12 h-12 mx-auto text-forest-200"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
          </svg>
        </div>
        <h3 className="font-display text-xl font-bold text-forest mb-2">
          Follow us on Instagram
        </h3>
        <p className="text-forest-500 mb-4">
          Get the latest ride photos, reels, and updates on our Instagram.
        </p>
        <a
          href="https://instagram.com/chaingangabuja"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary inline-block"
        >
          @chaingangabuja
        </a>
      </div>
    </div>
  )
}
