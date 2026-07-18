import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from '@/components/Layout'
import ListeningPlayer from '@/components/ListeningPlayer'
import StorySelectorSheet from '@/components/StorySelectorSheet'
import ArrivalGalleryModal from '@/components/ArrivalGalleryModal'
import HeroSlideshow from '@/components/HeroSlideshow'
import { supabase } from '@/lib/supabaseClient'
import { track } from '@/lib/analytics'
import { withTimeout } from '@/lib/withTimeout'
import { useLocalizedStops } from '@/lib/useLocalizedStops'
import { useAudioPlayer } from '@/hooks/useAudioPlayer'
import { getStoryProgress, savePlaybackRate, saveStoryProgress, useListeningProgress } from '@/lib/audioProgress'
import { STREET_VIEW_URL } from '@/lib/constants'
import { PNYX_GALLERY_IMAGES } from '@/data/pnyxImages'
import { HERO_SLIDESHOW_IMAGES } from '@/data/heroSlideshowImages'
import { useFallbackStops } from '@/data/fallbackStops'
import { isStopLocked, useEntitlements } from '@/lib/entitlements'
import type { Stop, Walk } from '@/lib/types'
import { getStoryArtwork } from '@/lib/storyArtwork'
import { groupStories, isBonusStory } from '@/lib/storyGroups'

