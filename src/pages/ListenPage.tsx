import { Component, lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
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
const BONUS_TRANSITION_DISMISSED_KEY = 'pnyx:listen:bonus-transition-dismissed'
const BONUS_TRANSITION_VIEWED_KEY = 'pnyx:listen:bonus-transition-viewed'
const DonationQrPanel = lazy(() => import('@/components/DonationQrPanel'))

function readTransitionDismissed(): boolean {
  try { return sessionStorage.getItem(BONUS_TRANSITION_DISMISSED_KEY) === '1' } catch { return false }
}

function persistTransitionDismissed(dismissed: boolean): void {
  try {
    if (dismissed) sessionStorage.setItem(BONUS_TRANSITION_DISMISSED_KEY, '1')
    else sessionStorage.removeItem(BONUS_TRANSITION_DISMISSED_KEY)
  } catch { /* component state remains the safe fallback */ }
}

function readTransitionViewed(): boolean {
  try { return sessionStorage.getItem(BONUS_TRANSITION_VIEWED_KEY) === '1' } catch { return false }
}

function persistTransitionViewed(): void {
  try { sessionStorage.setItem(BONUS_TRANSITION_VIEWED_KEY, '1') } catch { /* in-memory deduplication remains available */ }
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
  const [bonusOpen, setBonusOpen] = useState(false)
  const [transitionDismissed, setTransitionDismissed] = useState(readTransitionDismissed)
  const [supportSheetOpen, setSupportSheetOpen] = useState(false)
  const [shareStatus, setShareStatus] = useState<'copied' | 'failed'>()
  const [nextStoryId, setNextStoryId] = useState<string>()
  const shouldPlay = useRef(false)
  const milestones = useRef(new Set<string>())
  const lastPersistedSecond = useRef(-1)
  const previousLanguage = useRef(i18n.language)
  const completionState = useRef<{ initialized: boolean; complete: boolean }>({ initialized: false, complete: false })
  const transitionViewTracked = useRef(readTransitionViewed())
  const bonusHeadingRef = useRef<HTMLHeadingElement>(null)
  const supportActionRef = useRef<HTMLButtonElement>(null)

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
  const introStories = mainStories.filter((story) => story.story_type === 'introduction')
  const coreStories = mainStories.filter((story) => story.story_type === 'main')
  const selected = playableStories.find((story) => story.id === selectedId)
  const selectedProgress = selected ? progress.stories[selected.id] : undefined
  const selectedInitialPosition = selectedProgress?.language && selectedProgress.language !== i18n.language
    ? 0
    : selectedProgress?.position ?? 0
  const validCoreConfiguration = introStories.length === 3 && coreStories.length === 4
  const validBonusConfiguration = bonusStories.length === 7
  const coreExperienceStories = useMemo(() => [...introStories, ...coreStories], [introStories, coreStories])
  const coreExperienceComplete = validCoreConfiguration && coreExperienceStories.every((story) => progress.stories[story.id]?.completed)
  const showBonusTransition = coreExperienceComplete && validBonusConfiguration

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
      const index = mainStories.findIndex((story) => story.id === selected.id)
      setNextStoryId(index >= 0 ? mainStories[index + 1]?.id : undefined)
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
    if (loading || mainStories.length === 0) return
    const previous = completionState.current
    if (!previous.initialized) {
      completionState.current = { initialized: true, complete: coreExperienceComplete }
      return
    }
    if (!previous.complete && coreExperienceComplete) {
      void track('all_main_stories_completed', '/listen', { metadata: { total: coreExperienceStories.length } })
    }
    completionState.current.complete = coreExperienceComplete
  }, [coreExperienceComplete, coreExperienceStories.length, loading, mainStories.length])

  useEffect(() => {
    if (!showBonusTransition || transitionDismissed || transitionViewTracked.current) return
    transitionViewTracked.current = true
    persistTransitionViewed()
    void track('bonus_transition_viewed', '/listen')
  }, [showBonusTransition, transitionDismissed])

  useEffect(() => {
    if (!import.meta.env.DEV || loading || playableStories.length === 0) return
    if (!validCoreConfiguration) console.warn(`PNYX /listen expects 3 introduction and 4 main stories; received ${introStories.length} introduction and ${coreStories.length} main.`)
    if (!validBonusConfiguration) console.warn(`PNYX /listen expects 7 bonus stories; received ${bonusStories.length}.`)
  }, [bonusStories.length, coreStories.length, introStories.length, loading, playableStories.length, validBonusConfiguration, validCoreConfiguration])

  useEffect(() => {
    if (loading || playableStories.length === 0) return
    if (selectedId && playableStories.some((story) => story.id === selectedId)) return
    const resumable = playableStories.find((story) => story.id === progress.lastStoryId) ?? mainStories[0] ?? playableStories[0]
    const timer = window.setTimeout(() => setSelectedId(resumable.id), 0)
    return () => window.clearTimeout(timer)
  }, [loading, mainStories, playableStories, progress.lastStoryId, selectedId])

  function play(story: Stop) {
    if (!story.audio_url) return
    const saved = progress.stories[story.id]
    const recordingChanged = Boolean(saved?.language && saved.language !== i18n.language)
    if (selected && selected.id !== story.id && player.duration) {
      saveStoryProgress(selected.id, player.currentTime, player.duration, getStoryProgress(selected.id)?.completed ?? false, i18n.language)
    }
    saveStoryProgress(story.id, recordingChanged ? 0 : saved?.position ?? 0, recordingChanged ? 0 : saved?.duration ?? 0, saved?.completed ?? false, i18n.language)
    setNextStoryId(undefined)
    if (selectedId === story.id) {
      player.togglePlay()
    } else {
      lastPersistedSecond.current = -1
      shouldPlay.current = true
      setSelectedId(story.id)
    }
  }

  async function shareExperience() {
    const url = `${window.location.origin}/listen`
    setShareStatus(undefined)
    void track('bonus_transition_share_clicked', '/listen')
    try {
      if (navigator.share) {
        void track('share_native_invoked', '/listen')
        await navigator.share({ title: `${t('common.brand.title')} ${t('common.brand.subtitle')}`, text: t('listen.bonusTransition.shareText'), url })
        void track('listen_shared', '/listen')
        return
      }
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable')
      await navigator.clipboard.writeText(url)
      setShareStatus('copied')
      void track('share_link_copied', '/listen')
    } catch (error) {
      if ((error as DOMException).name === 'AbortError') return
      setShareStatus('failed')
    }
  }

  function exploreBonusStories() {
    void track('bonus_transition_explore_clicked', '/listen')
    if (!bonusOpen) {
      setBonusOpen(true)
      void track('bonus_section_expanded', '/listen')
    }
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const heading = bonusHeadingRef.current
        if (!heading) return
        heading.focus({ preventScroll: true })
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        heading.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' })
      })
    })
  }

  function dismissBonusTransition() {
    setTransitionDismissed(true)
    persistTransitionDismissed(true)
    void track('bonus_transition_dismissed', '/listen')
  }

  function reopenBonusTransition() {
    setTransitionDismissed(false)
    persistTransitionDismissed(false)
    void track('bonus_transition_reopened', '/listen')
  }

  function openSupportSheet() {
    setSupportSheetOpen(true)
    void track('bonus_transition_support_clicked', '/listen')
    void track('donation_panel_opened', '/listen')
  }

  const selectedIndex = selected ? playableStories.findIndex((story) => story.id === selected.id) : -1
  const previousStory = selectedIndex > 0 ? playableStories[selectedIndex - 1] : undefined
  const nextStory = selectedIndex >= 0 ? playableStories[selectedIndex + 1] : undefined

  return (
    <Layout showBack headerVariant="listen" contentWidth="wide">
      <div className={`listen-page ${selected ? 'has-player' : ''}`}>
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
          {showBonusTransition && !transitionDismissed
            ? <BonusTransition
                bonusExpanded={bonusOpen}
                bonusContent={<BonusSection headingRef={bonusHeadingRef} stories={bonusStories} allStories={playableStories} expanded={bonusOpen} selectedId={selectedId} progress={progress.stories} currentDuration={player.duration} isPlaying={player.isPlaying} onExpand={() => { setBonusOpen(true); void track('bonus_section_expanded', '/listen') }} onPlay={play} />}
                supportActionRef={supportActionRef}
                shareStatus={shareStatus}
                onExplore={exploreBonusStories}
                onSupport={openSupportSheet}
                onShare={() => void shareExperience()}
                onDismiss={dismissBonusTransition}
              />
            : <>
                {showBonusTransition && <button className="bonus-transition-reopen" onClick={reopenBonusTransition}><PlayIcon />{t('listen.bonusTransition.reopen')}<ChevronIcon open={false} /></button>}
                <BonusSection headingRef={bonusHeadingRef} stories={bonusStories} allStories={playableStories} expanded={bonusOpen} selectedId={selectedId} progress={progress.stories} currentDuration={player.duration} isPlaying={player.isPlaying} onExpand={() => { setBonusOpen(true); void track('bonus_section_expanded', '/listen') }} onPlay={play} />
              </>}
          {nextStoryId && <button className="play-next" onClick={() => { const next = mainStories.find((story) => story.id === nextStoryId); if (next) play(next) }}>{t('listen.playNext')}</button>}
          {coreExperienceComplete && <p className="post-completion-feedback"><Link to="/contact" onClick={() => void track('listen_feedback_clicked', '/listen')}>{t('listen.feedback')}</Link></p>}
        </>}

        {selected && <div className="sticky-player" role="region" aria-label={t('listen.player')}>
          {player.audioElement}
          <StoryImage className="player-art" story={selected} allStories={playableStories} />
          <div className="player-info"><strong>{selected.title}</strong><span>{formatTime(player.currentTime)} / -{formatTime(Math.max(0, player.duration - player.currentTime))}</span><input type="range" min="0" max={player.duration || 0} value={Math.min(player.currentTime, player.duration || 0)} onChange={(event) => player.seek(Number(event.target.value))} aria-label={t('audioPlayer.progressLabel')} /></div>
          <button className="player-skip" disabled={!previousStory} onClick={() => previousStory && play(previousStory)} aria-label={t('listening.previousStory')}><PreviousIcon /></button>
          <button className="player-play" onClick={player.togglePlay} aria-label={player.isPlaying ? t('audioPlayer.pauseAudio') : t('audioPlayer.playAudio')}>{player.isPlaying ? <PauseIcon /> : <PlayIcon />}</button>
          <button className="player-skip" disabled={!nextStory} onClick={() => nextStory && play(nextStory)} aria-label={t('listening.nextStory')}><NextIcon /></button>
          {player.hasError && <p className="player-error" role="alert">{t('audioPlayer.unavailable')}</p>}
        </div>}

        {supportSheetOpen && <SupportSheet hasPlayer={Boolean(selected)} returnFocusRef={supportActionRef} onClose={() => setSupportSheetOpen(false)} />}
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

