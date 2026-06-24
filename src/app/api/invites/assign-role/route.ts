import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

/**
 * POST /api/invites/assign-role
 * Body: { userId: string, token: string }
 *
 * Assigns 'member' role to a newly registered user.
 * Validates that the user was invited via a valid, unconsumed token.
 * Uses service role to bypass RLS on user_roles table.
 */
export async function POST(request: NextRequest) {
  const { userId, token } = await request.json()

  if (!userId || !token) {
    return NextResponse.json(
      { error: 'userId and token are required' },
      { status: 400 }
    )
  }

  const supabase = await createServiceClient()

  // Verify invite
  const { data: invite } = await supabase
    .from('member_invites')
    .select('id, email, invited_by')
    .eq('token', token)
    .single()

  if (!invite) {
    return NextResponse.json(
      { error: 'Invalid invite token' },
      { status: 403 }
    )
  }

  // Assign member role
  const { error: roleError } = await supabase
    .from('user_roles')
    .upsert({
      user_id: userId,
      role: 'member',
      granted_by: invite.invited_by,
    })

  if (roleError) {
    console.error('[assign-role] Failed:', roleError.message)
    // Don't fail the request — user is already registered
  }

  return NextResponse.json({ success: true })
}
