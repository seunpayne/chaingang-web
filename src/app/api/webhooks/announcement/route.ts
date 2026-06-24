import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/webhooks/announcement
 *
 * Triggered by Supabase Database Webhook on INSERT into announcements
 * where type = 'Urgent'. Sends WhatsApp message to club group chat via Twilio.
 *
 * Supabase webhook payload:
 * {
 *   type: "INSERT",
 *   table: "announcements",
 *   record: { id, title, body, type, ... }
 * }
 *
 * Protected by CRON_SECRET to prevent unauthorized calls.
 */
export async function POST(request: NextRequest) {
  // --- Auth: CRON_SECRET or Supabase webhook signature ---
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  // Supabase sends { type, table, record }
  const record = body.record
  if (!record || record.type !== 'Urgent') {
    return NextResponse.json({ skipped: true, reason: 'Not an Urgent announcement' })
  }

  const twilioSid = process.env.TWILIO_ACCOUNT_SID
  const twilioAuth = process.env.TWILIO_AUTH_TOKEN
  const twilioFrom = process.env.TWILIO_WHATSAPP_FROM
  const whatsappGroup = process.env.CHAINGANG_WHATSAPP_GROUP

  if (!twilioSid || !twilioAuth || !twilioFrom || !whatsappGroup) {
    console.log('[WhatsApp Webhook] Twilio not configured — skipping push')
    return NextResponse.json({
      skipped: true,
      reason: 'Twilio not configured',
    })
  }

  const message = `⚠️ *URGENT — Chaingang CC Abuja*\n\n*${record.title}*\n\n${record.body}\n\n_— Sent via chaingang.ng_`

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${twilioSid}:${twilioAuth}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: twilioFrom,
          To: whatsappGroup,
          Body: message,
        }),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      console.error('[Twilio Error]', data)
      return NextResponse.json(
        { error: 'Twilio send failed', detail: data },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, twilio_sid: data.sid })
  } catch (err) {
    console.error('[Twilio Exception]', err)
    return NextResponse.json(
      { error: 'Failed to send WhatsApp message' },
      { status: 500 }
    )
  }
}

/**
 * GET not allowed
 */
export async function GET() {
  return NextResponse.json(
    { error: 'Use POST with Supabase DB webhook payload' },
    { status: 405 }
  )
}