function BonusTransition({ bonusExpanded, bonusContent, supportActionRef, shareStatus, onExplore, onSupport, onShare, onDismiss }: { bonusExpanded: boolean; bonusContent: ReactNode; supportActionRef: React.RefObject<HTMLButtonElement | null>; shareStatus?: 'copied' | 'failed'; onExplore: () => void; onSupport: () => void; onShare: () => void; onDismiss: () => void }) {
  const { t } = useTranslation()
  return <section className="bonus-transition" aria-labelledby="bonus-transition-title">
    <p className="bonus-transition-eyebrow">{t('listen.bonusTransition.eyebrow')}<span /></p>
    <h2 id="bonus-transition-title">{t('listen.bonusTransition.title')}</h2>
    <p className="bonus-transition-copy">{t('listen.bonusTransition.description')}</p>
    <button className="bonus-transition-primary" aria-expanded={bonusExpanded} aria-controls="bonus-stories-list" onClick={onExplore}><PlayIcon /><span>{t('listen.bonusTransition.explore')}</span><ChevronIcon open={false} /></button>
    {bonusContent}
    <div className="bonus-transition-support">
      <HeartIcon />
      <div>
        <h3>{t('listen.bonusTransition.supportTitle')}</h3>
        <p>{t('listen.bonusTransition.supportDescription')}</p>
        <button ref={supportActionRef} onClick={onSupport}><HeartIcon /><span>{t('listen.bonusTransition.contribute')}</span><ChevronIcon open={false} /></button>
      </div>
    </div>
    <button className="bonus-transition-row" onClick={onShare}><ShareIcon /><strong>{t('listen.bonusTransition.share')}</strong><span>{t('bonusTransitionHints.share')}</span><ChevronIcon open={false} /></button>
    <div className="bonus-transition-share-status" role="status" aria-live="polite">
      {shareStatus === 'copied' && t('listen.bonusTransition.shareCopied')}
      {shareStatus === 'failed' && <>{t('listen.bonusTransition.shareFailed')} <a href={`${window.location.origin}/listen`}>{t('listen.bonusTransition.openLink')}</a></>}
    </div>
    <button className="bonus-transition-row bonus-transition-dismiss" onClick={onDismiss}><ClockIcon /><strong>{t('listen.bonusTransition.dismiss')}</strong><span>{t('bonusTransitionHints.dismiss')}</span><ChevronIcon open={false} /></button>
  </section>
}

