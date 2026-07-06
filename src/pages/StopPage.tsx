import { useEffect, useState } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from '@/components/Layout'
import AudioPlayer from '@/components/AudioPlayer'
import ArrivalGalleryModal from '@/components/ArrivalGalleryModal'
import DonationModal from '@/components/DonationModal'
import HeroSlideshow from '@/components/HeroSlideshow'
import { supabase } from '@/lib/supabaseClient'
import { track } from '@/lib/analytics'
import { withTimeout } from '@/lib/withTimeout'
import { STREET_VIEW_URL } from '@/lib/constants'
import { PNYX_GALLERY_IMAGES } from '@/data/pnyxImages'
import { HERO_SLIDESHOW_IMAGES } from '@/data/heroSlideshowImages'
import { useFallbackStops } from '@/data/fallbackStops'
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
  // Where to continue after the donation modal closes; non-null = modal open
  const [donationTargetStop, setDonationTargetStop] = useState<Stop | null>(null)

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

  const currentStop = stops.find((s) => s.id === id)
  const currentIndex = stops.findIndex((s) => s.id === id)
  const isLastStop = currentIndex === stops.length - 1
  const nextStop = stops[currentIndex + 1]

  useEffect(() => {
    if (!id || !currentStop) return
    void track('stop_opened', `/stop/${id}`, { stop_id: id })
  }, [id, currentStop])

  const goToStop = (stop: Stop) => {
    navigate(`/stop/${stop.id}`, { state: { stops } })
  }

  // Every way of leaving chapter 1 (Next button or dot navigator) first
  // offers a donation; closing the modal continues to the chosen chapter.
  const goToStopWithDonationPrompt = (target: Stop) => {
    if (currentIndex === 0 && target.id !== id) {
      void track('donation_prompt_shown', `/stop/${id}`, { stop_id: id })
      setDonationTargetStop(target)
      return
    }
    goToStop(target)
  }

  const handleNext = () => {
    if (!nextStop) return
    goToStopWithDonationPrompt(nextStop)
  }

  const handleDonationClose = () => {
    const target = donationTargetStop
    setDonationTargetStop(null)
    if (target) goToStop(target)
  }

  const handleFinish = () => {
    void track('walk_completed', `/stop/${id}`, { stop_id: id })
    navigate('/finish', { state: { stops } })
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    )
  }

  if (!currentStop) {
    return (
      <Layout>
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
    <Layout showProgress currentStop={currentIndex + 1} totalStops={stops.length}>
      <div className="space-y-5">
        {/* Stop header with decorative number */}
        <div className="relative">
          <span className="absolute -top-1 -right-1 font-serif text-8xl font-bold
                           text-stone-100 dark:text-stone-800 select-none pointer-events-none
                           leading-none">
            {currentIndex + 1}
          </span>
          <div className="relative">
            <p className="text-xs uppercase tracking-widest text-amber-600 dark:text-amber-500 font-semibold mb-1">
              {t('stop.eyebrow', { current: currentIndex + 1, total: stops.length })}
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
            alt={t('stop.illustrationAlt', { number: currentIndex + 1 })}
            className="w-full rounded-2xl aspect-video object-cover"
          />
        ) : null}

        {/* Audio player */}
        <AudioPlayer
          src={currentStop.audio_url ?? ''}
          title={t('stop.audioTitle', { number: currentIndex + 1, title: currentStop.title })}
          onPlay={() =>
            void track('stop_audio_started', `/stop/${currentStop.id}`, { stop_id: currentStop.id })
          }
          onEnded={() =>
            void track('stop_completed', `/stop/${currentStop.id}`, { stop_id: currentStop.id })
          }
        />

        {/* Description */}
        <p className="text-stone-700 dark:text-stone-300 leading-relaxed text-base">
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
          onClick={isLastStop ? handleFinish : handleNext}
          className="w-full bg-amber-600 hover:bg-amber-700 active:bg-amber-800
                     text-white font-semibold text-lg py-4 rounded-2xl
                     transition-colors shadow-md shadow-amber-200 dark:shadow-amber-900/20"
        >
          {isLastStop ? t('stop.finishButton') : t('stop.nextButton')}
        </button>

        {/* Mini dot navigator */}
        <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
          <p className="text-xs text-stone-400 dark:text-stone-500 mb-2 text-center">
            {t('stop.jumpToStop')}
          </p>
          <div className="flex justify-center gap-2.5">
            {stops.map((s, i) => (
              <button
                key={s.id}
                onClick={() => goToStopWithDonationPrompt(s)}
                className={`transition-all duration-200 rounded-full font-semibold text-sm ${
                  s.id === id
                    ? 'w-9 h-9 bg-amber-500 text-white shadow-sm shadow-amber-200 dark:shadow-amber-900/30'
                    : i < currentIndex
                    ? 'w-9 h-9 bg-stone-300 dark:bg-stone-600 text-white'
                    : 'w-9 h-9 bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500 hover:bg-stone-200 dark:hover:bg-stone-700'
                }`}
                aria-label={t('stop.jumpToLabel', { number: i + 1, title: s.title })}
                aria-current={s.id === id ? 'step' : undefined}
              >
                {i < currentIndex ? '✓' : i + 1}
              </button>
            ))}
          </div>
        </div>
      </div>

      <ArrivalGalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        images={PNYX_GALLERY_IMAGES}
        streetViewUrl={STREET_VIEW_URL}
      />

      <DonationModal isOpen={donationTargetStop !== null} onClose={handleDonationClose} />
    </Layout>
  )
}