export default function StopPage() {
  const { t, i18n } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const fallbackStops = useFallbackStops()
  const { unlocked } = useEntitlements()
  const listeningProgress = useListeningProgress()
  const [stops, setStops] = useState<Stop[]>((location.state as { stops?: Stop[] } | null)?.stops ?? [])
  const [isLoading, setIsLoading] = useState(stops.length === 0)
  const [selectorOpen, setSelectorOpen] = useState(false)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [walk, setWalk] = useState<Walk | null>(null)
  const lastPeriodicSave = useRef(0)

  useEffect(() => {
    if (stops.length) return
    async function loadStops() {
      const result = await withTimeout(supabase.from('stops').select('*').eq('is_published', true).order('order_index'), 3000)
      setStops(result?.error || !result?.data?.length ? fallbackStops : result.data as Stop[])
      setIsLoading(false)
    }
    void loadStops()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stops.length, i18n.language])

  const stories = useLocalizedStops(stops)
  const { mainStories, bonusStories } = groupStories(stories)
  const currentStory = stories.find((story) => story.id === id)
  useEffect(() => {
    const walkId = currentStory?.walk_id
    if (walkId && walk?.id !== walkId) void supabase.from('walks').select('*').eq('id', walkId).maybeSingle().then(({ data }) => setWalk(data as Walk | null))
  }, [currentStory?.walk_id, walk?.id])
  const currentSequence = currentStory && isBonusStory(currentStory) ? bonusStories : mainStories
  const currentIndex = currentSequence.findIndex((story) => story.id === id)
  const previousStory = currentIndex > 0 ? currentSequence[currentIndex - 1] : undefined
  const nextStory = currentIndex >= 0 ? currentSequence[currentIndex + 1] : undefined
  const saved = id ? getStoryProgress(id) : undefined

  const player = useAudioPlayer(currentStory?.audio_url ?? '', {
    initialPosition: saved?.position ?? 0,
    initialPlaybackRate: listeningProgress.playbackRate,
    onPlay: () => { if (id) void track('stop_audio_started', `/stop/${id}`, { stop_id: id }) },
    onPause: (position, duration) => { if (id) saveStoryProgress(id, position, duration) },
    onEnded: (duration) => {
      if (id) saveStoryProgress(id, duration, duration, true)
      if (id) void track('stop_completed', `/stop/${id}`, { stop_id: id })
    },
  })

  useEffect(() => {
    if (!id || !player.isPlaying || player.currentTime - lastPeriodicSave.current < 10) return
    lastPeriodicSave.current = player.currentTime
    saveStoryProgress(id, player.currentTime, player.duration)
  }, [id, player.currentTime, player.duration, player.isPlaying])

  useEffect(() => { savePlaybackRate(player.playbackRate) }, [player.playbackRate])
  useEffect(() => { if (id && currentStory) void track('stop_opened', `/stop/${id}`, { stop_id: id }) }, [id, currentStory])

  const closeSelector = useCallback(() => setSelectorOpen(false), [])
  const selectStory = (story: Stop) => {
    if (id) saveStoryProgress(id, player.currentTime, player.duration, player.hasCompleted)
    setSelectorOpen(false)
    if (isStopLocked(story, unlocked)) {
      navigate('/premium', { state: { fromStopId: story.id, stops } })
      return
    }
    navigate(`/stop/${story.id}`, { state: { stops } })
  }

  if (isLoading) return <Layout showBack><div className="flex justify-center py-24"><div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" /></div></Layout>
  if (currentStory && isStopLocked(currentStory, unlocked)) return <Navigate to="/premium" replace state={{ fromStopId: currentStory.id, stops }} />
  if (!currentStory) return <Layout showBack><div className="py-24 text-center text-stone-500">{t('stop.notFound')}</div></Layout>

  const isBonus = isBonusStory(currentStory)
  const totalMinutes = Math.ceil(currentSequence.reduce((sum, story) => sum + (story.duration_seconds ?? 0), 0) / 60) || 15
  const currentPosition = currentIndex + 1
  const overall = currentSequence.length ? Math.min(100, currentPosition / currentSequence.length * 100) : 0
  const currentArtwork = getStoryArtwork(currentStory, stories)
  const localizedWalk = walk?.localized_content?.[i18n.language]
  const guideTitle = localizedWalk?.title || walk?.title || t('listening.guideTitle')
  const guideLocation = walk?.location_name || t('listening.location')

  return (
    <Layout showBack>
      <div className="-mt-2 pb-44">
        {player.audioElement}
        <header className="border-b border-amber-200/70 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700">{isBonus ? t('listening.bonus') : guideLocation} · {currentSequence.length} {t('listening.stories')} · {totalMinutes} {t('listening.minutes')}</p><h1 className="mt-1 font-serif text-2xl font-bold text-navy-900 dark:text-stone-50">{isBonus ? (localizedWalk?.bonus_section_title || walk?.bonus_section_title || t('listening.bonusStories')) : guideTitle}</h1></div>
            <button onClick={() => setSelectorOpen(true)} className="min-h-11 shrink-0 rounded-full border border-amber-400 px-4 text-xs font-bold text-amber-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 dark:text-amber-400">{t('listening.allStories')}</button>
          </div>
          <div className="mt-3 flex items-center gap-3"><div className="h-1 flex-1 overflow-hidden rounded-full bg-parchment-200 dark:bg-stone-700" role="progressbar" aria-valuemin={1} aria-valuemax={currentSequence.length} aria-valuenow={currentPosition}><div className="h-full bg-amber-600 transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${overall}%` }} /></div><span className="text-[10px] font-semibold tabular-nums text-stone-500">{currentPosition}/{currentSequence.length}</span></div>
        </header>

        <main className="pt-5">
          {currentStory.story_type === 'introduction' ? <HeroSlideshow images={HERO_SLIDESHOW_IMAGES} /> : currentArtwork ? <img src={currentArtwork} alt={currentStory.title} className="aspect-[4/3] w-full object-cover shadow-sm" /> : null}
          <div className="pt-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-amber-700">{currentStory.story_type === 'bonus' ? t('listening.bonusStory') : t('listening.audioStory')}</p>
            <h2 className="mt-2 font-serif text-[2rem] font-bold leading-[1.08] text-navy-900 dark:text-stone-50">{currentStory.title}</h2>
            {currentStory.subtitle && <p className="mt-2 text-base font-medium text-stone-600 dark:text-stone-300">{currentStory.subtitle}</p>}
            <p className="mt-5 whitespace-pre-line text-[15px] leading-7 text-stone-700 dark:text-stone-300">{currentStory.description}</p>
            {currentStory.transcript && <section className="mt-8 border-t border-amber-200 pt-6"><h3 className="font-serif text-xl font-bold text-navy-900 dark:text-stone-50">{t('listening.transcript')}</h3><div className="mt-3 whitespace-pre-line text-[15px] leading-7 text-stone-700 dark:text-stone-300">{currentStory.transcript}</div></section>}
          </div>

          <button onClick={() => setGalleryOpen(true)} className="mt-7 min-h-12 w-full border-y border-amber-200 text-sm font-bold text-navy-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 dark:text-stone-100">{t('stop.photosButton')}</button>
          <nav className="mt-7 grid grid-cols-2 gap-3" aria-label="Story navigation">
            <button onClick={() => previousStory && selectStory(previousStory)} disabled={!previousStory} className="min-h-14 border border-amber-300 px-3 text-left text-sm font-semibold text-navy-900 disabled:opacity-30 dark:text-stone-100">← {t('listening.previous')}</button>
            <button onClick={() => nextStory ? selectStory(nextStory) : navigate('/finish', { state: { stops } })} className="min-h-14 bg-amber-600 px-3 text-right text-sm font-semibold text-white">{nextStory ? `${t('listening.next')} →` : isBonus ? t('listening.finishDiscovery') : t('stop.finishButton')}</button>
          </nav>
        </main>
      </div>

      <ListeningPlayer player={player} title={currentStory.title} onPrevious={previousStory ? () => selectStory(previousStory) : undefined} onNext={nextStory ? () => selectStory(nextStory) : undefined} />
      <StorySelectorSheet open={selectorOpen} stories={stories} currentId={currentStory.id} guideTitle={guideTitle} progress={listeningProgress.stories} isLocked={(story) => isStopLocked(story, unlocked)} onSelect={selectStory} onClose={closeSelector} />
      <ArrivalGalleryModal isOpen={galleryOpen} onClose={() => setGalleryOpen(false)} images={PNYX_GALLERY_IMAGES} streetViewUrl={STREET_VIEW_URL} />
    </Layout>
  )
}