function SupportSheet({ hasPlayer, returnFocusRef, onClose }: { hasPlayer: boolean; returnFocusRef: React.RefObject<HTMLButtonElement | null>; onClose: () => void }) {
  const { t } = useTranslation()
  const [donationVisible, setDonationVisible] = useState(false)
  const [selfReported, setSelfReported] = useState(false)
  const panelRef = useRef<HTMLElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose })

  useEffect(() => {
    const returnFocus = returnFocusRef.current
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    const close = () => onCloseRef.current()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); close(); return }
      if (event.key !== 'Tab' || !panelRef.current) return
      const focusable = [...panelRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])')]
        .filter((element) => element.getClientRects().length > 0)
      const first = focusable[0]
      const last = focusable.at(-1)
      if (!first || !last) return
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      returnFocus?.focus()
    }
  }, [returnFocusRef])

  return <div className="support-sheet-backdrop" onPointerDown={(event) => { if (event.target === event.currentTarget) onCloseRef.current() }}>
    <section ref={panelRef} className={`support-sheet ${hasPlayer ? 'has-sticky-player' : ''}`} role="dialog" aria-modal="true" aria-labelledby="support-sheet-title">
      <div className="support-sheet-handle" aria-hidden="true" />
      <button ref={closeRef} className="support-sheet-close" onClick={() => onCloseRef.current()} aria-label={t('listen.bonusTransition.closeSupport')}>×</button>
      <p className="listen-eyebrow">{t('listen.bonusTransition.voluntary')}</p>
      <h2 id="support-sheet-title">{t('listen.bonusTransition.supportTitle')}</h2>
      <p>{t('listen.bonusTransition.supportDescription')}</p>
      {!donationVisible ? <button className="support-sheet-primary" onClick={() => { setDonationVisible(true); void track('donation_clicked', '/listen') }}>{t('listen.bonusTransition.contribute')}</button> : selfReported ? <p className="support-sheet-thanks" role="status">{t('listen.bonusTransition.selfReportedThanks')}</p> : <DonationPanelBoundary fallback={<p className="support-sheet-loading" role="alert">{t('forms.email.errorGeneric')}</p>}><Suspense fallback={<p className="support-sheet-loading">{t('common.loading')}</p>}><DonationQrPanel presets={[5, 10, 25]} remittanceText={DONATION.remittanceText} confirmLabel={t('listen.bonusTransition.selfReport')} onConfirm={(amount) => { setSelfReported(true); void track('donation_self_reported', '/listen', { metadata: { amount } }) }} /></Suspense></DonationPanelBoundary>}
    </section>
  </div>
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

