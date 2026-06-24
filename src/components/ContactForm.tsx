'use client'

import { useState } from 'react'
import { submitContactForm } from '@/app/actions/contact'

export default function ContactForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [ndprConsent, setNdprConsent] = useState(false)
  const [status, setStatus] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setStatus(null)

    const result = await submitContactForm({
      name,
      email,
      message,
      ndprConsent,
    })

    if (result.error) {
      setStatus({ type: 'error', message: result.error })
    } else {
      setStatus({
        type: 'success',
        message: 'Message sent! We\'ll get back to you soon.',
      })
      setName('')
      setEmail('')
      setMessage('')
      setNdprConsent(false)
    }

    setSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto space-y-5 text-left">
      {status && (
        <div
          className={`p-4 rounded-lg border text-sm ${
            status.type === 'success'
              ? 'bg-green-50 text-green-200 border-green-700'
              : 'bg-red-50 text-red-700 border-red-200'
          }`}
        >
          {status.message}
        </div>
      )}

      <div>
        <label htmlFor="contact-name" className="block text-cream-200 text-sm mb-1">
          Name
        </label>
        <input
          id="contact-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={100}
          className="w-full px-4 py-2 bg-forest-600 border border-forest-400 rounded-lg
                     text-cream placeholder-cream-300
                     focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
          placeholder="Your name"
        />
      </div>

      <div>
        <label htmlFor="contact-email" className="block text-cream-200 text-sm mb-1">
          Email
        </label>
        <input
          id="contact-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          maxLength={255}
          className="w-full px-4 py-2 bg-forest-600 border border-forest-400 rounded-lg
                     text-cream placeholder-cream-300
                     focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label htmlFor="contact-message" className="block text-cream-200 text-sm mb-1">
          Message
        </label>
        <textarea
          id="contact-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          maxLength={2000}
          rows={4}
          className="w-full px-4 py-2 bg-forest-600 border border-forest-400 rounded-lg
                     text-cream placeholder-cream-300 resize-none
                     focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
          placeholder="Write your message..."
        />
        <div className="text-cream-300 text-xs mt-1 text-right">
          {message.length}/2000
        </div>
      </div>

      {/* NDPR Consent Checkbox */}
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          id="ndpr-consent"
          checked={ndprConsent}
          onChange={(e) => setNdprConsent(e.target.checked)}
          className="mt-1 rounded border-forest-400 text-gold focus:ring-gold bg-forest-600"
        />
        <label htmlFor="ndpr-consent" className="text-cream-200 text-sm leading-relaxed">
          I consent to the processing of my personal data in accordance with the
          Nigerian Data Protection Regulation (NDPR). Your data will only be used
          to respond to your message and will not be shared with third parties.
        </label>
      </div>

      <button
        type="submit"
        disabled={submitting || !ndprConsent}
        className="btn-primary w-full disabled:opacity-50"
      >
        {submitting ? 'Sending...' : 'Send Message'}
      </button>
    </form>
  )
}
