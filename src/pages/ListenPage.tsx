import { Component, lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode, RefObject } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from '@/components/Layout'
import { useAudioPlayer, formatTime } from '@/hooks/useAudioPlayer'
import { useFallbackStops } from '@/data/fallbackStops'
import { useLocalizedStops } from '@/lib/useLocalizedStops'
import { supabase } from '@/lib/supabaseClient'
import { withTimeout } from '@/lib/withTimeout'
import { groupStories } from '@/lib/storyGroups'
import { getBonusStoryArtwork } from '@/lib/storyArtwork'
import { getStoryProgress, saveStoryProgress, useListeningProgress } from '@/lib/audioProgress'
import type { StoryProgress } from '@/lib/audioProgress'
import { DONATION, GOOGLE_MAPS_DIRECTIONS_URL } from '@/lib/constants'
import { track } from '@/lib/analytics'
import type { Stop } from '@/lib/types'
import './ListenPage.css'

const STORY_ARTWORK_BY_ORDER: Readonly<Record<number, string>> = {
  1: '/version2/ChatGPT Image 28. jul. 2026, 19_58_57 (1).png',
  2: '/version2/ChatGPT Image 28. jul. 2026, 19_58_57 (2).png',
  3: '/version2/ChatGPT Image 28. jul. 2026, 19_58_57 (3).png',
  4: '/premium/chapter-1.png',
  5: '/premium/chapter-2.png',
  6: '/premium/chapter-3.png',
  7: '/premium/chapter-4.png',
}

const SUPPORTED_STORY_TYPES = new Set(['introduction', 'main', 'bonus'])
const DONATION_BANNER_DISMISSED_KEY = 'pnyx:listen:donation-banner-dismissed'
const DonationQrPanel = lazy(() => import('@/components/DonationQrPanel'))

function readDonationBannerDismissed(): boolean {
  try { return sessionStorage.getItem(DONATION_BANNER_DISMISSED_KEY) === '1' } catch { return false }
}

function persistDonationBannerDismissed(): void {
  try { sessionStorage.setItem(DONATION_BANNER_DISMISSED_KEY, '1') } catch { /* component state remains the fallback */ }
}

function isUsableFreeStory(story: Stop): boolean {
  return story.is_published && story.is_paid !== true && Boolean(
    story.story_type && SUPPORTED_STORY_TYPES.has(story.story_type) && story.title.trim() && story.audio_url?.trim()
  )
}

function entrySource(): string {
  try { return document.referrer ? new URL(document.referrer).origin : 'direct' } catch { return 'unknown' }
}

function deviceCategory(): string {
  if (window.matchMedia('(max-width: 639px)').matches) return 'mobile'
  if (window.matchMedia('(max-width: 1023px)').matches) return 'tablet'
  return 'desktop'
}

