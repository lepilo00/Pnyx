import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from '@/components/Layout'
import StopCard from '@/components/StopCard'
import DisclaimerBox from '@/components/DisclaimerBox'
import { supabase } from '@/lib/supabaseClient'
import { track } from '@/lib/analytics'
import { withTimeout } from '@/lib/withTimeout'
import { useFallbackStops } from '@/data/fallbackStops'
import { useLocalizedStops } from '@/lib/useLocalizedStops'
import type { Stop } from '@/lib/types'

const DEFAULT_EXCERPT_CHARS = 85
const EXCERPT_SHRINK_STEP = 10

export default function StartPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const fallbackStops = useFallbackStops()
  const [stops, setStops] = useState<Stop[]>([])
  const displayStops = useLocalizedStops(stops)
  const [isLoading, setIsLoading] = useState(true)
  const [excerptChars, setExcerptChars] = useState(DEFAULT_EXCERPT_CHARS)
  const contentRef = useRef<HTMLDivElement>(null)
  const lastWidthRef = useRef(0)

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
      setStops(error || !data || data.length === 0 ? fallbackStops : (data as Stop[]))
      setIsLoading(false)
    }
    void loadStops()
    // fallbackStops intentionally omitted — it's a new array every render;
    // re-run only on language change so a switch mid-session re-translates it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language])

  // Shrink chapter excerpts step by step (before paint) until the action
  // buttons at the bottom fit within the viewport without scrolling.
  useLayoutEffect(() => {
    if (isLoading) return
    const el = contentRef.current
    if (!el) return
    const overflows =
      el.getBoundingClientRect().bottom + window.scrollY > window.innerHeight
    if (overflows && excerptChars > 0) {
      setExcerptChars((c) => Math.max(0, c - EXCERPT_SHRINK_STEP))
    }
  }, [isLoading, excerptChars, stops])

  // Re-fit on rotation / width changes; ignore height-only changes so the
  // collapsing mobile URL bar doesn't make the text jump while scrolling.
  useEffect(() => {
    lastWidthRef.current = window.innerWidth
    const onResize = () => {
      if (window.innerWidth === lastWidthRef.current) return
      lastWidthRef.current = window.innerWidth
      setExcerptChars(DEFAULT_EXCERPT_CHARS)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const openStop = (stop: Stop) => {
    navigate(`/stop/${stop.id}`, { state: { stops } })
  }

  const handleStart = () => {
    if (stops.length === 0) return
    void track('start_walk_clicked', '/start')
    navigate(`/stop/${stops[0].id}`, { state: { stops } })
  }

  return (
    <Layout>
      <div className="space-y-6" ref={contentRef}>
        {/* Header */}
        <div>
          <p className="text-xs uppercase tracking-widest text-amber-600 dark:text-amber-500 font-semibold mb-1">
            {t('start.eyebrow')}
          </p>
          <h1 className="font-serif text-2xl font-bold text-stone-900 dark:text-stone-100 mb-2">
            {t('start.heading')}
          </h1>
          <p className="text-stone-600 dark:text-stone-400 text-sm leading-relaxed">
            {t('start.subhead')}
          </p>
        </div>

        {/* Stops */}
        <div>
          <h2 className="text-xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-3">
            {t('start.stopsHeading')}
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
              {displayStops.map((stop) => (
                <StopCard
                  key={stop.id}
                  stop={stop}
                  excerptChars={excerptChars}
                  onClick={() => openStop(stop)}
                />
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
            {isLoading ? t('start.loadingButton') : t('start.beginButton')}
          </button>
          <p className="text-xs text-stone-400 dark:text-stone-500 text-center">
            {t('start.noLoginRequired')}
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
            {t('start.navigateButton')}
          </Link>
        </div>
      </div>
    </Layout>
  )
}
