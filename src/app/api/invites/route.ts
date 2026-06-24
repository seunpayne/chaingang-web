import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, isAdmin } from '@/lib/supabase/server'

/**
 * POST /api/invites — Generate a new member invite (admin only)
 *
 * Body: { email: string }
 * Returns: { success: true, token: string, inviteUrl: string }
 *
 * After creation, the caller should send the invite link via Resend.
 * This endpoint only creates the DB record.
 */
export async function POST(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { email } = await request.json()

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return NextResponse.json(
      { error: 'Valid email is required' },
      { status: 400 }
    )
  }

  const supabase = await createServiceClient()

  // Check if an unconsumed invite already exists for this email
  const { data: existing } = await supabase
    .from('member_invites')
    .select('id, consumed_at, expires_at')
    .eq('email', email)
    .is('consumed_at', null)
    .maybeSingle()

  if (existing && existing.expires_at && new Date(existing.expires_at) > new Date()) {
    return NextResponse.json(
      {
        error: 'An active invite already exists for this email.',
        existing_token: true,
      },
      { status: 409 }
    )
  }

  // Generate secure token
  const token = crypto.randomUUID()

  // Invite expires in 7 days
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  const { error: insertError } = await supabase.from('member_invites').insert({
    email,
    token,
    invited_by: (await supabase.auth.getUser()).data.user?.id,
    expires_at: expiresAt.toISOString(),
  })

  if (insertError) {
    return NextResponse.json(
      { error: insertError.message },
      { status: 500 }
    )
  }

  // Send invite email via Resend (if configured)
  const resendApiKey = process.env.RESEND_API_KEY
  if (resendApiKey) {
    try {
      const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/register?token=${token}`

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Chaingang Cycling Club <noreply@chaingang.ng>',
          to: email,
          subject: 'You\'re invited to join Chaingang Cycling Club Abuja!',
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 24px;">
              <h2 style="color: #1B3A1F;">Welcome to Chaingang Cycling Club! 🚴</h2>
              <p>You've been invited to join the Chaingang Cycling Club Abuja member platform.</p>
              <p>Click the button below to complete your registration:</p>
              <a href="${inviteUrl}" 
                 style="display: inline-block; background: #D4B800; color: #1B3A1F; 
                        padding: 12px 24px; border-radius: 6px; text-decoration: none; 
                        font-weight: bold; margin: 16px 0;">
                Complete Registration
              </a>
              <p style="color: #666; font-size: 14px;">
                This invite link expires in 7 days.<br/>
                If you didn't expect this invitation, you can safely ignore this email.
              </p>
              <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;"/>
              <p style="color: #999; font-size: 12px;">
                Chaingang Cycling Club Abuja · Chains, Pedals & Lungs · Est. 2016
              </p>
            </div>
          `,
        }),
      })
    } catch (err) {
      console.error('[Resend invite] Failed:', err)
      // Don't fail the API — invite is still created
    }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  return NextResponse.json({
    success: true,
    token,
    inviteUrl: `${siteUrl}/register?token=${token}`,
  })
}

/**
 * GET /api/invites?token=xxx — Validate an invite token
 * Used by the registration page to check if a token is valid
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const token = url.searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 })
  }

  const supabase = await createServiceClient()
  const { data, error } = await supabase
    .from('member_invites')
    .select('id, email, expires_at, consumed_at')
    .eq('token', token)
    .single()

  if (error || !data) {
    return NextResponse.json(
      { valid: false, error: 'Invalid or expired invite token.' },
      { status: 404 }
    )
  }

  if (data.consumed_at) {
    return NextResponse.json(
      { valid: false, error: 'This invite has already been used.' },
      { status: 410 }
    )
  }

  if (new Date(data.expires_at) < new Date()) {
    return NextResponse.json(
      { valid: false, error: 'This invite has expired.' },
      { status: 410 }
    )
  }

  return NextResponse.json({ valid: true, email: data.email })
}
