'use server'

import { headers } from 'next/headers'

// Simple in-memory rate limiter (resets on deploy — acceptable for MVP)
// Structure: { ip: { count: number, resetAt: number } }
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

const RATE_LIMIT = 3 // max requests per IP
const RATE_WINDOW_MS = 60 * 60 * 1000 // 1 hour

function getRateLimitInfo(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 0, resetAt: now + RATE_WINDOW_MS })
    return { allowed: true, remaining: RATE_LIMIT }
  }

  if (entry.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0 }
  }

  entry.count++
  return { allowed: true, remaining: RATE_LIMIT - entry.count }
}

export interface ContactInput {
  name: string
  email: string
  message: string
  ndprConsent: boolean
}

export async function submitContactForm(data: ContactInput) {
  // Validate NDPR consent
  if (!data.ndprConsent) {
    return { error: 'You must consent to the NDPR data processing policy.' }
  }

  // Validate required fields
  if (!data.name || !data.email || !data.message) {
    return { error: 'All fields are required.' }
  }

  if (data.name.length > 100) {
    return { error: 'Name must be under 100 characters.' }
  }

  if (data.email.length > 255) {
    return { error: 'Email must be under 255 characters.' }
  }

  if (data.message.length > 2000) {
    return { error: 'Message must be under 2,000 characters.' }
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(data.email)) {
    return { error: 'Please enter a valid email address.' }
  }

  // Rate limiting by IP
  const headersList = await headers()
  const forwardedFor = headersList.get('x-forwarded-for')
  const ip = forwardedFor?.split(',')[0]?.trim() || 'unknown'

  const { allowed } = getRateLimitInfo(ip)
  if (!allowed) {
    return {
      error:
        'Too many messages from this IP. Please try again later (limit: 3/hour).',
    }
  }

  // Attempt to send via Resend
  const resendApiKey = process.env.RESEND_API_KEY

  if (!resendApiKey) {
    // No Resend configured — log to console for dev
    console.log('[Contact Form]', {
      to: 'info@chaingang.ng',
      from: data.email,
      name: data.name,
      message: data.message,
    })
    return { success: true, note: 'Resend not configured — message logged locally.' }
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Chaingang Website <noreply@chaingang.ng>',
        to: 'info@chaingang.ng',
        reply_to: data.email,
        subject: `[Chaingang Contact] Message from ${data.name}`,
        text: `Name: ${data.name}\nEmail: ${data.email}\n\nMessage:\n${data.message}\n\n---\nSent via chaingang.ng contact form.\nNDPR Consent: Yes`,
      }),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.error('[Resend Error]', errorBody)
      return { error: 'Failed to send message. Please email info@chaingang.ng directly.' }
    }

    return { success: true }
  } catch (err) {
    console.error('[Resend Exception]', err)
    return { error: 'Failed to send message. Please email info@chaingang.ng directly.' }
  }
}
