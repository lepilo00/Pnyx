import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from '@/components/Layout'
import ListeningPlayer from '@/components/ListeningPlayer'
import StorySelectorSheet from '@/components/StorySelectorSheet'
import StorySectionList from '@/components/StorySectionList'
import ArrivalGalleryModal from '@/components/ArrivalGalleryModal'
import HeroSlideshow from '@/components/HeroSlideshow'
import { supabase } from '@/lib/supabaseClient'
import { track } from '@/lib/analytics'
import { withTimeout } from '@/lib/withTimeout'
import { useLocalizedStops } from '@/lib/useLocalizedStops'
import { useAudioPlayer } from '@/hooks/useAudioPlayer'
import { useMediaSession } from '@/hooks/useMediaSession'
import { getStoryProgress, saveAutoPlay, savePlaybackRate, saveStoryProgress, useListeningProgress } from '@/lib/audioProgress'
import { STREET_VIEW_URL } from '@/lib/constants'
import { PNYX_GALLERY_IMAGES } from '@/data/pnyxImages'
import { HERO_SLIDESHOW_IMAGES } from '@/data/heroSlideshowImages'
import { useFallbackStops } from '@/data/fallbackStops'
import { isStopLocked, useEntitlements } from '@/lib/entitlements'
import type { Stop, Walk } from '@/lib/types'
import { getStoryArtwork } from '@/lib/storyArtwork'
import { getAdjacentStory, groupStories, isBonusStory, orderStories } from '@/lib/storyGroups'

