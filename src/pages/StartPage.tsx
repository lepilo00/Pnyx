import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Layout from '@/components/Layout'
import StopCard from '@/components/StopCard'
import DisclaimerBox from '@/components/DisclaimerBox'
import { supabase } from '@/lib/supabaseClient'
import { track } from '@/lib/analytics'
import { withTimeout } from '@/lib/withTimeout'
import { FALLBACK_STOPS } from '@/data/fallbackStops'
import type { Stop } from '@/lib/types'

export default function StartPage() {
  const navigate = useNavigate()
  const [stops, setStops] = useState<Stop[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadStops() {
      const result = await withTimeout(
        supabase
          .from('stops')
          .select('*')
          .eq('is_published', true)
          .order('order_index', { ascending: true }),
        3000
      )

      const data = result?.data
      const error = result?.error
      setStops(error || !data || data.length === 0 ? FALLBACK_STOPS : (data as Stop[]))
      setIsLoading(false)
    }
    void loadStops()
  }, [])

  const handleStart = () => {
    if (stops.length === 0) return
    void track('start_walk_clicked', '/start')
    navigate(`/stop/${stops[0].id}`, { state: { stops } })
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <p className="text-xs uppercase tracking-widest text-amber-600 dark:text-amber-500 font-semibold mb-1">
            Getting started
          </p>
          <h1 className="font-serif text-2xl font-bold text-stone-900 dark:text-stone-100 mb-2">
            The Place Where Democracy Spoke
          </h1>
          <p className="text-stone-600 dark:text-stone-400 text-sm leading-relaxed">
            4 stops. At each one, read the text and listen to the audio when you arrive at the
            location. The walk takes approximately 20 minutes on foot.
          </p>
        </div>

        {/* Stops */}
        <div>
          <h2 className="text-xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-3">
            Your 4 stops
          </h2>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 animate-pulse"
                >
                  <div className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-stone-200 dark:bg-stone-700" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-stone-200 dark:bg-stone-700 rounded w-3/4" />
                      <div className="h-3 bg-stone-100 dark:bg-stone-800 rounded w-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {stops.map((stop) => (
                <StopCard key={stop.id} stop={stop} />
              ))}
            </div>
          )}
        </div>

        {/* Safety */}
        <DisclaimerBox variant="safety" />

        {/* Start button */}
        <div className="space-y-3">
          <button
            onClick={handleStart}
            disabled={isLoading || stops.length === 0}
            className="w-full bg-amber-600 hover:bg-amber-700 active:bg-amber-800
                       disabled:bg-stone-200 dark:disabled:bg-stone-700
                       disabled:text-stone-400 dark:disabled:text-stone-500
                       text-white font-semibold text-lg py-4 rounded-2xl
                       transition-colors shadow-lg shadow-amber-200 dark:shadow-amber-900/20"
          >
            {isLoading ? 'Loading…' : 'Begin the walk →'}
          </button>
          <p className="text-xs text-stone-400 dark:text-stone-500 text-center">
            No login required · Completely free
          </p>
          <Link
            to="/navigate"
            className="flex items-center justify-center gap-2 w-full
                       bg-white dark:bg-stone-900
                       hover:bg-stone-50 dark:hover:bg-stone-800
                       border border-stone-200 dark:border-stone-700
                       text-stone-600 dark:text-stone-300
                       font-medium text-sm py-3 rounded-2xl transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
            Navigate to Pnyx
          </Link>
        </div>
      </div>
    </Layout>
  )
}
