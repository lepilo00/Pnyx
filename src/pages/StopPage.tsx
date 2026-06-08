import { useEffect, useState } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import AudioPlayer from '@/components/AudioPlayer'
import { supabase } from '@/lib/supabaseClient'
import { track } from '@/lib/analytics'
import { FALLBACK_STOPS } from '@/data/fallbackStops'
import type { Stop } from '@/lib/types'

export default function StopPage() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const navigate = useNavigate()

  // Stops are passed via router state to avoid extra Supabase fetches.
  // When navigated to directly (e.g. bookmarked), we reload from Supabase or use fallback.
  const [stops, setStops] = useState<Stop[]>(
    (location.state as { stops?: Stop[] } | null)?.stops ?? []
  )
  const [isLoading, setIsLoading] = useState(stops.length === 0)

  useEffect(() => {
    if (stops.length > 0) return

    async function loadStops() {
      const { data, error } = await supabase
        .from('stops')
        .select('*')
        .eq('is_published', true)
        .order('order_index', { ascending: true })

      setStops(error || !data || data.length === 0 ? FALLBACK_STOPS : (data as Stop[]))
      setIsLoading(false)
    }

    void loadStops()
  }, [stops.length])

  const currentStop = stops.find((s) => s.id === id)
  const currentIndex = stops.findIndex((s) => s.id === id)
  const isLastStop = currentIndex === stops.length - 1
  const nextStop = stops[currentIndex + 1]

  useEffect(() => {
    if (!id || !currentStop) return
    void track('stop_opened', `/stop/${id}`, { stop_id: id })
  }, [id, currentStop])

  const handleNext = () => {
    if (!nextStop) return
    navigate(`/stop/${nextStop.id}`, { state: { stops } })
  }

  const handleFinish = () => {
    void track('walk_completed', `/stop/${id}`, { stop_id: id })
    navigate('/finish', { state: { stops } })
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    )
  }

  if (!currentStop) {
    return (
      <Layout>
        <div className="text-center py-20">
          <p className="text-stone-500 mb-4">Stop not found.</p>
          <button
            onClick={() => navigate('/start')}
            className="text-amber-600 font-semibold underline"
          >
            Back to start
          </button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout
      showProgress
      currentStop={currentIndex + 1}
      totalStops={stops.length}
    >
      <div className="space-y-5">
        {/* Stop header */}
        <div>
          <p className="text-xs uppercase tracking-widest text-amber-600 font-semibold mb-1">
            Stop {currentIndex + 1}
          </p>
          <h1 className="font-serif text-2xl font-bold text-stone-900 leading-tight">
            {currentStop.title}
          </h1>
        </div>

        {/* Optional illustration */}
        {currentStop.image_url && (
          <img
            src={currentStop.image_url}
            alt={`Illustration for stop ${currentIndex + 1}`}
            className="w-full rounded-2xl aspect-video object-cover"
          />
        )}

        {/* Audio player */}
        <AudioPlayer
          src={currentStop.audio_url ?? ''}
          title={`Stop ${currentIndex + 1} · ${currentStop.title}`}
          onPlay={() =>
            void track('stop_audio_started', `/stop/${currentStop.id}`, { stop_id: currentStop.id })
          }
          onEnded={() =>
            void track('stop_completed', `/stop/${currentStop.id}`, { stop_id: currentStop.id })
          }
        />

        {/* Description */}
        <p className="text-stone-700 leading-relaxed text-base">{currentStop.description}</p>

        {/* Navigation */}
        {isLastStop ? (
          <button
            onClick={handleFinish}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white
                       font-semibold text-lg py-4 rounded-2xl transition-colors"
          >
            Complete the walk →
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white
                       font-semibold text-lg py-4 rounded-2xl transition-colors"
          >
            Next stop →
          </button>
        )}

        {/* Stop list mini-nav */}
        <div className="border-t border-stone-200 pt-4">
          <p className="text-xs text-stone-400 mb-2 text-center">All stops</p>
          <div className="flex justify-center gap-2">
            {stops.map((s, i) => (
              <button
                key={s.id}
                onClick={() => navigate(`/stop/${s.id}`, { state: { stops } })}
                className={`w-8 h-8 rounded-full text-sm font-semibold transition-colors ${
                  s.id === id
                    ? 'bg-amber-500 text-white'
                    : i < currentIndex
                    ? 'bg-stone-300 text-white'
                    : 'bg-stone-100 text-stone-500'
                }`}
                aria-label={`Go to stop ${i + 1}`}
                aria-current={s.id === id ? 'step' : undefined}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  )
}
