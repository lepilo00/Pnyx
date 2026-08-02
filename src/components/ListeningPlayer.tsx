import { formatTime } from '@/hooks/useAudioPlayer'
import type { AudioPlayerControls } from '@/hooks/useAudioPlayer'
import { useTranslation } from 'react-i18next'

interface Props {
  player: AudioPlayerControls
  title: string
  onPrevious?: () => void
  onNext?: () => void
  artworkUrl?: string
  variant?: 'light' | 'premium'
}

function formatTotalTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00'
  return formatTime(Math.ceil(seconds))
}

export default function ListeningPlayer({ player, title, onPrevious, onNext, artworkUrl, variant = 'light' }: Props) {
  const { t } = useTranslation()
  const { currentTime, duration, isPlaying, isLoading, hasAudio, hasError, togglePlay, seek } = player
  const progress = duration ? currentTime / duration * 100 : 0
  const premium = variant === 'premium'
  const shellColors = premium
    ? 'border-navy-700 bg-navy-950 text-parchment-50 shadow-[0_-7px_22px_rgba(7,23,40,.25)]'
    : 'border-amber-200 bg-parchment-50/95 text-navy-900 shadow-[0_-7px_22px_rgba(28,25,23,.14)] backdrop-blur-xl dark:border-stone-700 dark:bg-stone-900/95 dark:text-stone-100'
  const grid = artworkUrl
    ? 'grid-cols-[44px_minmax(0,1fr)_44px_48px_44px] max-[350px]:grid-cols-[minmax(0,1fr)_44px_48px_44px]'
    : 'grid-cols-[minmax(0,1fr)_44px_48px_44px]'

  return (
    <section className="fixed inset-x-0 bottom-0 z-40 px-1" aria-label={`${t('audioPlayer.playing')}: ${title}`}>
      <div
        className={`relative mx-auto grid min-h-[68px] max-w-lg items-center gap-1 overflow-hidden rounded-t-xl border border-b-0 px-2 pt-2 ${grid} ${shellColors}`}
        style={{ paddingBottom: 'calc(.3rem + env(safe-area-inset-bottom))' }}
      >
        <input
          type="range"
          min={0}
          max={duration || 1}
          value={Math.min(currentTime, duration || 0)}
          onChange={(event) => seek(Number(event.target.value))}
          className="audio-scrubber absolute inset-x-2 top-0 h-3 w-[calc(100%-1rem)]"
          style={{ '--progress': `${progress}%` } as React.CSSProperties}
          aria-label={t('audioPlayer.progressLabel')}
        />

        {artworkUrl && <span className="h-10 w-10 overflow-hidden rounded-md border border-amber-500/60 bg-stone-800 max-[350px]:hidden"><img src={artworkUrl} alt="" className="h-full w-full object-cover" /></span>}
        <div className="min-w-0 leading-tight">
          <strong className="block truncate font-serif text-[11px]">{title}</strong>
          <span className={`mt-1 block text-[9px] tabular-nums ${premium ? 'text-stone-300' : 'text-stone-500'}`}>
            {formatTime(currentTime)} / {formatTotalTime(duration)}
          </span>
        </div>
        <PlayerButton onClick={onPrevious} disabled={!onPrevious} label={t('listening.previousStory')}><PreviousIcon /></PlayerButton>
        <button
          onClick={togglePlay}
          disabled={!hasAudio || isLoading}
          className="grid h-12 w-12 place-items-center rounded-full bg-orange-600 text-white shadow-sm disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          aria-label={isPlaying ? t('audioPlayer.pauseAudio') : t('audioPlayer.playAudio')}
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>
        <PlayerButton onClick={onNext} disabled={!onNext} label={t('listening.nextStory')}><NextIcon /></PlayerButton>
        {hasError && <p className="absolute inset-x-2 bottom-0 text-center text-[7px] text-red-300" role="alert">{t('audioPlayer.unavailable')}</p>}
      </div>
    </section>
  )
}

function PlayerButton({ children, onClick, disabled, label }: { children: React.ReactNode; onClick?: () => void; disabled: boolean; label: string }) {
  return <button onClick={onClick} disabled={disabled} className="grid h-11 w-11 place-items-center disabled:opacity-25" aria-label={label}>{children}</button>
}

const iconClass = 'h-5 w-5'
function PlayIcon() { return <svg className={`${iconClass} ml-0.5`} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.344-5.891a1.5 1.5 0 000-2.538L6.3 2.84z" /></svg> }
function PauseIcon() { return <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path d="M5.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75A.75.75 0 007.25 3h-1.5zm6.5 0a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75a.75.75 0 00-.75-.75h-1.5z" /></svg> }
function PreviousIcon() { return <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 5 8 12l11 7V5ZM5 5v14" /></svg> }
function NextIcon() { return <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 5 11 7-11 7V5Zm14 0v14" /></svg> }