export default function ListenPage() {
  const { t, i18n } = useTranslation()
  const fallback = useFallbackStops()
  const progress = useListeningProgress()
  const [stories, setStories] = useState<Stop[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [selectedId, setSelectedId] = useState<string>()
  const [playerRevealed, setPlayerRevealed] = useState(false)
  const [donationPanelOpen, setDonationPanelOpen] = useState(false)
  const [donationBannerDismissed, setDonationBannerDismissed] = useState(readDonationBannerDismissed)
  const shouldPlay = useRef(false)
  const milestones = useRef(new Set<string>())
  const lastPersistedSecond = useRef(-1)
  const previousLanguage = useRef(i18n.language)
  const completionState = useRef<{ initialized: boolean; complete: boolean }>({ initialized: false, complete: false })
  const donationPromptTracked = useRef(false)
  const donationSectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    void track('listen_page_view', '/listen', {
      metadata: { language: i18n.language, device: deviceCategory(), entry_source: entrySource() },
    })
    // Page view is deliberately once per mounted visit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (previousLanguage.current === i18n.language) return
    previousLanguage.current = i18n.language
    void track('language_selected', '/listen', { metadata: { language: i18n.language } })
  }, [i18n.language])

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      setError(false)
      const result = await withTimeout(
        supabase.from('stops').select('*').eq('is_published', true).eq('is_paid', false).order('order_index'),
        3000
      )
      if (!active) return
      const loadFailed = !result || Boolean(result.error)
      if (loadFailed) setError(true)
      setStories(loadFailed ? fallback : (result.data as Stop[] ?? []))
      setLoading(false)
    }
    void load()
    return () => { active = false }
    // Fallback content changes with the selected locale.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language])

  const localized = useLocalizedStops(stories)
  const playableStories = useMemo(() => localized.filter(isUsableFreeStory), [localized])
  const { mainStories, bonusStories } = useMemo(() => groupStories(playableStories), [playableStories])
  const introStories = useMemo(() => mainStories.filter((story) => story.story_type === 'introduction'), [mainStories])
  const coreStories = useMemo(() => {
    const uniqueIds = new Set<string>()
    return mainStories.filter((story) => {
      if (story.story_type !== 'main' || uniqueIds.has(story.id)) return false
      uniqueIds.add(story.id)
      return true
    })
  }, [mainStories])
  const selected = playableStories.find((story) => story.id === selectedId)
  const selectedProgress = selected ? progress.stories[selected.id] : undefined
  const selectedInitialPosition = selectedProgress?.language && selectedProgress.language !== i18n.language
    ? 0
    : selectedProgress?.position ?? 0
  const allMainStoriesComplete = coreStories.length > 0 && coreStories.every((story) => progress.stories[story.id]?.completed === true)

  const player = useAudioPlayer(selected?.audio_url ?? '', {
    initialPosition: selectedInitialPosition,
    initialPlaybackRate: progress.playbackRate,
    onPlay: () => {
      if (!selected) return
      const metadata = { category: selected.story_type, language: i18n.language }
      void track('stop_audio_started', '/listen', { stop_id: selected.id, metadata })
      if (selected.story_type === 'bonus') void track('bonus_story_started', '/listen', { stop_id: selected.id, metadata })
    },
    onPause: (position, duration) => selected && saveStoryProgress(selected.id, position, duration, getStoryProgress(selected.id)?.completed ?? false, i18n.language),
    onEnded: (duration) => {
      if (!selected) return
      saveStoryProgress(selected.id, duration, duration, true, i18n.language)
      const completionMilestone = `${selected.id}:100`
      if (!milestones.current.has(completionMilestone)) {
        milestones.current.add(completionMilestone)
        void track('listen_milestone', '/listen', { stop_id: selected.id, metadata: { percent: 100, category: selected.story_type, language: i18n.language } })
      }
      void track('stop_completed', '/listen', { stop_id: selected.id, metadata: { category: selected.story_type, language: i18n.language } })
      const sequence = selected.story_type === 'bonus' ? bonusStories : mainStories
      const index = sequence.findIndex((story) => story.id === selected.id)
      const nextStory = index >= 0 ? sequence[index + 1] : undefined
      if (nextStory) play(nextStory)
    },
  })

  useEffect(() => {
    if (!selected || !shouldPlay.current) return
    shouldPlay.current = false
    const timer = window.setTimeout(() => player.togglePlay(), 0)
    return () => window.clearTimeout(timer)
  }, [selectedId, selected]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!selected || !player.duration || !player.currentTime) return
    const second = Math.floor(player.currentTime)
    if (second - lastPersistedSecond.current >= 5 || second < lastPersistedSecond.current) {
      lastPersistedSecond.current = second
      saveStoryProgress(selected.id, player.currentTime, player.duration, getStoryProgress(selected.id)?.completed ?? false, i18n.language)
    }
    const percent = player.currentTime / player.duration * 100
    for (const mark of [25, 50, 75, 100]) {
      const key = `${selected.id}:${mark}`
      if (percent >= mark && !milestones.current.has(key)) {
        milestones.current.add(key)
        void track('listen_milestone', '/listen', {
          stop_id: selected.id,
          metadata: { percent: mark, category: selected.story_type, language: i18n.language },
        })
      }
    }
  }, [i18n.language, player.currentTime, player.duration, selected])

  useEffect(() => {
    const persistCurrent = () => {
      if (selected && player.duration) saveStoryProgress(selected.id, player.currentTime, player.duration, getStoryProgress(selected.id)?.completed ?? false, i18n.language)
    }
    const onVisibility = () => { if (document.visibilityState === 'hidden') persistCurrent() }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', persistCurrent)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', persistCurrent)
    }
  }, [i18n.language, player.currentTime, player.duration, selected])

  useEffect(() => {
    if (loading || coreStories.length === 0) return
    const previous = completionState.current
    if (!previous.initialized) {
      completionState.current = { initialized: true, complete: allMainStoriesComplete }
      return
    }
    if (!previous.complete && allMainStoriesComplete) {
      void track('all_main_stories_completed', '/listen', { metadata: { total: coreStories.length } })
    }
    completionState.current.complete = allMainStoriesComplete
  }, [allMainStoriesComplete, coreStories.length, loading])

  useEffect(() => {
    if (loading || playableStories.length === 0) return
    if (selectedId && playableStories.some((story) => story.id === selectedId)) return
    const resumable = playableStories.find((story) => story.id === progress.lastStoryId) ?? playableStories[0]
    const timer = window.setTimeout(() => setSelectedId(resumable.id), 0)
    return () => window.clearTimeout(timer)
  }, [loading, playableStories, progress.lastStoryId, selectedId])

  useEffect(() => {
    if (!allMainStoriesComplete || donationBannerDismissed || donationPromptTracked.current) return
    donationPromptTracked.current = true
    void track('donation_prompt_shown', '/listen')
  }, [allMainStoriesComplete, donationBannerDismissed])

  function play(story: Stop) {
    if (!story.audio_url) return
    setPlayerRevealed(true)
    const saved = progress.stories[story.id]
    const recordingChanged = Boolean(saved?.language && saved.language !== i18n.language)
    if (selected && selected.id !== story.id && player.duration) {
      saveStoryProgress(selected.id, player.currentTime, player.duration, getStoryProgress(selected.id)?.completed ?? false, i18n.language)
    }
    saveStoryProgress(story.id, recordingChanged ? 0 : saved?.position ?? 0, recordingChanged ? 0 : saved?.duration ?? 0, saved?.completed ?? false, i18n.language)
    if (selectedId === story.id) {
      player.togglePlay()
    } else {
      lastPersistedSecond.current = -1
      shouldPlay.current = true
      setSelectedId(story.id)
    }
  }

  function dismissDonationBanner() {
    setDonationBannerDismissed(true)
    persistDonationBannerDismissed()
  }

  function showDonationPanel(source: 'banner' | 'inline') {
    setDonationPanelOpen(true)
    dismissDonationBanner()
    void track('donation_clicked', '/listen', { metadata: { source } })
    void track('donation_panel_opened', '/listen', { metadata: { source } })
    if (source !== 'banner') return
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        donationSectionRef.current?.scrollIntoView({
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
          block: 'start',
        })
      })
    })
  }

  const selectedIndex = selected ? playableStories.findIndex((story) => story.id === selected.id) : -1
  const previousStory = selectedIndex > 0 ? playableStories[selectedIndex - 1] : undefined
  const nextStory = selectedIndex >= 0 ? playableStories[selectedIndex + 1] : undefined

  return (
    <Layout showBack headerVariant="listen" contentWidth="wide">
      <div className={`listen-page ${playerRevealed ? 'has-player' : ''}`}>
        <section className="listen-hero" aria-labelledby="listen-title">
          <div className="listen-hero-art" aria-hidden="true" />
          <div className="listen-hero-copy">
            <p className="listen-eyebrow">{t('listen.eyebrow')}</p>
            <h1 id="listen-title">{t('listen.title')}</h1>
            <p className="listen-hero-subtitle">{t('listen.subtitleLine1')}<br />{t('listen.subtitleLine2')}</p>
          </div>
        </section>

        <div className="listen-essentials">
          <div className="listen-meta">
            <span><ClockIcon />{t('listen.meta')}</span>
            <span><GlobeIcon />{t('listen.languages', { count: 10 })}</span>
          </div>
          <a className="listen-location" href={GOOGLE_MAPS_DIRECTIONS_URL} target="_blank" rel="noreferrer" onClick={() => void track('directions_clicked', '/listen')}>
            <PinIcon />
            <span><strong>{t('listen.goToPnyx')}</strong><small>{t('listen.walkFromAcropolis')}</small></span>
            <span className="listen-location-arrow" aria-hidden="true">↗</span>
          </a>
        </div>

        {error && <p className="listen-notice" role="status">{t('listen.offline')}</p>}
        {loading ? <div className="listen-loading">{t('common.loading')}</div> : playableStories.length === 0 ? <div className="listen-empty" role="status"><h2>{t('listen.emptyTitle')}</h2><p>{t('listen.emptyBody')}</p></div> : <>
          <StorySection title={t('listen.introduction')} subtitle={t('listen.introSubtitle')} stories={introStories} allStories={playableStories} selectedId={selectedId} progress={progress.stories} currentDuration={player.duration} isPlaying={player.isPlaying} onPlay={play} />
          <StorySection title={t('listen.mainExperience')} subtitle={t('listen.mainSubtitle')} stories={coreStories} allStories={playableStories} selectedId={selectedId} progress={progress.stories} currentDuration={player.duration} isPlaying={player.isPlaying} onPlay={play} />
          {allMainStoriesComplete && <DonationSection sectionRef={donationSectionRef} donationVisible={donationPanelOpen} onShowDonation={() => showDonationPanel('inline')} />}
          <BonusSection stories={bonusStories} allStories={playableStories} selectedId={selectedId} progress={progress.stories} currentDuration={player.duration} isPlaying={player.isPlaying} onPlay={play} />
          {allMainStoriesComplete && <p className="post-completion-feedback"><Link to="/contact" onClick={() => void track('listen_feedback_clicked', '/listen')}>{t('listen.feedback')}</Link></p>}
        </>}

        {player.audioElement}
        {selected && playerRevealed && <div className="sticky-player" role="region" aria-label={t('listen.player')}>
          <StoryImage className="player-art" story={selected} allStories={playableStories} />
          <div className="player-info"><strong>{selected.title}</strong><span>{formatTime(player.currentTime)} / -{formatTime(Math.max(0, player.duration - player.currentTime))}</span><input type="range" min="0" max={player.duration || 0} value={Math.min(player.currentTime, player.duration || 0)} onChange={(event) => player.seek(Number(event.target.value))} aria-label={t('audioPlayer.progressLabel')} /></div>
          <button className="player-skip" disabled={!previousStory} onClick={() => previousStory && play(previousStory)} aria-label={t('listening.previousStory')}><PreviousIcon /></button>
          <button className="player-play" onClick={player.togglePlay} aria-label={player.isPlaying ? t('audioPlayer.pauseAudio') : t('audioPlayer.playAudio')}>{player.isPlaying ? <PauseIcon /> : <PlayIcon />}</button>
          <button className="player-skip" disabled={!nextStory} onClick={() => nextStory && play(nextStory)} aria-label={t('listening.nextStory')}><NextIcon /></button>
          {player.hasError && <p className="player-error" role="alert">{t('audioPlayer.unavailable')}</p>}
        </div>}
        {allMainStoriesComplete && !donationBannerDismissed && <DonationBanner onContribute={() => showDonationPanel('banner')} onDismiss={dismissDonationBanner} />}
      </div>
    </Layout>
  )
}

