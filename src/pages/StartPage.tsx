import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import StopCard from '@/components/StopCard'
import DisclaimerBox from '@/components/DisclaimerBox'
import { supabase } from '@/lib/supabaseClient'
import { track } from '@/lib/analytics'
import { FALLBACK_STOPS } from '@/data/fallbackStops'
import type { Stop } from '@/lib/types'

export default function StartPage() {
  const navigate = useNavigate()
  const [stops, setStops] = useState<Stop[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadStops() {
      const { data, error } = await supabase
        .from('stops')
        .select('*')
        .eq('is_published', true)
        .order('order_index', { ascending: true })

      if (error || !data || data.length === 0) {
        setStops(FALLBACK_STOPS)
      } else {
        setStops(data as Stop[])
      }
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
          <p className="text-xs uppercase tracking-widest text-amber-600 font-semibold mb-1">
            Getting started
          </p>
          <h1 className="font-serif text-2xl font-bold text-stone-900 mb-2">
            The Place Where Democracy Spoke
          </h1>
          <p className="text-stone-600 text-sm leading-relaxed">
            This walk has 4 stops. At each stop, read the text and listen to the audio when
            you arrive at the location. The walk takes approximately 20 minutes on foot.
          </p>
        </div>

        {/* Walk overview */}
        <div>
          <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-3">
            Your 4 stops
          </h2>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded-2xl border border-stone-200 bg-white p-4 animate-pulse">
                  <div className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-stone-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-stone-200 rounded w-3/4" />
                      <div className="h-3 bg-stone-100 rounded w-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {stops.map((stop) => (
                <StopCard key={stop.id} stop={stop} />
              ))}
            </div>
          )}
        </div>

        {/* Safety disclaimer */}
        <DisclaimerBox variant="safety" />

        {/* Start button */}
        <button
          onClick={handleStart}
          disabled={isLoading || stops.length === 0}
          className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-stone-200 disabled:text-stone-400
                     text-white font-semibold text-lg py-4 rounded-2xl transition-colors"
        >
          {isLoading ? 'Loading…' : 'Begin the walk →'}
        </button>

        <p className="text-xs text-stone-400 text-center">
          No login required. This walk is completely free.
        </p>
      </div>
    </Layout>
  )
}
