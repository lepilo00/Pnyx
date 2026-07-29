import { useEffect, useMemo, useRef, useState } from 'react'
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
import { saveStoryProgress, useListeningProgress } from '@/lib/audioProgress'
import type { StoryProgress } from '@/lib/audioProgress'
import { GOOGLE_MAPS_DIRECTIONS_URL } from '@/lib/constants'
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
  const [expandedId, setExpandedId] = useState<string>()
  const [transcriptId, setTranscriptId] = useState<string>()
  const [bonusOpen, setBonusOpen] = useState(false)
  const [nextStoryId, setNextStoryId] = useState<string>()
  const shouldPlay = useRef(false)
  const milestones = useRef(new Set<string>())
  const lastPersistedSecond = useRef(-1)
  const previousLanguage = useRef(i18n.language)
  const completionState = useRef<{ initialized: boolean; count: number }>({ initialized: false, count: 0 })
  const donationPromptTracked = useRef(false)

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
  const completedCount = mainStories.filter((story) => progress.stories[story.id]?.completed).length
  const mainExperienceComplete = mainStories.length === 7 && completedCount === 7

  const player = useAudioPlayer(selected?.audio_url ?? '', {
    initialPosition: selectedInitialPosition,
    initialPlaybackRate: progress.playbackRate,
    onPlay: () => {
      if (!selected) return
      const metadata = { category: selected.story_type, language: i18n.language }
      void track('stop_audio_started', '/listen', { stop_id: selected.id, metadata })
      if (selected.story_type === 'bonus') void track('bonus_story_started', '/listen', { stop_id: selected.id, metadata })
    },
    onPause: (position, duration) => selected && saveStoryProgress(selected.id, position, duration, false, i18n.language),
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
      saveStoryProgress(selected.id, player.currentTime, player.duration, false, i18n.language)
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
      if (selected && player.duration) saveStoryProgress(selected.id, player.currentTime, player.duration, false, i18n.language)
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
      completionState.current = { initialized: true, count: completedCount }
      return
    }
    if (mainStories.length === 7 && previous.count < 7 && completedCount === 7) {
      void track('all_main_stories_completed', '/listen', { metadata: { total: mainStories.length } })
    }
    completionState.current.count = completedCount
  }, [completedCount, loading, mainStories.length])

  useEffect(() => {
    if (!mainExperienceComplete || donationPromptTracked.current) return
    donationPromptTracked.current = true
    void track('donation_prompt_shown', '/listen')
  }, [mainExperienceComplete])

  function play(story: Stop, event: 'listen_start_clicked' | 'listen_continue_clicked' | null = null) {
    if (!story.audio_url) return
    if (event) void track(event, '/listen', { stop_id: story.id, metadata: { category: story.story_type } })
    const saved = progress.stories[story.id]
    const recordingChanged = Boolean(saved?.language && saved.language !== i18n.language)
    if (selected && selected.id !== story.id && player.duration) {
      saveStoryProgress(selected.id, player.currentTime, player.duration, false, i18n.language)
    }
    saveStoryProgress(story.id, recordingChanged ? 0 : saved?.position ?? 0, recordingChanged ? 0 : saved?.duration ?? 0, saved?.completed ?? false, i18n.language)
    setNextStoryId(undefined)
    if (selectedId === story.id) {
      if (!player.isPlaying) player.togglePlay()
    } else {
      lastPersistedSecond.current = -1
      shouldPlay.current = true
      setSelectedId(story.id)
    }
  }

  function openTranscript(storyId: string) {
    setTranscriptId(storyId)
    const story = playableStories.find((item) => item.id === storyId)
    void track('transcript_opened', '/listen', { stop_id: storyId, metadata: { category: story?.story_type } })
  }

  async function shareExperience() {
    const url = `${window.location.origin}/listen`
    try {
      if (navigator.share) await navigator.share({ title: `${t('common.brand.title')} ${t('common.brand.subtitle')}`, url })
      else await navigator.clipboard.writeText(url)
      void track('listen_shared', '/listen')
    } catch (error) {
      if ((error as DOMException).name !== 'AbortError') return
    }
  }

  const resume = mainStories.find((story) => story.id === progress.lastStoryId) ?? mainStories[0]
  const resumeProgress = resume ? progress.stories[resume.id] : undefined
  const returning = Boolean(resumeProgress && (resumeProgress.position > 0 || resumeProgress.completed))

  return (
    <Layout showBack headerVariant="listen">
      <div className={`listen-page ${selected ? 'has-player' : ''}`}>
        <section className="listen-hero" aria-labelledby="listen-title">
          <div className="listen-hero-art" aria-hidden="true" />
          <div className="listen-hero-copy">
            <p className="listen-eyebrow">{t('listen.eyebrow')}</p>
            <h1 id="listen-title">{t('listen.title')}</h1>
            <p>{t('listen.subtitleLine1')}<br />{t('listen.subtitleLine2')}</p>
            <div className="listen-meta"><ClockIcon /> {t('listen.meta')} <span>•</span> <GlobeIcon /> {t('listen.languages', { count: 10 })}</div>
            <a href={GOOGLE_MAPS_DIRECTIONS_URL} target="_blank" rel="noreferrer" onClick={() => void track('directions_clicked', '/listen')}><PinIcon /> <strong>{t('listen.goToPnyx')}</strong><span>•</span>{t('listen.walkFromAcropolis')}</a>
          </div>
        </section>

        {!loading && resume && <section className="resume-card" aria-label={returning ? t('listen.continue') : t('listen.start')}>
          <div className="resume-copy">
            <p className="listen-eyebrow">{returning ? t('listen.continue') : t('listen.start')}</p>
            <h2>{resume.title}</h2>
            <p className="resume-time">{formatTime(resumeProgress?.position ?? 0)} / {formatTime(resumeProgress?.duration || resume.duration_seconds || 0)}</p>
            <div className="resume-line"><span style={{ width: `${resumeProgress?.duration ? Math.min(100, resumeProgress.position / resumeProgress.duration * 100) : 0}%` }} /></div>
            <p>{t('listen.mainProgress', { completed: completedCount, total: mainStories.length })}</p>
          </div>
          <button disabled={!resume.audio_url} onClick={() => play(resume, returning ? 'listen_continue_clicked' : 'listen_start_clicked')}>{returning ? t('listen.continueButton') : t('listen.startButton')}</button>
        </section>}

        {error && <p className="listen-notice" role="status">{t('listen.offline')}</p>}
        {loading ? <div className="listen-loading">{t('common.loading')}</div> : playableStories.length === 0 ? <div className="listen-empty" role="status"><h2>{t('listen.emptyTitle')}</h2><p>{t('listen.emptyBody')}</p></div> : <>
          <StorySection title={t('listen.introduction')} subtitle={t('listen.introSubtitle')} stories={introStories} allStories={playableStories} expandedId={expandedId} selectedId={selectedId} progress={progress.stories} currentDuration={player.duration} onExpand={setExpandedId} onPlay={play} onTranscript={openTranscript} />
          <StorySection title={t('listen.mainExperience')} subtitle={t('listen.mainSubtitle')} stories={coreStories} allStories={playableStories} expandedId={expandedId} selectedId={selectedId} progress={progress.stories} currentDuration={player.duration} onExpand={setExpandedId} onPlay={play} onTranscript={openTranscript} />
          {nextStoryId && <button className="play-next" onClick={() => { const next = mainStories.find((story) => story.id === nextStoryId); if (next) play(next) }}>{t('listen.playNext')}</button>}
          <BonusSection stories={bonusStories} allStories={playableStories} expanded={bonusOpen} onExpand={() => { setBonusOpen(true); void track('bonus_stories_expanded', '/listen') }} onPlay={play} />
          {mainExperienceComplete && <section className="complete-card">
            <p className="listen-eyebrow">{t('listen.completeEyebrow')}</p><h2>{t('listen.completeTitle')}</h2><p>{t('listen.completeBody')}</p>
            <div><button onClick={() => { setBonusOpen(true); document.querySelector('.bonus-section')?.scrollIntoView({ behavior: 'smooth' }) }}>{t('listen.exploreBonus')}</button><button onClick={() => void shareExperience()}>{t('listen.share')}</button></div>
            <Link to="/support" onClick={() => void track('donation_clicked', '/listen')}>{t('listen.support')}</Link>
            <Link to="/contact" onClick={() => void track('listen_feedback_clicked', '/listen')}>{t('listen.feedback')}</Link>
          </section>}
        </>}

        {selected && <div className="sticky-player" role="region" aria-label={t('listen.player')}>
          {player.audioElement}
          <StoryImage className="player-art" story={selected} allStories={playableStories} />
          <div className="player-info"><strong>{selected.title}</strong><span>{formatTime(player.currentTime)} / {formatTime(player.duration)}</span><input type="range" min="0" max={player.duration || 0} value={Math.min(player.currentTime, player.duration || 0)} onChange={(event) => player.seek(Number(event.target.value))} aria-label={t('audioPlayer.progressLabel')} /></div>
          <button className="player-skip" onClick={() => player.skip(-15)} aria-label={t('listening.back15')}><SkipIcon direction="back" /></button>
          <button className="player-play" onClick={player.togglePlay} aria-label={player.isPlaying ? t('audioPlayer.pauseAudio') : t('audioPlayer.playAudio')}>{player.isPlaying ? <PauseIcon /> : <PlayIcon />}</button>
          <button className="player-skip" onClick={() => player.skip(15)} aria-label={t('listening.forward15')}><SkipIcon direction="forward" /></button>
          <button className="player-transcript" onClick={() => openTranscript(selected.id)}><TranscriptIcon /><span>{t('listening.transcript')}</span></button>
          {player.hasError && <p className="player-error" role="alert">{t('audioPlayer.unavailable')}</p>}
        </div>}

        {transcriptId && <Transcript story={playableStories.find((story) => story.id === transcriptId)} onClose={() => setTranscriptId(undefined)} />}
      </div>
    </Layout>
  )
}

