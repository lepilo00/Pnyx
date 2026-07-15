import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from '@/components/Layout'
import DisclaimerBox from '@/components/DisclaimerBox'
import HowToGetThereIllustration from '@/components/HowToGetThereIllustration'
import { supabase } from '@/lib/supabaseClient'
import { track } from '@/lib/analytics'
import { withTimeout } from '@/lib/withTimeout'
import { useFallbackStops } from '@/data/fallbackStops'
import { useLocalizedStops } from '@/lib/useLocalizedStops'
import { useIntroAudio } from '@/lib/useIntroAudio'
import { useAudioPlayer, formatTime } from '@/hooks/useAudioPlayer'
import type { Stop } from '@/lib/types'

const cardClass =
  'bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/70 dark:border-stone-800 shadow-sm'

// "The free experience" — introduction audio + the free chapter(s), why the
// place matters, and how to get there (mockup layout on parchment).
export default function StartPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const fallbackStops = useFallbackStops()
  const introAudioUrl = useIntroAudio()
  const [stops, setStops] = useState<Stop[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const intro = useAudioPlayer(introAudioUrl, {
    onPlay: () => void track('intro_audio_started', '/start'),
  })

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

  // The free experience lists only genuinely free chapters — paid ones live
  // on the premium screen (even after unlocking).
  const displayStops = useLocalizedStops(stops).filter((s) => !s.is_bonus)
  const freeStops = displayStops.filter((s) => !s.is_paid)

  const openStop = (stop: Stop) => {
    void track('start_walk_clicked', '/start')
    navigate(`/stop/${stop.id}`, { state: { stops } })
  }

  return (
    <Layout showBack>
      <div className="space-y-5">
        {/* Header */}
        <h1 className="font-serif text-3xl font-bold text-amber-700 dark:text-amber-500 pt-1">
          {t('freeExperience.heading')}
        </h1>

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
            {/* Introduction card */}
            {intro.hasAudio && (
              <div className={`${cardClass} p-5`}>
                {intro.audioElement}
                <div className="flex items-center gap-4">
                  <button
                    onClick={intro.togglePlay}
                    aria-label={intro.isPlaying ? t('audioPlayer.pauseAudio') : t('audioPlayer.playAudio')}
                    className="w-14 h-14 rounded-full border-2 border-amber-600 dark:border-amber-500
                               text-amber-600 dark:text-amber-400 flex-shrink-0
                               flex items-center justify-center
                               hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"
                  >
                    {intro.isLoading ? (
                      <span className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                    ) : intro.isPlaying ? (
                      <PauseGlyph />
                    ) : (
                      <PlayGlyph />
                    )}
                  </button>
                  <div>
                    <p className="font-semibold text-stone-800 dark:text-stone-100">
                      {t('freeExperience.introTitle')}
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-400 mt-0.5">
                      {intro.hasError
                        ? t('audioPlayer.unavailable')
                        : intro.hasStarted
                        ? `${formatTime(intro.currentTime)} / ${formatTime(intro.duration)}`
                        : intro.duration > 0
                        ? formatTime(intro.duration)
                        : t('freeExperience.introDuration')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Free chapters */}
            {freeStops.map((stop) => (
              <div
                key={stop.id}
                onClick={() => openStop(stop)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    openStop(stop)
                  }
                }}
                className={`${cardClass} p-5 cursor-pointer active:scale-[0.99]
                            hover:border-amber-300 dark:hover:border-amber-700 transition-all duration-200`}
              >
                <div className="flex items-center gap-4">
                  <span className="w-14 h-14 rounded-full border-2 border-amber-600/70 dark:border-amber-500/70
                                   text-amber-700 dark:text-amber-400 font-serif text-2xl font-bold flex-shrink-0
                                   flex items-center justify-center">
                    {stop.order_index}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-stone-800 dark:text-stone-100 leading-snug">
                      {t('premium.chapterLabel', { number: stop.order_index })} —{' '}
                      {stop.title}
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-400 mt-0.5">
                      {t('freeExperience.chapterDuration')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Why this place matters */}
        <section className={`${cardClass} p-5`}>
          <h2 className="font-serif text-lg font-bold text-stone-800 dark:text-stone-100 mb-5">
            {t('freeExperience.whyHeading')}
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: <SpeakersIcon />, label: t('freeExperience.why1') },
              { icon: <EyeOffIcon />, label: t('freeExperience.why2') },
              { icon: <CitizensIcon />, label: t('freeExperience.why3') },
            ].map(({ icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-2.5 text-center">
                <span className="text-amber-600 dark:text-amber-500">{icon}</span>
                <span className="text-xs text-stone-600 dark:text-stone-400 leading-tight">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* How to get there */}
        <section className={`${cardClass} p-5`}>
          <h2 className="font-serif text-lg font-bold text-stone-800 dark:text-stone-100 mb-4">
            {t('freeExperience.howToGetThereHeading')}
          </h2>
          <HowToGetThereIllustration />
          <div className="flex justify-between px-3 -mt-1 mb-4 text-xs text-stone-500 dark:text-stone-400">
            <span>{t('freeExperience.fromAcropolis')}</span>
            <span className="pr-4">{t('freeExperience.toPnyx')}</span>
          </div>
          <p className="text-center text-sm text-amber-700 dark:text-amber-400 font-medium">
            {t('freeExperience.walkInfo')}
          </p>
          <Link
            to="/navigate"
            className="mt-3 flex items-center justify-center gap-1.5 text-sm font-medium
                       text-stone-500 dark:text-stone-400
                       hover:text-amber-700 dark:hover:text-amber-400 transition-colors"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
            {t('start.navigateButton')}
          </Link>
        </section>

        {/* Safety */}
        <DisclaimerBox variant="safety" />

        <p className="text-xs text-stone-400 dark:text-stone-500 text-center pb-2">
          {t('start.noLoginRequired')}
        </p>
      </div>
    </Layout>
  )
}

function PlayGlyph() {
  return (
    <svg className="w-6 h-6 ml-0.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

function PauseGlyph() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" />
    </svg>
  )
}

// Group of speakers — "democracy was practised here"
function SpeakersIcon() {
  return (
    <svg className="w-9 h-9" viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="18" cy="12" r="4" />
      <path d="M11 27 v-2 a7 7 0 0 1 14 0 v2" />
      <circle cx="8" cy="14" r="3" />
      <path d="M2.5 25 v-1.5 a5.5 5.5 0 0 1 7 -5.3" />
      <circle cx="28" cy="14" r="3" />
      <path d="M33.5 25 v-1.5 a5.5 5.5 0 0 0 -7 -5.3" />
    </svg>
  )
}

// Crossed-out eye — "most visitors miss it"
function EyeOffIcon() {
  return (
    <svg className="w-9 h-9" viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 18 q14 -13 28 0 q-14 13 -28 0 z" />
      <circle cx="18" cy="18" r="4" />
      <path d="M7 29 L29 7" />
    </svg>
  )
}

// Crowd deciding together — "citizens decided together"
function CitizensIcon() {
  return (
    <svg className="w-9 h-9" viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="10" cy="10" r="2.6" />
      <circle cx="18" cy="8" r="2.6" />
      <circle cx="26" cy="10" r="2.6" />
      <path d="M5 28 v-3 a5 5 0 0 1 5 -5 h0 a5 5 0 0 1 4 2" />
      <path d="M31 28 v-3 a5 5 0 0 0 -5 -5 h0 a5 5 0 0 0 -4 2" />
      <path d="M13 29 v-4 a5 5 0 0 1 10 0 v4" />
    </svg>
  )
}
