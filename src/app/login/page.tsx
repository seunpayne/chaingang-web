import { login, signup } from './actions'

export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string; error?: string }
}) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-cream px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold text-forest">
            Member Login
          </h1>
          <p className="text-forest-600 mt-2">
            Access your Chaingang member portal
          </p>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-sm border border-cream-200">
          {searchParams.error && (
            <div className="mb-4 p-3 bg-red-50 text-red-500 rounded text-sm">
              {searchParams.error === 'invalid_credentials'
                ? 'Invalid email or password.'
                : searchParams.error === 'missing_fields'
                  ? 'Please fill in all fields.'
                  : 'An error occurred. Please try again.'}
            </div>
          )}

          <form className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-forest mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full px-4 py-2 border border-cream-300 rounded-md 
                           focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-forest mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="w-full px-4 py-2 border border-cream-300 rounded-md 
                           focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            <div className="flex gap-3">
              <button
                formAction={login}
                className="flex-1 btn-primary text-center"
              >
                Sign In
              </button>
              <button
                formAction={signup}
                className="flex-1 btn-secondary text-center"
              >
                Sign Up
              </button>
            </div>
          </form>

          <p className="mt-4 text-center text-sm text-forest-400">
            Member registration is invite-only.{' '}
            <a href="/" className="text-gold hover:underline">
              Back to site
            </a>
          </p>
        </div>
      </div>
    </main>
  )
}
