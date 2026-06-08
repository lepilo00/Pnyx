import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'

interface Stats {
  signups: number
  feedback: number
  completions: number
  avgRating: number | null
}

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<Stats>({ signups: 0, feedback: 0, completions: 0, avgRating: null })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      const [signupsRes, feedbackRes, completionsRes, avgRes] = await Promise.all([
        supabase.from('email_signups').select('*', { count: 'exact', head: true }),
        supabase.from('feedback').select('*', { count: 'exact', head: true }),
        supabase
          .from('analytics_events')
          .select('*', { count: 'exact', head: true })
          .eq('event_name', 'walk_completed'),
        supabase.from('feedback').select('rating').not('rating', 'is', null),
      ])

      const ratings = avgRes.data?.map((r) => r.rating as number) ?? []
      const avg = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null

      setStats({
        signups: signupsRes.count ?? 0,
        feedback: feedbackRes.count ?? 0,
        completions: completionsRes.count ?? 0,
        avgRating: avg !== null ? Math.round(avg * 10) / 10 : null,
      })
      setIsLoading(false)
    }

    void loadStats()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/admin/login', { replace: true })
  }

  const statCards = [
    { label: 'Email signups', value: stats.signups, icon: '📧' },
    { label: 'Feedback responses', value: stats.feedback, icon: '💬' },
    { label: 'Walk completions', value: stats.completions, icon: '🏁' },
    { label: 'Avg. rating', value: stats.avgRating !== null ? `${stats.avgRating} ★` : '—', icon: '⭐' },
  ]

  return (
    <div className="min-h-screen bg-stone-100">
      {/* Admin nav */}
      <nav className="bg-stone-900 text-white px-6 py-4 flex items-center justify-between">
        <div>
          <span className="font-bold text-lg">Pnyx Admin</span>
          <span className="text-stone-400 text-sm ml-3">Democracy Walk</span>
        </div>
        <button
          onClick={handleSignOut}
          className="text-stone-300 hover:text-white text-sm transition-colors"
        >
          Sign out
        </button>
      </nav>

      <main className="max-w-4xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-bold text-stone-800">Dashboard</h1>

        {/* Stat cards */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-5 animate-pulse">
                <div className="h-4 bg-stone-200 rounded w-1/2 mb-2" />
                <div className="h-8 bg-stone-100 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {statCards.map(({ label, value, icon }) => (
              <div key={label} className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <span>{icon}</span>
                  <p className="text-sm text-stone-500">{label}</p>
                </div>
                <p className="text-3xl font-bold text-stone-900">{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Nav links */}
        <div className="grid grid-cols-1 gap-3">
          {[
            { to: '/admin/stops', label: 'Manage stops', desc: 'Add, edit, reorder, publish/unpublish audio stops' },
            { to: '/admin/signups', label: 'Email signups', desc: 'View and export visitor email signups' },
            { to: '/admin/feedback', label: 'Feedback', desc: 'View visitor ratings and comments' },
          ].map(({ to, label, desc }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center justify-between bg-white rounded-2xl border border-stone-200 p-4 shadow-sm hover:border-amber-400 transition-colors group"
            >
              <div>
                <p className="font-semibold text-stone-800 group-hover:text-amber-700">{label}</p>
                <p className="text-sm text-stone-500 mt-0.5">{desc}</p>
              </div>
              <span className="text-stone-300 group-hover:text-amber-400 text-xl">→</span>
            </Link>
          ))}
        </div>

        {/* Link to public site */}
        <div className="text-center">
          <a
            href="/"
            className="text-sm text-stone-400 hover:text-stone-600 transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            View public site ↗
          </a>
        </div>
      </main>
    </div>
  )
}
