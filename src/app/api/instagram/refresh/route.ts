import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/instagram/refresh
 *
 * Triggered by Vercel cron job (every 2 months on the 1st at 3:00 AM).
 * Proxies the call to the Supabase Edge Function for Instagram token refresh.
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!supabaseUrl) {
    return NextResponse.json(
      { error: 'Supabase not configured' },
      { status: 500 }
    )
  }

  try {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/instagram-token-refresh`,
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
      {
        error: 'Failed to reach Supabase Edge Function',
        message: String(err),
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Use POST to trigger refresh' },
    { status: 405 }
  )
}