function BonusSection({ headingRef, stories, allStories, expanded, selectedId, progress, currentDuration, isPlaying, onExpand, onPlay }: StoryListProps & { headingRef: React.RefObject<HTMLHeadingElement | null>; expanded: boolean; onExpand: () => void }) {
  const { t } = useTranslation()
  const visibleStories = expanded ? stories : stories.slice(0, 3)
  if (stories.length === 0) return null
  return <section className="bonus-section" aria-labelledby="bonus-heading"><header><div><h2 ref={headingRef} id="bonus-heading" tabIndex={-1}>{t('listen.bonusStories')} <span>◆ {t('listen.included')}</span></h2><p>{t('listen.bonusDescription', { count: stories.length })}</p></div></header><div id="bonus-stories-list"><StoryList stories={visibleStories} allStories={allStories} selectedId={selectedId} progress={progress} currentDuration={currentDuration} isPlaying={isPlaying} onPlay={onPlay} /></div>{!expanded && <button className="bonus-more" onClick={onExpand} aria-expanded={false} aria-controls="bonus-stories-list">{t('listen.seeAllBonus', { count: stories.length })} <span>›</span></button>}</section>
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
function ChevronIcon({ open }: { open: boolean }) { return <Svg className={open ? 'is-open' : ''}><path d="m9 6 6 6-6 6" /></Svg> }
function HeartIcon() { return <Svg><path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 21l8.8-8.8a5.4 5.4 0 0 0 0-7.6Z" /></Svg> }
function ShareIcon() { return <Svg><circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" /><path d="m8.2 10.8 7.6-4.5M8.2 13.2l7.6 4.5" /></Svg> }
function PreviousIcon() { return <Svg><path d="M19 5 8 12l11 7V5ZM5 5v14" /></Svg> }
function NextIcon() { return <Svg><path d="m5 5 11 7-11 7V5Zm14 0v14" /></Svg> }
