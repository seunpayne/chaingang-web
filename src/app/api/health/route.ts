import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/health
 *
 * Public health check endpoint. Returns DB connectivity status,
 * last Strava sync time, estimated storage usage, and
 * Instagram token expiry.
 *
 * Used by Vercel monitoring, uptime checks, and admin dashboards.
 */
export async function GET() {
  const health: {
    status: 'ok' | 'degraded'
    timestamp: string
    db: 'connected' | 'error'
    strava_last_sync: string | null
    strava_sync_status: string | null
    storage_estimated_mb: number | null
    instagram_token_expires_at: string | null
    instagram_token_status: string | null
    errors: string[]
  } = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    db: 'connected',
    strava_last_sync: null,
    strava_sync_status: null,
    storage_estimated_mb: null,
    instagram_token_expires_at: null,
    instagram_token_status: null,
    errors: [],
  }

  try {
    const supabase = await createClient()

    // Check DB connectivity
    const { error: dbError } = await supabase
      .from('sync_log')
      .select('id')
      .limit(1)

    if (dbError) {
      health.db = 'error'
      health.status = 'degraded'
      health.errors.push(`DB error: ${dbError.message}`)
    }

    // Last Strava sync
    const { data: lastSync } = await supabase
      .from('sync_log')
      .select('ran_at, status')
      .eq('sync_type', 'strava_leaderboard')
      .order('ran_at', { ascending: false })
      .limit(1)
      .single()

    if (lastSync) {
      health.strava_last_sync = lastSync.ran_at
      health.strava_sync_status = lastSync.status
    }

    // Storage estimate — count gallery files
    const { count: galleryCount } = await supabase
      .from('gallery_photos')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null)

    if (galleryCount !== null) {
      // Rough estimate: ~500KB per compressed image
      health.storage_estimated_mb = Math.round((galleryCount * 0.5) * 10) / 10
    }

    // Instagram token status
    const { data: igToken } = await supabase
      .from('instagram_tokens')
      .select('expires_at, refresh_status')
      .limit(1)
      .single()

    if (igToken) {
      health.instagram_token_expires_at = igToken.expires_at
      health.instagram_token_status = igToken.refresh_status
    }

    // If Strava sync hasn't run in 7 days, mark degraded
    if (lastSync) {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      if (new Date(lastSync.ran_at) < sevenDaysAgo) {
        health.status = 'degraded'
        health.errors.push('Strava sync has not run in over 7 days')
      }
    }
  } catch (err) {
    health.status = 'degraded'
    health.db = 'error'
    health.errors.push(
      err instanceof Error ? err.message : 'Unknown health check error'
    )
  }

  const statusCode = health.status === 'ok' ? 200 : 503
  return NextResponse.json(health, { status: statusCode })
}