type ProgressMap = Record<string, StoryProgress>

class DonationPanelBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

function DonationBanner({ onContribute, onDismiss }: { onContribute: () => void; onDismiss: () => void }) {
  const { t } = useTranslation()
  return <aside className="donation-banner" aria-labelledby="donation-banner-title" aria-live="polite">
    <button className="donation-banner-close" onClick={onDismiss} aria-label={t('listen.bonusTransition.closeSupport')}>×</button>
    <div className="donation-banner-copy">
      <p className="listen-eyebrow">{t('listen.bonusTransition.voluntary')}</p>
      <h2 id="donation-banner-title">{t('listen.bonusTransition.supportTitle')}</h2>
    </div>
    <button className="donation-banner-primary" onClick={onContribute}>{t('listen.bonusTransition.contribute')}</button>
  </aside>
}

function DonationSection({ sectionRef, donationVisible, onShowDonation }: { sectionRef: RefObject<HTMLElement | null>; donationVisible: boolean; onShowDonation: () => void }) {
  const { t } = useTranslation()
  const [selfReported, setSelfReported] = useState(false)

  return <section ref={sectionRef} className="listen-donation" aria-labelledby="listen-donation-title">
    <p className="listen-eyebrow">{t('listen.bonusTransition.voluntary')}</p>
    <h2 id="listen-donation-title">{t('listen.bonusTransition.supportTitle')}</h2>
    <p className="listen-donation-copy">{t('listen.bonusTransition.supportDescription')}</p>
    {!donationVisible
      ? <button className="listen-donation-primary" onClick={onShowDonation}>{t('listen.bonusTransition.contribute')}</button>
      : selfReported
        ? <p className="listen-donation-thanks" role="status">{t('listen.bonusTransition.selfReportedThanks')}</p>
        : <DonationPanelBoundary fallback={<p className="listen-donation-loading" role="alert">{t('forms.email.errorGeneric')}</p>}><Suspense fallback={<p className="listen-donation-loading">{t('common.loading')}</p>}><DonationQrPanel presets={[5, 10, 25]} remittanceText={DONATION.remittanceText} confirmLabel={t('listen.bonusTransition.selfReport')} onConfirm={(amount) => { setSelfReported(true); void track('donation_self_reported', '/listen', { metadata: { amount } }) }} /></Suspense></DonationPanelBoundary>}
  </section>
}

