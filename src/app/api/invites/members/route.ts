import { NextResponse } from 'next/server'
import { createServiceClient, isAdmin } from '@/lib/supabase/server'

/**
 * GET /api/invites/members — List all registered members (admin only)
 * Joins user_roles with auth.users to show member emails.
 */
export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const supabase = await createServiceClient()

  // Get all user roles with email from auth.users
  const { data: roles, error } = await supabase
    .from('user_roles')
    .select('user_id, role, granted_at')
    .order('granted_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!roles || roles.length === 0) {
    return NextResponse.json([])
  }

  // Fetch emails from auth.admin (requires service role)
  const { data: users, error: usersError } = await supabase.auth.admin.listUsers()

  if (usersError) {
    // Return roles without emails if auth admin fails
    return NextResponse.json(
      roles.map((r) => ({ ...r, email: null }))
    )
  }

  const members = roles.map((role) => {
    const user = users.users.find((u) => u.id === role.user_id)
    return {
      ...role,
      email: user?.email || null,
    }
  })

  return NextResponse.json(members)
}
