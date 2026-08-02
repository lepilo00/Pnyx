import type { CSSProperties, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { formatTime } from '@/hooks/useAudioPlayer'
import type { AudioPlayerControls } from '@/hooks/useAudioPlayer'
import './ListeningPlayer.css'

interface Props {
  player: AudioPlayerControls
  title: string
  onPrevious?: () => void
  onNext?: () => void
  artworkUrl?: string
  variant?: 'light' | 'premium'
}

function formatRemainingTime(duration: number, currentTime: number): { visible: string; spoken?: string } {
  if (!Number.isFinite(duration) || duration <= 0) return { visible: '–:––' }
  const safeCurrentTime = Number.isFinite(currentTime) ? Math.max(0, currentTime) : 0
  const remainingSeconds = Math.max(0, Math.ceil(duration - safeCurrentTime))
  const spoken = formatTime(remainingSeconds)
  return { visible: remainingSeconds > 0 ? `−${spoken}` : spoken, spoken }
}

export default function ListeningPlayer({ player, title, onPrevious, onNext, artworkUrl, variant = 'light' }: Props) {
  const { t } = useTranslation()
  const { currentTime, duration, isPlaying, isLoading, hasAudio, hasError, togglePlay, seek } = player
  const progress = duration > 0 ? Math.min(100, Math.max(0, currentTime / duration * 100)) : 0
  const elapsedLabel = formatTime(currentTime)
  const remaining = formatRemainingTime(duration, currentTime)
  const progressValueText = remaining.spoken
    ? `${elapsedLabel}; ${t('audioPlayer.timeRemaining', { time: remaining.spoken })}`
    : elapsedLabel
  const status = hasError
    ? t('audioPlayer.unavailable')
    : isLoading
      ? t('audioPlayer.loadingAudio')
      : t('audioPlayer.playing')

  return (
    <section className={`listening-player listening-player--${variant}`} aria-label={`${t('audioPlayer.playing')}: ${title}`}>
      <div className="listening-player__shell">
        <div className="listening-player__main-row">
          {artworkUrl && (
            <span className="listening-player__artwork" aria-hidden="true">
              <img src={artworkUrl} alt="" />
            </span>
          )}

          <div className="listening-player__copy">
            <span className={`listening-player__status${hasError ? ' is-error' : ''}`} role={hasError ? 'alert' : undefined} aria-live="polite">
              {status}
            </span>
            <strong title={title}>{title}</strong>
          </div>

          <div className="listening-player__controls">
            <PlayerButton onClick={onPrevious} disabled={!onPrevious} label={t('listening.previousStory')}>
              <PreviousIcon />
            </PlayerButton>
            <button
              type="button"
              onClick={togglePlay}
              disabled={!hasAudio || isLoading}
              className="listening-player__play"
              aria-label={isPlaying ? t('audioPlayer.pauseAudio') : t('audioPlayer.playAudio')}
              aria-pressed={isPlaying}
            >
              {isLoading ? <LoadingIcon /> : isPlaying ? <PauseIcon /> : <PlayIcon />}
            </button>
            <PlayerButton onClick={onNext} disabled={!onNext} label={t('listening.nextStory')}>
              <NextIcon />
            </PlayerButton>
          </div>
        </div>

        <div className="listening-player__timeline">
          <input
            type="range"
            min={0}
            max={duration || 1}
            value={Math.min(Math.max(currentTime, 0), duration || 0)}
            onChange={(event) => seek(Number(event.target.value))}
            disabled={!hasAudio || duration <= 0}
            className="listening-player__seek"
            style={{ '--player-progress': `${progress}%` } as CSSProperties}
            aria-label={t('audioPlayer.progressLabel')}
            aria-valuetext={progressValueText}
          />
          <div className="listening-player__times" aria-hidden="true">
            <span>{elapsedLabel}</span>
            <span>{remaining.visible}</span>
          </div>
        </div>
      </div>
    </section>
  )
}

function PlayerButton({ children, onClick, disabled, label }: { children: ReactNode; onClick?: () => void; disabled: boolean; label: string }) {
  return <button type="button" onClick={onClick} disabled={disabled} className="listening-player__skip" aria-label={label}>{children}</button>
}

const iconClass = 'listening-player__icon'
function PlayIcon() { return <svg className={`${iconClass} listening-player__play-icon`} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path d="m6.3 2.84 9.344 5.89a1.5 1.5 0 0 1 0 2.54L6.3 17.16A1.5 1.5 0 0 1 4 15.89V4.11a1.5 1.5 0 0 1 2.3-1.27Z" /></svg> }
function PauseIcon() { return <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path d="M5.75 3a.75.75 0 0 0-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 0 0 .75-.75V3.75A.75.75 0 0 0 7.25 3h-1.5Zm6.5 0a.75.75 0 0 0-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 0 0 .75-.75V3.75a.75.75 0 0 0-.75-.75h-1.5Z" /></svg> }
function PreviousIcon() { return <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 5 8 12l11 7V5ZM5 5v14" /></svg> }
function NextIcon() { return <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 5 11 7-11 7V5Zm14 0v14" /></svg> }
function LoadingIcon() { return <svg className="listening-player__loader" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2.2" opacity=".28" /><path d="M12 4a8 8 0 0 1 8 8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg> }