interface StoryListProps {
  stories: Stop[]
  allStories: Stop[]
  selectedId?: string
  progress: ProgressMap
  currentDuration: number
  isPlaying: boolean
  onPlay: (story: Stop) => void
}

function StorySection({ title, subtitle, stories, allStories, selectedId, progress, currentDuration, isPlaying, onPlay }: StoryListProps & { title: string; subtitle: string }) {
  if (stories.length === 0) return null
  const sectionId = `story-section-${stories[0]?.story_type ?? 'empty'}`
  return <section className="story-section" aria-labelledby={`${sectionId}-heading`}><header><h2 id={`${sectionId}-heading`}>{title}</h2><p>{subtitle}</p></header><StoryList stories={stories} allStories={allStories} selectedId={selectedId} progress={progress} currentDuration={currentDuration} isPlaying={isPlaying} onPlay={onPlay} /></section>
}

function StoryList({ stories, allStories, selectedId, progress, currentDuration, isPlaying, onPlay }: StoryListProps) {
  const { t } = useTranslation()
  return <div className="story-list">{stories.map((story) => {
    const state = progress[story.id]
    const active = selectedId === story.id
    const playing = active && isPlaying
    const duration = active && currentDuration > 0 ? currentDuration : story.duration_seconds || state?.duration || 0
    const action = playing ? t('audioPlayer.pauseAudio') : state?.completed ? t('listen.playAgain') : state?.position ? t('listen.continueButton') : t('audioPlayer.playAudio')
    const completedLabel = state?.completed ? `, ${t('listening.completed')}` : ''
    return <article key={story.id} className={`${active ? 'is-active' : ''} ${playing ? 'is-playing' : ''} ${state?.completed ? 'is-complete' : ''}`} aria-current={active ? 'true' : undefined}>
      <button className="story-row" onClick={() => onPlay(story)} aria-label={`${action}: ${story.title}${completedLabel}`} aria-pressed={playing}>
        <span className="story-art"><StoryImage story={story} allStories={allStories} /><span className={`story-status ${state?.completed ? 'is-complete' : ''}`} aria-hidden="true">{state?.completed ? '✓' : story.order_index}</span></span>
        <span className="story-copy"><strong>{story.title}</strong><small>{story.description}</small></span>
        <span className="story-duration">{formatTime(duration)}</span>
        <span className="story-play" aria-hidden="true">{playing ? <PauseIcon /> : <PlayIcon />}</span>
      </button>
    </article>
  })}</div>
}

