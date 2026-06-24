import { NextRequest, NextResponse } from 'next/server'

/**
 * Proxy endpoint that triggers the Strava sync Edge Function.
 * Protected by CRON_SECRET — designed to be called by Vercel cron job.
 *
 * POST /api/strava/sync
 * Authorization: Bearer <CRON_SECRET>
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  // Call Supabase Edge Function
  try {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/strava-sync`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cronSecret}`,
          'Content-Type': 'application/json',
        },
      }
    )

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Edge function call failed', detail: data },
        { status: response.status }
      )
    }

    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to reach Supabase Edge Function', message: String(err) },
      { status: 500 }
    )
  }
}

/**
 * GET is not allowed on this endpoint
 */
export async function GET() {
  return NextResponse.json(
    { error: 'Use POST to trigger sync' },
    { status: 405 }
  )
}
