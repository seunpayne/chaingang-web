import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

/**
 * POST /api/invites/consume
 * Body: { token: string }
 * Marks an invite as consumed after successful registration.
 * Uses service role to bypass RLS.
 */
export async function POST(request: NextRequest) {
  const { token } = await request.json()

  if (!token) {
    return NextResponse.json({ error: 'Token required' }, { status: 400 })
  }

  const supabase = await createServiceClient()

  // Verify invite exists and isn't consumed
  const { data: invite } = await supabase
    .from('member_invites')
    .select('id, consumed_at, expires_at')
    .eq('token', token)
    .single()

  if (!invite || invite.consumed_at || new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Invalid or expired invite' }, { status: 410 })
  }

  const { error } = await supabase
    .from('member_invites')
    .update({ consumed_at: new Date().toISOString() })
    .eq('id', invite.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
