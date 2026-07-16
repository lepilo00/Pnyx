import { useEffect, useState } from 'react'
import { useParams, useLocation, useNavigate, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from '@/components/Layout'
import AudioPlayer from '@/components/AudioPlayer'
import MiniAudioPlayer from '@/components/MiniAudioPlayer'
import ArrivalGalleryModal from '@/components/ArrivalGalleryModal'
import HeroSlideshow from '@/components/HeroSlideshow'
import { supabase } from '@/lib/supabaseClient'
import { track } from '@/lib/analytics'
import { withTimeout } from '@/lib/withTimeout'
import { useLocalizedStops } from '@/lib/useLocalizedStops'
import { useAudioPlayer } from '@/hooks/useAudioPlayer'
import { markStopAsListened } from '@/lib/audioProgress'
import { STREET_VIEW_URL } from '@/lib/constants'
import { PNYX_GALLERY_IMAGES } from '@/data/pnyxImages'
import { HERO_SLIDESHOW_IMAGES } from '@/data/heroSlideshowImages'
import { useFallbackStops } from '@/data/fallbackStops'
import { useEntitlements, isStopLocked } from '@/lib/entitlements'
import type { Stop } from '@/lib/types'

export default function StopPage() {
  const { t, i18n } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const fallbackStops = useFallbackStops()

  const [stops, setStops] = useState<Stop[]>(
    (location.state as { stops?: Stop[] } | null)?.stops ?? []
  )
  const [isLoading, setIsLoading] = useState(stops.length === 0)
  const [isGalleryOpen, setIsGalleryOpen] = useState(false)
  const { unlocked } = useEntitlements()

  useEffect(() => {
    if (stops.length > 0) return
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
    // fallbackStops intentionally omitted — see StartPage.tsx for rationale.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stops.length, i18n.language])

  // Bonus stories can be opened from the premium screen, but stay outside the
  // numbered walk sequence (progress, next button and dot navigation).
  const localizedStops = useLocalizedStops(stops)
  const displayStops = localizedStops.filter((s) => !s.is_bonus)
  const currentStop = localizedStops.find((s) => s.id === id)
  const currentIndex = displayStops.findIndex((s) => s.id === id)
  const isBonus = !!currentStop?.is_bonus
  const isLastStop = currentIndex === displayStops.length - 1
  const nextStop = displayStops[currentIndex + 1]

  // Page-owned playback state, shared by the full card and the sticky mini
  // player so both stay in sync on a single <audio> element. A chapter or
  // language change swaps src, which resets the state and hides the mini bar.
  const audioTitle = currentStop
    ? isBonus
      ? currentStop.title
      : t('stop.audioTitle', { number: currentIndex + 1, title: currentStop.title })
    : ''
  const player = useAudioPlayer(currentStop?.audio_url ?? '', {
    onPlay: () => {
      if (id) void track('stop_audio_started', `/stop/${id}`, { stop_id: id })
    },
    onEnded: () => {
      if (id) markStopAsListened(id)
      if (id) void track('stop_completed', `/stop/${id}`, { stop_id: id })
    },
  })
  const showMiniPlayer = player.hasStarted && player.hasAudio && !player.hasError

  useEffect(() => {
    if (!id || !currentStop) return
    void track('stop_opened', `/stop/${id}`, { stop_id: id })
  }, [id, currentStop])

  const goToStop = (stop: Stop) => {
    navigate(`/stop/${stop.id}`, { state: { stops } })
  }

  // Every free-to-paid transition shows the support screen unless this
  // browser session has already been unlocked by a donation or purchase.
  const goToStopGated = (target: Stop) => {
    if (currentStop && !currentStop.is_paid && target.is_paid && !unlocked) {
      navigate('/support', { state: { nextStopId: target.id, stops } })
      return
    }
    if (isStopLocked(target, unlocked)) {
      navigate('/premium', { state: { fromStopId: target.id, stops } })
      return
    }
    goToStop(target)
  }

  const handleNext = () => {
    if (!nextStop) return
    goToStopGated(nextStop)
  }

  const handleFinish = () => {
    void track('walk_completed', `/stop/${id}`, { stop_id: id })
    navigate('/finish', { state: { stops } })
  }

  if (isLoading) {
    return (
      <Layout showBack>
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    )
  }

  // Hard block for deep links: a locked chapter opened by URL goes straight
  // to the premium screen instead of rendering its content.
  if (!isLoading && currentStop && isStopLocked(currentStop, unlocked)) {
    return <Navigate to="/premium" replace state={{ fromStopId: currentStop.id, stops }} />
  }

  if (!currentStop) {
    return (
      <Layout showBack>
        <div className="text-center py-24 space-y-3">
          <p className="text-stone-500 dark:text-stone-400">{t('stop.notFound')}</p>
          <button
            onClick={() => navigate('/start')}
            className="text-amber-600 dark:text-amber-400 font-semibold"
          >
            {t('stop.backToStart')}
          </button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout showBack showProgress={!isBonus} currentStop={currentIndex + 1} totalStops={displayStops.length}>
      {/* Extra bottom padding keeps the last content clear of the sticky mini player */}
      <div className={`space-y-5 ${showMiniPlayer ? 'pb-32' : ''}`}>
        {/* Stop header with decorative number */}
        <div className="relative">
          {!isBonus && (
            <span className="absolute -top-1 -right-1 font-serif text-8xl font-bold
                             text-stone-100 dark:text-stone-800 select-none pointer-events-none
                             leading-none">
              {currentIndex + 1}
            </span>
          )}
          <div className="relative">
            <p className="text-xs uppercase tracking-widest text-amber-600 dark:text-amber-500 font-semibold mb-1">
              {isBonus
                ? t('premium.features.bonus')
                : t('stop.eyebrow', { current: currentIndex + 1, total: displayStops.length })}
            </p>
            <h1 className="font-serif text-2xl font-bold text-stone-900 dark:text-stone-100 leading-tight pr-8">
              {currentStop.title}
            </h1>
          </div>
        </div>

        {/* Illustration — Chapter 1 gets the shared hero slideshow; other chapters use their own image_url if set */}
        {currentStop.order_index === 1 ? (
          <HeroSlideshow images={HERO_SLIDESHOW_IMAGES} />
        ) : currentStop.image_url ? (
          <img
            src={currentStop.image_url}
            alt={isBonus ? currentStop.title : t('stop.illustrationAlt', { number: currentIndex + 1 })}
            className="w-full rounded-2xl aspect-video object-cover"
          />
        ) : null}

        {/* Shared audio element — must stay mounted even while the full card
            is hidden, otherwise playback would stop */}
        {player.audioElement}
        {/* Full card only until playback starts; afterwards the sticky mini
            player takes over as the single visible control */}
        {!showMiniPlayer && (
          <AudioPlayer src={currentStop.audio_url ?? ''} title={audioTitle} player={player} />
        )}

        {/* Description — whitespace-pre-line so multi-paragraph localized texts keep their breaks */}
        <p className="text-stone-700 dark:text-stone-300 leading-relaxed text-base whitespace-pre-line">
          {currentStop.description}
        </p>

        {/* Photos CTA */}
        <button
          onClick={() => setIsGalleryOpen(true)}
          className="flex items-center justify-center gap-2 w-full
                     bg-white dark:bg-stone-900
                     hover:bg-stone-50 dark:hover:bg-stone-800
                     border border-stone-200 dark:border-stone-700
                     text-stone-700 dark:text-stone-200
                     font-semibold py-3.5 rounded-2xl transition-colors"
        >
          <svg className="w-5 h-5 text-stone-400 dark:text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M14 8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {t('stop.photosButton')}
        </button>

        {/* Navigation button */}
        <button
          onClick={isBonus ? () => navigate('/premium', { state: { stops } }) : isLastStop ? handleFinish : handleNext}
          className="w-full bg-amber-600 hover:bg-amber-700 active:bg-amber-800
                     text-white font-semibold text-lg py-4 rounded-2xl
                     transition-colors shadow-md shadow-amber-200 dark:shadow-amber-900/20"
        >
          {isBonus ? t('premium.title') : isLastStop ? t('stop.finishButton') : t('stop.nextButton')}
        </button>

        {/* Mini dot navigator */}
        {!isBonus && <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
          <p className="text-xs text-stone-400 dark:text-stone-500 mb-2 text-center">
            {t('stop.jumpToStop')}
          </p>
          <div className="flex justify-center gap-2.5">
            {displayStops.map((s, i) => {
              const locked = isStopLocked(s, unlocked)
              return (
                <button
                  key={s.id}
                  onClick={() => goToStopGated(s)}
                  className={`transition-all duration-200 rounded-full font-semibold text-sm
                              w-9 h-9 flex items-center justify-center ${
                    s.id === id
                      ? 'bg-amber-500 text-white shadow-sm shadow-amber-200 dark:shadow-amber-900/30'
                      : i < currentIndex
                      ? 'bg-stone-300 dark:bg-stone-600 text-white'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500 hover:bg-stone-200 dark:hover:bg-stone-700'
                  }`}
                  aria-label={t('stop.jumpToLabel', { number: i + 1, title: s.title })}
                  aria-current={s.id === id ? 'step' : undefined}
                >
                  {locked ? <DotLockIcon /> : i < currentIndex ? '✓' : i + 1}
                </button>
              )
            })}
          </div>
        </div>}
      </div>

      {showMiniPlayer && <MiniAudioPlayer player={player} title={audioTitle} />}

      <ArrivalGalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        images={PNYX_GALLERY_IMAGES}
        streetViewUrl={STREET_VIEW_URL}
      />
    </Layout>
  )
}

function DotLockIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  )
}
