import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Redirect if already logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user.app_metadata.role === 'admin') navigate('/admin', { replace: true })
    })
  }, [navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError(authError.message)
      setIsLoading(false)
      return
    }

    if (data.user?.app_metadata.role !== 'admin') {
      await supabase.auth.signOut()
      setError('This account does not have administrator access.')
      setIsLoading(false)
      return
    }

    navigate('/admin', { replace: true })
  }

  return (
    <div className="min-h-screen bg-stone-900 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl">
        <div className="mb-6">
          <h1 className="font-serif text-2xl font-bold text-stone-900">Admin Login</h1>
          <p className="text-stone-500 text-sm mt-1">PNYX Athens</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="admin-email" className="block text-sm font-medium text-stone-700 mb-1">
              Email
            </label>
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              className="w-full border border-stone-300 rounded-xl px-4 py-3 text-base
                         focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="admin-password" className="block text-sm font-medium text-stone-700 mb-1">
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="w-full border border-stone-300 rounded-xl px-4 py-3 text-base
                         focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
            />
          </div>

          {(error || (location.state as { unauthorized?: boolean } | null)?.unauthorized) && (
            <p role="alert" className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">
              {error ?? 'Administrator access is required.'}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-stone-200
                       text-white font-semibold py-3 rounded-xl transition-colors text-base"
          >
            {isLoading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