type ProgressMap = Record<string, StoryProgress>

function StorySection({ title, subtitle, stories, allStories, expandedId, selectedId, progress, currentDuration, onExpand, onPlay, onTranscript }: { title: string; subtitle: string; stories: Stop[]; allStories: Stop[]; expandedId?: string; selectedId?: string; progress: ProgressMap; currentDuration: number; onExpand: (id?: string) => void; onPlay: (story: Stop) => void; onTranscript: (id: string) => void }) {
  const { t } = useTranslation()
  if (stories.length === 0) return null
  const sectionId = `story-section-${stories[0]?.story_type ?? 'empty'}`
  return <section className="story-section" aria-labelledby={`${sectionId}-heading`}><header><h2 id={`${sectionId}-heading`}>{title}</h2><p>{subtitle}</p></header><div className="story-list">{stories.map((story) => {
    const open = expandedId === story.id
    const state = progress[story.id]
    const active = selectedId === story.id
    const detailsId = `story-details-${story.id}`
    const duration = active && currentDuration > 0 ? currentDuration : story.duration_seconds || state?.duration || 0
    return <article key={story.id} className={`${active ? 'is-active' : ''} ${state?.completed ? 'is-complete' : ''}`} aria-current={active ? 'true' : undefined}>
      <div className="story-summary">
        <button className="story-main" aria-expanded={open} aria-controls={detailsId} onClick={() => onExpand(open ? undefined : story.id)}>
          <span className="story-art"><StoryImage story={story} allStories={allStories} /><i>{story.order_index}</i>{state?.completed && <b aria-label={t('listening.completed')}>✓</b>}</span>
          <span className="story-copy"><strong>{story.title}</strong><small>{story.description}</small></span>
        </button>
        <span className="story-duration">{formatTime(duration)}</span>
        <button className="story-expand" aria-expanded={open} aria-controls={detailsId} onClick={() => onExpand(open ? undefined : story.id)} aria-label={open ? t('listening.hideDetails') : t('listening.showDetails')}><ChevronIcon open={open} /></button>
      </div>
      {open && <div className="story-details" id={detailsId}><p>{story.description}</p><div><button onClick={() => onPlay(story)}>{state?.completed ? t('listen.playAgain') : state?.position ? t('listen.continueButton') : t('listen.play')}</button><button onClick={() => onTranscript(story.id)}>{t('freeExperience.transcript')}</button></div></div>}
    </article>
  })}</div></section>
}

