import { NextResponse } from 'next/server'
import { createServiceClient, isAdmin } from '@/lib/supabase/server'

/**
 * GET /api/invites/list — List all invites (admin only)
 */
export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const supabase = await createServiceClient()
  const { data, error } = await supabase
    .from('member_invites')
    .select('id, email, token, expires_at, consumed_at, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data || [])
}
