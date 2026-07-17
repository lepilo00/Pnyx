import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from '@/components/Layout'
import FreeChapterCard from '@/components/FreeChapterCard'
import { supabase } from '@/lib/supabaseClient'
import { track } from '@/lib/analytics'
import { withTimeout } from '@/lib/withTimeout'
import { useFallbackStops } from '@/data/fallbackStops'
import { useLocalizedStops } from '@/lib/useLocalizedStops'
import { markStopAsListened, useListenedStopIds } from '@/lib/audioProgress'
import type { Stop } from '@/lib/types'

const cardClass =
  'bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/70 dark:border-stone-800 shadow-sm'
const SUPPORT_PROMPT_DISMISSED_KEY = 'pnyx-support-prompt-dismissed'

// Free experience: header with progress, the free chapter accordion, the
// premium call-to-action, and directions to the Pnyx.
export default function StartPage() {
  const { t, i18n } = useTranslation()
  const fallbackStops = useFallbackStops()
  const listenedStopIds = useListenedStopIds()
  const [stops, setStops] = useState<Stop[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedStopId, setExpandedStopId] = useState<string | null>(null)
  const [isSupportPromptDismissed, setIsSupportPromptDismissed] = useState(
    () => sessionStorage.getItem(SUPPORT_PROMPT_DISMISSED_KEY) === '1'
  )

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

  // This page exposes only genuinely free chapters. Paid and bonus content is
  // represented by the premium call-to-action below the inline players.
  const freeStops = useLocalizedStops(stops).filter((s) => !s.is_bonus && !s.is_paid)

  const listenedCount = freeStops.filter((s) => listenedStopIds.includes(s.id)).length
  const isExperienceComplete = freeStops.length > 0 && listenedCount === freeStops.length
  const showSupportPrompt = isExperienceComplete && !isSupportPromptDismissed

  useEffect(() => {
    if (showSupportPrompt) void track('donation_prompt_shown', '/start')
  }, [showSupportPrompt])

  const handleChapterEnded = (stopId: string) => {
    markStopAsListened(stopId)
    // Suggest the next unlistened chapter by expanding it (without autoplay).
    const endedIndex = freeStops.findIndex((s) => s.id === stopId)
    const nextStop = freeStops.find(
      (s, index) => index > endedIndex && !listenedStopIds.includes(s.id)
    )
    setExpandedStopId(nextStop?.id ?? null)
  }

  const dismissSupportPrompt = () => {
    sessionStorage.setItem(SUPPORT_PROMPT_DISMISSED_KEY, '1')
    setIsSupportPromptDismissed(true)
  }

  return (
    <Layout showBack>
      <div className="space-y-5">
        {/* Header */}
        <header className="pt-1 text-center">
          <h1 className="font-serif text-3xl font-bold text-stone-900 dark:text-stone-100">
            {t('freeExperience.heading')}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-stone-600 dark:text-stone-300">
            {t('freeExperience.subtitle')}
          </p>
          <p className="mt-3 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs font-medium text-stone-500 dark:text-stone-400">
            <span className="flex items-center gap-1"><ClockGlyph />{t('freeExperience.meta.duration')}</span>
            <MetaDot />
            <span>{t('freeExperience.meta.free')}</span>
            <MetaDot />
            <span className="flex items-center gap-1"><HeadphonesGlyph small />{t('freeExperience.meta.anywhere')}</span>
          </p>
          {freeStops.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold text-stone-600 dark:text-stone-300">
                {t('freeExperience.progress', { completed: listenedCount, total: freeStops.length })}
              </p>
              <div
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={freeStops.length}
                aria-valuenow={listenedCount}
                aria-label={t('freeExperience.progress', { completed: listenedCount, total: freeStops.length })}
                className="h-1.5 w-full overflow-hidden rounded-full bg-stone-200 dark:bg-stone-700"
              >
                <div
                  className="h-full rounded-full bg-amber-600 transition-all duration-500"
                  style={{ width: `${(listenedCount / freeStops.length) * 100}%` }}
                />
              </div>
            </div>
          )}
        </header>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className={`${cardClass} p-5 animate-pulse`}>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-stone-200 dark:bg-stone-700 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-stone-200 dark:bg-stone-700 rounded w-3/4" />
                    <div className="h-3 bg-stone-100 dark:bg-stone-800 rounded w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {/* Free chapters */}
            {freeStops.map((stop, index) => (
              <FreeChapterCard
                key={stop.id}
                index={index}
                title={stop.title}
                src={stop.audio_url ?? ''}
                transcript={stop.description}
                isListened={listenedStopIds.includes(stop.id)}
                isExpanded={expandedStopId === stop.id}
                onToggleExpanded={() =>
                  setExpandedStopId((current) => (current === stop.id ? null : stop.id))
                }
                onPlay={() => void track('stop_audio_started', '/start', { stop_id: stop.id })}
                onEnded={() => handleChapterEnded(stop.id)}
              />
            ))}

            {showSupportPrompt && (
              <section className="rounded-2xl border border-green-200 bg-green-50 p-5 shadow-sm dark:border-green-900/50 dark:bg-green-950/20">
                <div className="flex items-start gap-3">
                  <span
                    className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-green-600 text-white"
                    aria-hidden="true"
                  >
                    <HeartGlyph />
                  </span>
                  <div>
                    <h2 className="font-serif text-lg font-bold leading-snug text-stone-900 dark:text-stone-100">
                      {t('freeExperience.completion.heading')}
                    </h2>
                    <p className="mt-1 text-sm leading-relaxed text-stone-600 dark:text-stone-300">
                      {t('freeExperience.completion.body')}
                    </p>
                  </div>
                </div>
                <Link
                  to="/support"
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-green-700
                             py-3 font-semibold text-white shadow-sm transition-colors
                             hover:bg-green-800 active:bg-green-900"
                >
                  <HeartGlyph />
                  {t('freeExperience.completion.supportCta')}
                </Link>
                <button
                  onClick={dismissSupportPrompt}
                  className="mt-2 w-full rounded-xl border border-stone-300 bg-white py-2.5 text-sm
                             font-medium text-stone-600 transition-colors hover:bg-stone-50
                             dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800"
                >
                  {t('freeExperience.completion.notNow')}
                </button>
              </section>
            )}

            <Link
              to="/premium"
              className="group block rounded-2xl border border-navy-700
                         bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 p-5
                         shadow-lg shadow-navy-950/20 transition-all duration-200
                         hover:-translate-y-0.5 hover:border-amber-500/70 hover:shadow-xl hover:shadow-navy-950/30
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2
                         focus-visible:ring-offset-parchment-100"
            >
              <div className="flex items-start gap-4">
                <span className="flex-shrink-0 pt-0.5 text-amber-400" aria-hidden="true">
                  <TempleGlyph />
                </span>
                <div className="min-w-0">
                  <h2 className="font-serif text-xl font-bold text-white transition-colors group-hover:text-amber-300">
                    {isExperienceComplete
                      ? t('freeExperience.goDeeper.readyHeading')
                      : t('premium.title')}
                  </h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-stone-300">
                    {isExperienceComplete
                      ? t('freeExperience.goDeeper.readyBody')
                      : t('freeExperience.goDeeper.body')}
                  </p>
                </div>
              </div>

              <span
                className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl bg-amber-600 py-3
                           font-semibold text-white shadow-sm transition-colors group-hover:bg-amber-500"
              >
                {isExperienceComplete
                  ? t('freeExperience.goDeeper.readyCta')
                  : t('freeExperience.goDeeper.cta')}
                <ChevronRightGlyph />
              </span>

              <p className="mt-3 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs text-stone-300">
                <span className="flex items-center gap-1"><HeadphonesGlyph small />{t('freeExperience.goDeeper.features.audio')}</span>
                <MetaDot />
                <span>{t('freeExperience.goDeeper.features.bonus')}</span>
                <MetaDot />
                <span>{t('freeExperience.goDeeper.features.onSite')}</span>
              </p>
            </Link>

          </div>
        )}

        <p className="flex items-center gap-2 rounded-xl border border-amber-200/80 bg-amber-50/80 px-4 py-3
                      text-xs font-medium text-stone-600 shadow-sm
                      dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-stone-300">
          <TipGlyph />
          {t('freeExperience.tip')}
        </p>

        <p className="text-xs text-stone-400 dark:text-stone-500 text-center pb-2">
          {t('start.noLoginRequired')}
        </p>
      </div>
    </Layout>
  )
}

function HeadphonesGlyph({ small = false }: { small?: boolean }) {
  return (
    <svg className={small ? 'h-3.5 w-3.5' : 'h-5 w-5'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 14v-2a8 8 0 0116 0v2" />
      <rect x="3" y="14" width="4" height="6" rx="1.5" />
      <rect x="17" y="14" width="4" height="6" rx="1.5" />
    </svg>
  )
}

function ClockGlyph() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function HeartGlyph() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  )
}

function TipGlyph() {
  return (
    <svg className="h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M6 3h12v18l-6-4-6 4z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function MetaDot() {
  return <span className="text-amber-500" aria-hidden="true">·</span>
}

function TempleGlyph() {
  return (
    <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M12 3l9 5H3l9-5zM5 8v9m4.5-9v9m5-9v9M19 8v9M3 20h18" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ChevronRightGlyph() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
      <path d="M8 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