function BonusSection({ stories, allStories, selectedId, progress, currentDuration, isPlaying, onPlay }: StoryListProps) {
  const { t } = useTranslation()
  if (stories.length === 0) return null
  return <section className="bonus-section" aria-labelledby="bonus-heading"><header><div><h2 id="bonus-heading">{t('listen.bonusStories')} <span>◆ {t('listen.included')}</span></h2><p>{t('listen.bonusDescription', { count: stories.length })}</p></div></header><div id="bonus-stories-list"><StoryList stories={stories} allStories={allStories} selectedId={selectedId} progress={progress} currentDuration={currentDuration} isPlaying={isPlaying} onPlay={onPlay} /></div></section>
}

function storyArtwork(story: Stop, allStories: Stop[]): string {
  if (story.image_url) return story.image_url
  return fallbackStoryArtwork(story, allStories)
}

function fallbackStoryArtwork(story: Stop, allStories: Stop[]): string {
  return STORY_ARTWORK_BY_ORDER[story.order_index] || getBonusStoryArtwork(story, allStories) || '/premium/bonus.png'
}

function StoryImage({ story, allStories, className }: { story: Stop; allStories: Stop[]; className?: string }) {
  const initial = storyArtwork(story, allStories)
  const [src, setSrc] = useState(initial)
  if (src !== initial && src !== fallbackStoryArtwork(story, allStories)) setSrc(initial)
  return <img className={className} src={src} alt="" onError={() => setSrc((current) => current === fallbackStoryArtwork(story, allStories) ? '/premium/bonus.png' : fallbackStoryArtwork(story, allStories))} />
}

const Svg = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
function ClockIcon() { return <Svg><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Svg> }
function GlobeIcon() { return <Svg><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c4 4 4 14 0 18M12 3c-4 4-4 14 0 18" /></Svg> }
function PinIcon() { return <Svg><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></Svg> }
function PlayIcon() { return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m8 5 11 7-11 7V5Z" /></svg> }
function PauseIcon() { return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5h4v14H7V5Zm6 0h4v14h-4V5Z" /></svg> }
function PreviousIcon() { return <Svg><path d="M19 5 8 12l11 7V5ZM5 5v14" /></Svg> }
function NextIcon() { return <Svg><path d="m5 5 11 7-11 7V5Zm14 0v14" /></Svg> }
