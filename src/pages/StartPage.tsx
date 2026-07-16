import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
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
import { markStopAsListened, useListenedStopIds } from '@/lib/audioProgress'
import type { Stop } from '@/lib/types'

const cardClass =
  'bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/70 dark:border-stone-800 shadow-sm'
const completedCardClass =
  'bg-stone-100 dark:bg-stone-900/60 rounded-2xl border border-stone-300 dark:border-stone-700 shadow-sm transition-colors duration-500'

// Free audio experience: inline introduction and free chapters, the premium
// call-to-action, and directions to the Pnyx.
export default function StartPage() {
  const { t, i18n } = useTranslation()
  const fallbackStops = useFallbackStops()
  const introAudioUrl = useIntroAudio()
  const listenedStopIds = useListenedStopIds()
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
  const displayStops = useLocalizedStops(stops).filter((s) => !s.is_bonus)
  const freeStops = displayStops.filter((s) => !s.is_paid)

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
            {introAudioUrl && (
              <CompactAudioCard
                src={introAudioUrl}
                title={t('freeExperience.introTitle')}
                onPlay={() => void track('intro_audio_started', '/start')}
              />
            )}

            {/* Free chapters */}
            {freeStops.map((stop) => (
              <CompactAudioCard
                key={stop.id}
                src={stop.audio_url ?? ''}
                title={stop.title}
                onPlay={() => void track('stop_audio_started', '/start', { stop_id: stop.id })}
                onEnded={() => markStopAsListened(stop.id)}
                initiallyCompleted={listenedStopIds.includes(stop.id)}
              />
            ))}

            <Link
              to="/premium"
              className="group relative block overflow-hidden rounded-2xl border border-navy-700
                         bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 p-5
                         shadow-lg shadow-navy-950/20 transition-all duration-200
                         hover:-translate-y-0.5 hover:border-amber-500/70 hover:shadow-xl hover:shadow-navy-950/30
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2
                         focus-visible:ring-offset-parchment-100"
            >
              <span
                className="absolute -right-10 -top-12 h-36 w-36 rounded-full border border-white/10 bg-white/[0.03]"
                aria-hidden="true"
              />
              <span
                className="absolute -bottom-16 -left-10 h-32 w-32 rounded-full bg-amber-500/[0.06]"
                aria-hidden="true"
              />

              <div className="relative">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full border border-amber-400/40 bg-amber-400/10 text-amber-400">
                    <HeadphonesGlyph />
                  </span>
                  <span className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-xs font-medium text-stone-300">
                    {t('premium.oneTime')}
                  </span>
                </div>

                <h2 className="font-serif text-xl font-bold text-white transition-colors group-hover:text-amber-300">
                  {t('premium.title')}
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-stone-300">
                  {t('premium.subtitle')}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {[
                    t('premium.features.audio'),
                    t('premium.features.bonus'),
                    t('premium.features.noApp'),
                  ].map((feature) => (
                    <span key={feature} className="rounded-full bg-white/[0.07] px-2.5 py-1 text-xs text-stone-300">
                      {feature}
                    </span>
                  ))}
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
                  <span className="text-sm font-semibold text-amber-400">
                    {t('menu.goDeeper')}
                  </span>
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-navy-950
                               transition-transform duration-200 group-hover:translate-x-1"
                    aria-hidden="true"
                  >
                    <ArrowRightGlyph />
                  </span>
                </div>
              </div>
            </Link>
          </div>
        )}

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

interface CompactAudioCardProps {
  src: string
  title: string
  onPlay: () => void
  onEnded?: () => void
  initiallyCompleted?: boolean
}

function CompactAudioCard({
  src,
  title,
  onPlay,
  onEnded,
  initiallyCompleted = false,
}: CompactAudioCardProps) {
  const { t } = useTranslation()
  const player = useAudioPlayer(src, { onPlay, onEnded })
  const hasCompleted = player.hasCompleted || initiallyCompleted

  return (
    <div className={`${hasCompleted ? completedCardClass : cardClass} p-5`}>
      {player.audioElement}
      <div className="flex items-center gap-4">
        <button
          onClick={player.togglePlay}
          disabled={!player.hasAudio || player.hasError}
          aria-label={`${player.isPlaying ? t('audioPlayer.pauseAudio') : t('audioPlayer.playAudio')}: ${title}`}
          className="w-14 h-14 rounded-full border-2 border-amber-600 dark:border-amber-500
                     text-amber-600 dark:text-amber-400 flex-shrink-0
                     flex items-center justify-center
                     hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors
                     disabled:border-stone-300 disabled:text-stone-300
                     dark:disabled:border-stone-700 dark:disabled:text-stone-600 disabled:cursor-not-allowed"
        >
          {player.isLoading ? (
            <span className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          ) : player.isPlaying ? (
            <PauseGlyph />
          ) : (
            <PlayGlyph />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-stone-800 dark:text-stone-100 leading-snug">
              {title}
            </p>
            {hasCompleted && (
              <span className="flex items-center gap-1 text-xs font-medium text-stone-500 dark:text-stone-400 flex-shrink-0">
                <CompletedGlyph />
                {t('audioPlayer.completed')}
              </span>
            )}
          </div>

          {!player.hasAudio || player.hasError ? (
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
              {t('audioPlayer.unavailable')}
            </p>
          ) : (
            <>
              <input
                type="range"
                min={0}
                max={player.duration || 1}
                step={0.1}
                value={player.currentTime}
                onChange={(event) => player.seek(Number(event.target.value))}
                disabled={player.duration <= 0}
                className="audio-scrubber w-full mt-2 disabled:opacity-40"
                style={{
                  '--progress': `${player.duration > 0 ? (player.currentTime / player.duration) * 100 : 0}%`,
                } as React.CSSProperties}
                aria-label={`${t('audioPlayer.progressLabel')}: ${title}`}
              />
              <div className="flex items-center justify-between mt-1.5 text-xs tabular-nums text-stone-500 dark:text-stone-400">
                <span>{formatTime(player.currentTime)}</span>
                <span>
                  {t('audioPlayer.timeRemaining', {
                    time: formatTime(Math.max(0, player.duration - player.currentTime)),
                  })}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
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

function CompletedGlyph() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.7-9.7a1 1 0 00-1.4-1.4L9 10.2 7.7 8.9a1 1 0 00-1.4 1.4l2 2a1 1 0 001.4 0l4-4z" clipRule="evenodd" />
    </svg>
  )
}

function HeadphonesGlyph() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 14v-2a8 8 0 0116 0v2" />
      <rect x="3" y="14" width="4" height="6" rx="1.5" />
      <rect x="17" y="14" width="4" height="6" rx="1.5" />
    </svg>
  )
}

function ArrowRightGlyph() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 10h12M11 5l5 5-5 5" />
    </svg>
  )
}