const FALLBACK_ARTWORK = '/pnyx-uvodna-zadnja.png'

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
  const [isCondensed, setIsCondensed] = useState(false)
  const [detailsStoryId, setDetailsStoryId] = useState<string | null>(null)
  const lastPeriodicSave = useRef(0)
  const pendingAutoplayId = useRef<string | null>(null)
  const heroSentinelRef = useRef<HTMLDivElement | null>(null)

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
  const orderedStories = orderStories(stories)
  const currentStory = stories.find((story) => story.id === id)
  useEffect(() => {
    const walkId = currentStory?.walk_id
    if (walkId && walk?.id !== walkId) void supabase.from('walks').select('*').eq('id', walkId).maybeSingle().then(({ data }) => setWalk(data as Walk | null))
  }, [currentStory?.walk_id, walk?.id])

  const displayMode = walk?.display_mode === 'playlist' ? 'playlist' : 'stops'
  const isLocked = useCallback((story: Stop) => isStopLocked(story, unlocked), [unlocked])
  const currentSequence = currentStory && isBonusStory(currentStory) ? bonusStories : mainStories
  const currentIndex = currentSequence.findIndex((story) => story.id === id)
  const previousStory = currentIndex > 0 ? currentSequence[currentIndex - 1] : undefined
  const nextStory = currentIndex >= 0 ? currentSequence[currentIndex + 1] : undefined
  const saved = id ? getStoryProgress(id) : undefined
  const autoPlayEnabled = listeningProgress.autoPlay

  const player = useAudioPlayer(currentStory?.audio_url ?? '', {
    initialPosition: saved?.position ?? 0,
    initialPlaybackRate: listeningProgress.playbackRate,
    onPlay: () => { if (id) void track('stop_audio_started', `/stop/${id}`, { stop_id: id }) },
    onPause: (position, duration) => { if (id) saveStoryProgress(id, position, duration) },
    onEnded: (duration) => {
      if (!id) return
      saveStoryProgress(id, duration, duration, true)
      void track('stop_completed', `/stop/${id}`, { stop_id: id })
      if (displayMode === 'playlist' && autoPlayEnabled) {
        const next = getAdjacentStory(orderedStories, id, 1, isLocked)
        if (next) {
          pendingAutoplayId.current = next.id
          navigate(`/stop/${next.id}`, { state: { stops } })
        }
      }
    },
  })

  // Auto-play continuation: once the next story's audio is mounted, start it.
  useEffect(() => {
    if (!id || pendingAutoplayId.current !== id) return
    if (!player.hasAudio || player.hasStarted || player.isPlaying) return
    pendingAutoplayId.current = null
    void player.togglePlay()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, player.hasAudio, player.hasStarted, player.isPlaying])

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
    if (isLocked(story)) {
      navigate('/premium', { state: { fromStopId: story.id, stops } })
      return
    }
    navigate(`/stop/${story.id}`, { state: { stops } })
  }

  // A playlist card acts as a playback control as well as navigation.
  const selectAndPlayStory = (story: Stop) => {
    if (isLocked(story)) {
      selectStory(story)
      return
    }
    if (story.id === id) {
      if (!player.isPlaying) void player.togglePlay()
      return
    }
    pendingAutoplayId.current = story.id
    selectStory(story)
  }

  // Deep links + auto-play transitions: keep the active card visible in the
  // playlist, accounting for reduced-motion preferences. Cards carry
  // scroll-mt-24 so the condensed sticky bar never covers them.
  useEffect(() => {
    if (displayMode !== 'playlist' || !id || isLoading) return
    const frame = requestAnimationFrame(() => {
      const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
      document.getElementById(`story-${id}`)?.scrollIntoView({ block: 'center', behavior })
    })
    return () => cancelAnimationFrame(frame)
  }, [displayMode, id, isLoading])

  // Condensed sticky bar: appears once the hero scrolls out of view.
  // IntersectionObserver on a sentinel — no scroll listeners, no jank.
  useEffect(() => {
    if (displayMode !== 'playlist' || isLoading) return
    const sentinel = heroSentinelRef.current
    if (!sentinel || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      ([entry]) => setIsCondensed(!entry.isIntersecting),
      { rootMargin: '-8px 0px 0px 0px' }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [displayMode, isLoading])

  const localizedWalk = walk?.localized_content?.[i18n.language]
  const guideTitle = localizedWalk?.title || walk?.title || t('listening.guideTitle')
  const guideLocation = walk?.location_name || t('listening.location')
  const currentArtwork = currentStory ? getStoryArtwork(currentStory, stories) : undefined

  // Lock-screen next/previous mirror the on-page order and always skip locked
  // stories (a lock-screen tap must never land on the paywall).
  const mediaSequence = displayMode === 'playlist' ? orderedStories : currentSequence
  const mediaNext = currentStory ? getAdjacentStory(mediaSequence, currentStory.id, 1, isLocked) : undefined
  const mediaPrevious = currentStory ? getAdjacentStory(mediaSequence, currentStory.id, -1, isLocked) : undefined
  useMediaSession({
    player,
    title: currentStory?.title ?? guideTitle,
    artist: guideTitle,
    artworkUrl: currentArtwork ?? FALLBACK_ARTWORK,
    onNext: mediaNext ? () => selectStory(mediaNext) : undefined,
    onPrevious: mediaPrevious ? () => selectStory(mediaPrevious) : undefined,
  })

  if (isLoading) return <Layout showBack><div className="flex justify-center py-24"><div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" /></div></Layout>
  if (currentStory && isLocked(currentStory)) return <Navigate to="/premium" replace state={{ fromStopId: currentStory.id, stops }} />
  if (!currentStory) return <Layout showBack><div className="py-24 text-center text-stone-500">{t('stop.notFound')}</div></Layout>

  if (displayMode === 'playlist') {
    const listenedCount = orderedStories.filter((story) => listeningProgress.stories[story.id]?.completed).length
    const totalMinutes = Math.ceil(orderedStories.reduce((sum, story) => sum + (story.duration_seconds ?? 0), 0) / 60) || 15
    const listenedPercent = orderedStories.length ? (listenedCount / orderedStories.length) * 100 : 0
    // Bonus stories are optional and locked stories are unplayable — the
    // feedback banner appears once every playable main-walk story is done.
    const playableMainStories = mainStories.filter((story) => !isLocked(story))
    const isMainWalkCompleted = playableMainStories.length > 0 && playableMainStories.every((story) => listeningProgress.stories[story.id]?.completed)

    return (
      <Layout showBack>
        {/* Condensed sticky bar — fades in once the hero scrolls away. */}
        <div
          aria-hidden={!isCondensed}
          className={`fixed inset-x-0 top-[61px] z-20 px-4 transition-[opacity,transform] duration-200 motion-reduce:transition-none ${isCondensed ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-3 opacity-0'}`}
        >
          <div className="relative mx-auto flex h-12 max-w-lg items-center gap-2.5 overflow-hidden rounded-b-xl border border-t-0 border-navy-700 bg-navy-950/95 px-4 shadow-lg shadow-navy-950/30 backdrop-blur">
            <p className="min-w-0 flex-1 truncate font-serif text-sm font-bold text-parchment-50">{guideTitle}</p>
            <span className="shrink-0 text-[11px] font-semibold tabular-nums text-amber-400">{listenedCount}/{orderedStories.length}</span>
            <button
              role="switch"
              aria-checked={autoPlayEnabled}
              aria-label={t('listening.autoPlay')}
              onClick={() => saveAutoPlay(!autoPlayEnabled)}
              className="group flex h-10 shrink-0 items-center gap-1.5 rounded-lg px-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              <span className="hidden text-[9px] font-bold uppercase tracking-wide text-stone-300 min-[390px]:inline">Auto</span>
              <span className={`relative h-5 w-9 rounded-full transition-colors motion-reduce:transition-none ${autoPlayEnabled ? 'bg-amber-500' : 'bg-white/25'}`}>
                <span className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-white shadow-sm transition-[left] motion-reduce:transition-none ${autoPlayEnabled ? 'left-[1.125rem]' : 'left-0.5'}`} aria-hidden="true" />
              </span>
            </button>
            <span className="absolute inset-x-0 bottom-0 h-0.5 bg-white/10" aria-hidden="true">
              <span className="block h-full bg-amber-500" style={{ width: `${listenedPercent}%` }} />
            </span>
          </div>
        </div>

        <div className="-mt-2 pb-48">
          {player.audioElement}

          {/* Hero */}
          <header className="-mx-2 rounded-2xl border border-navy-700 bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 px-5 py-3.5 shadow-lg shadow-navy-950/20">
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-amber-400">{guideLocation} · {orderedStories.length} {t('listening.stories')} · {totalMinutes} {t('listening.minutes')}</p>
            <h1 className="mt-0.5 font-serif text-[1.5rem] font-bold leading-tight text-parchment-50">{guideTitle}</h1>
            <div className="mt-2.5 flex items-center gap-2.5">
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/15" role="progressbar" aria-valuemin={0} aria-valuemax={orderedStories.length} aria-valuenow={listenedCount} aria-label={t('listening.listenedProgress', { completed: listenedCount, total: orderedStories.length })}>
                <div className="h-full bg-amber-500 transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${listenedPercent}%` }} />
              </div>
              <span className="shrink-0 text-[9px] font-semibold tabular-nums text-stone-300">{listenedCount}/{orderedStories.length}</span>
              <button
                role="switch"
                aria-checked={autoPlayEnabled}
                aria-label={t('listening.autoPlay')}
                onClick={() => saveAutoPlay(!autoPlayEnabled)}
                className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg pl-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              >
                <span className="hidden text-[9px] font-semibold text-stone-300 min-[360px]:inline">{t('listening.autoPlay')}</span>
                <span className={`relative h-5 w-9 rounded-full transition-colors motion-reduce:transition-none ${autoPlayEnabled ? 'bg-amber-500' : 'bg-white/25'}`}>
                  <span className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-white shadow transition-[left] motion-reduce:transition-none ${autoPlayEnabled ? 'left-[1.125rem]' : 'left-0.5'}`} aria-hidden="true" />
                </span>
              </button>
            </div>
          </header>
          <div ref={heroSentinelRef} aria-hidden="true" className="h-px" />

          {isMainWalkCompleted && (
            <Link
              to="/finish"
              state={{ stops }}
              className="mt-4 flex min-h-14 items-center gap-3 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3
                         transition-colors hover:bg-emerald-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600
                         dark:border-emerald-800 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white" aria-hidden="true">
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M4 10l4 4 8-8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-emerald-900 dark:text-emerald-200">{t('listening.walkCompleted')}</span>
                <span className="block text-xs text-emerald-800/80 dark:text-emerald-300/80">{t('listening.feedbackPrompt')}</span>
              </span>
              <span className="text-emerald-700 dark:text-emerald-400" aria-hidden="true">→</span>
            </Link>
          )}

          <div className="playlist-stagger -mx-3 pt-1">
            <StorySectionList
              stories={stories}
              currentId={id}
              progress={listeningProgress.stories}
              isLocked={isLocked}
              onSelect={selectAndPlayStory}
              showSectionCounts={false}
              tone="premium"
              playingId={player.isPlaying ? id : undefined}
              detailsOpenId={detailsStoryId ?? undefined}
              onToggleDetails={(story) => setDetailsStoryId((current) => (current === story.id ? null : story.id))}
              renderAfterItem={(story) =>
                story.id === currentStory.id ? (
                  <PlaylistStoryDetails story={currentStory} open={detailsStoryId === story.id} onOpenGallery={() => setGalleryOpen(true)} />
                ) : null
              }
            />
          </div>
        </div>

        <ListeningPlayer
          player={player}
          title={currentStory.title}
          artworkUrl={currentArtwork ?? undefined}
          variant="premium"
          onPrevious={mediaPrevious ? () => selectStory(mediaPrevious) : undefined}
          onNext={mediaNext ? () => selectStory(mediaNext) : undefined}
        />
        <ArrivalGalleryModal isOpen={galleryOpen} onClose={() => setGalleryOpen(false)} images={PNYX_GALLERY_IMAGES} streetViewUrl={STREET_VIEW_URL} />
      </Layout>
    )
  }

  const isBonus = isBonusStory(currentStory)
  const totalMinutes = Math.ceil(currentSequence.reduce((sum, story) => sum + (story.duration_seconds ?? 0), 0) / 60) || 15
  const currentPosition = currentIndex + 1
  const overall = currentSequence.length ? Math.min(100, currentPosition / currentSequence.length * 100) : 0

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
      <StorySelectorSheet open={selectorOpen} stories={stories} currentId={currentStory.id} guideTitle={guideTitle} progress={listeningProgress.stories} isLocked={isLocked} onSelect={selectStory} onClose={closeSelector} />
      <ArrivalGalleryModal isOpen={galleryOpen} onClose={() => setGalleryOpen(false)} images={PNYX_GALLERY_IMAGES} streetViewUrl={STREET_VIEW_URL} />
    </Layout>
  )
}

// Inline details for the active playlist story: subtitle, text, transcript and
// the photo gallery — the same content the stops view shows, minus
// previous/next navigation. Controlled by the card's chevron; expands with a
// cheap grid-rows transition (no layout thrash, reduced-motion aware).
function PlaylistStoryDetails({ story, open, onOpenGallery }: { story: Stop; open: boolean; onOpenGallery: () => void }) {
  const { t } = useTranslation()

  return (
    <div
      className={`grid px-3 transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
      aria-hidden={!open}
    >
      <div className="overflow-hidden">
        <div className="pb-4 pt-3">
          {story.subtitle && <p className="text-sm font-medium text-stone-600 dark:text-stone-300">{story.subtitle}</p>}
          <p className="mt-2 whitespace-pre-line text-sm leading-6 text-stone-700 dark:text-stone-300">{story.description}</p>
          {story.transcript && (
            <section className="mt-4 border-t border-amber-200/70 pt-3 dark:border-stone-700">
              <h4 className="font-serif text-base font-bold text-navy-900 dark:text-stone-50">{t('listening.transcript')}</h4>
              <div className="mt-2 whitespace-pre-line text-sm leading-6 text-stone-700 dark:text-stone-300">{story.transcript}</div>
            </section>
          )}
          <button onClick={onOpenGallery} tabIndex={open ? 0 : -1} className="mt-4 min-h-11 w-full border-y border-amber-200 text-sm font-bold text-navy-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 dark:border-stone-700 dark:text-stone-100">{t('stop.photosButton')}</button>
        </div>
      </div>
    </div>
  )
}
