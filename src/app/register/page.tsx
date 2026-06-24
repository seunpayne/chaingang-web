'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [validating, setValidating] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [tokenError, setTokenError] = useState('')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [registering, setRegistering] = useState(false)
  const [error, setError] = useState('')

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setTokenError('No invite token provided. Please use the link from your invitation email.')
      setValidating(false)
      return
    }

    async function validate() {
      try {
        const res = await fetch(`/api/invites?token=${encodeURIComponent(token)}`)
        const data = await res.json()

        if (data.valid) {
          setTokenValid(true)
          setInviteEmail(data.email)
          setEmail(data.email) // Pre-fill email
        } else {
          setTokenError(data.error || 'Invalid invite token.')
        }
      } catch {
        setTokenError('Failed to validate invite. Please try again.')
      }
      setValidating(false)
    }

    validate()
  }, [token])

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setRegistering(true)

    try {
      const supabase = createClient()

      // Sign up the user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: email.split('@')[0],
          },
        },
      })

      if (signUpError) {
        setError(signUpError.message)
        setRegistering(false)
        return
      }

      // Mark invite as consumed
      await fetch(`/api/invites/consume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })

      // Auto-assign 'member' role via service client
      // This happens async — the webhook/db trigger could handle it too
      if (signUpData.user) {
        await fetch('/api/invites/assign-role', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: signUpData.user.id, token }),
        })
      }

      router.push('/dashboard?registered=true')
    } catch (err) {
      setError('Registration failed. Please try again.')
      setRegistering(false)
    }
  }

  // Invalid/no token state
  if (!validating && !tokenValid) {
    return (
      <main className="min-h-screen bg-cream flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="bg-white p-8 rounded-lg border border-red-200">
            <h1 className="font-display text-2xl font-bold text-red mb-4">
              Invalid Invite
            </h1>
            <p className="text-forest-600 mb-6">{tokenError}</p>
            <Link href="/" className="text-gold hover:underline font-semibold">
              ← Back to Home
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-cream flex items-center justify-center py-16">
      <div className="max-w-md mx-auto px-4 w-full">
        {validating ? (
          <div className="bg-white p-8 rounded-lg border border-cream-200 text-center">
            <div className="animate-pulse text-forest-400">
              Validating your invitation...
            </div>
          </div>
        ) : (
          <div className="bg-white p-8 rounded-lg border border-cream-200">
            <h1 className="font-display text-2xl font-bold text-forest mb-2">
              Welcome to Chaingang!
            </h1>
            <p className="text-forest-500 text-sm mb-6">
              Complete your registration to join the member platform.
            </p>

            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-500 rounded-lg border border-red-200 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-forest mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  readOnly
                  className="w-full px-4 py-2 border border-cream-300 rounded-lg bg-cream-50 text-forest-400"
                />
                <p className="text-xs text-forest-300 mt-1">
                  This is the email your invite was sent to.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-forest mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-4 py-2 border border-cream-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
                  placeholder="At least 8 characters"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-forest mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-cream-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
                  placeholder="Re-enter password"
                />
              </div>

              <button
                type="submit"
                disabled={registering}
                className="btn-primary w-full disabled:opacity-50"
              >
                {registering ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            <p className="text-xs text-forest-400 mt-4 text-center">
              Already have an account?{' '}
              <Link href="/login" className="text-gold hover:underline">
                Sign in here
              </Link>
            </p>
          </div>
        )}
      </div>
    </main>
  )
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-cream flex items-center justify-center">
          <div className="animate-pulse text-forest-400">Loading...</div>
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  )
}