function BonusSection({ stories, allStories, expanded, onExpand, onPlay }: { stories: Stop[]; allStories: Stop[]; expanded: boolean; onExpand: () => void; onPlay: (story: Stop) => void }) {
  const { t } = useTranslation()
  const visibleStories = expanded ? stories : stories.slice(0, 3)
  if (stories.length === 0) return null
  return <section className="bonus-section" aria-labelledby="bonus-heading"><header><div><h2 id="bonus-heading">{t('listen.bonusStories')} <span>◆ {t('listen.included')}</span></h2><p>{t('listen.bonusDescription', { count: stories.length })}</p></div></header><div className="bonus-grid">{visibleStories.map((story) => <button key={story.id} onClick={() => onPlay(story)}><StoryImage story={story} allStories={allStories} /><strong>{story.title}</strong><span>▶ {t('listen.play')}</span></button>)}</div>{!expanded && <button className="bonus-more" onClick={onExpand} aria-expanded={false}>{t('listen.seeAllBonus', { count: stories.length })} <span>›</span></button>}</section>
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

function Transcript({ story, onClose }: { story?: Stop; onClose: () => void }) {
  const { t } = useTranslation()
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    closeRef.current?.focus()
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [onClose])
  return <div className="transcript-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section role="dialog" aria-modal="true" aria-labelledby="transcript-title"><button ref={closeRef} className="transcript-close" onClick={onClose} aria-label={t('menu.closeAria')}>×</button><p className="listen-eyebrow">{t('listening.transcript')}</p><h2 id="transcript-title">{story?.title}</h2><div>{story?.transcript || story?.description || t('listen.noTranscript')}</div></section></div>
}

const Svg = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
function ClockIcon() { return <Svg><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Svg> }
function GlobeIcon() { return <Svg><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c4 4 4 14 0 18M12 3c-4 4-4 14 0 18" /></Svg> }
function PinIcon() { return <Svg><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></Svg> }
function PlayIcon() { return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m8 5 11 7-11 7V5Z" /></svg> }
function PauseIcon() { return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5h4v14H7V5Zm6 0h4v14h-4V5Z" /></svg> }
function TranscriptIcon() { return <Svg><path d="M6 3h10l3 3v15H6V3Z" /><path d="M9 10h7M9 14h7M9 18h5" /></Svg> }
function ChevronIcon({ open }: { open: boolean }) { return <Svg className={open ? 'is-open' : ''}><path d="m9 6 6 6-6 6" /></Svg> }
function SkipIcon({ direction }: { direction: 'back' | 'forward' }) { return <Svg><path d={direction === 'back' ? 'M7 8H3V4M3 8a9 9 0 1 1-1 7' : 'M17 8h4V4m0 4a9 9 0 1 0 1 7'} /><text x="12" y="15.3" textAnchor="middle" fill="currentColor" stroke="none" fontSize="7" fontWeight="700">15</text></Svg> }
