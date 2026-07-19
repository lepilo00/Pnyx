import { formatTime } from '@/hooks/useAudioPlayer'
import type { AudioPlayerControls } from '@/hooks/useAudioPlayer'
import { useTranslation } from 'react-i18next'

interface Props {
  player: AudioPlayerControls
  title: string
  onPrevious?: () => void
  onNext?: () => void
  /** Current story thumbnail (premium variant only). */
  artworkUrl?: string
  /** 'premium': floating navy card with gold controls (playlist view). 'light': original docked bar (stops view). */
  variant?: 'light' | 'premium'
}

export default function ListeningPlayer({ player, title, onPrevious, onNext, artworkUrl, variant = 'light' }: Props) {
  const { t } = useTranslation()
  const { currentTime, duration, isPlaying, isLoading, hasAudio, togglePlay, seek } = player
  const progress = duration ? currentTime / duration * 100 : 0
  const premium = variant === 'premium'

  const shellClass = premium
    ? 'mx-auto max-w-lg rounded-t-2xl border border-b-0 border-navy-700 bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 px-4 pt-2.5 shadow-[0_-10px_40px_rgba(15,23,48,0.4)]'
    : 'mx-auto max-w-lg border-t border-amber-200 bg-parchment-50/95 px-4 pt-2 shadow-[0_-12px_35px_rgba(28,25,23,0.12)] backdrop-blur-xl dark:border-stone-700 dark:bg-stone-900/95'

  return (
    <section className={`fixed inset-x-0 bottom-0 z-40 ${premium ? 'px-2' : ''}`} aria-label={`Audio player: ${title}`}>
      <div className={shellClass} style={{ paddingBottom: 'calc(.6rem + env(safe-area-inset-bottom))' }}>
        <input
          type="range"
          min={0}
          max={duration || 1}
          value={currentTime}
          onChange={(event) => seek(Number(event.target.value))}
          className={`audio-scrubber w-full ${premium ? 'audio-scrubber-lg' : ''}`}
          style={{ '--progress': `${progress}%` } as React.CSSProperties}
          aria-label="Audio progress"
        />

        {premium ? (
          <div className="mt-1.5 flex items-center gap-2.5">
            <span className="h-9 w-9 shrink-0 overflow-hidden rounded-md border border-navy-600 bg-navy-800">
              {artworkUrl
                ? <img src={artworkUrl} alt="" className="h-full w-full object-cover" />
                : (
                  <span className="flex h-full w-full items-center justify-center text-amber-400" aria-hidden="true">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 3l9 5H3l9-5zM5 8v9m4.5-9v9m5-9v9M19 8v9M3 20h18" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </span>
                )}
            </span>
            <p className="min-w-0 flex-1 truncate text-[13px] font-semibold text-parchment-50">{title}</p>
            <span className="shrink-0 text-[10px] tabular-nums text-stone-400">{formatTime(currentTime)} · -{formatTime(Math.max(0, duration - currentTime))}</span>
          </div>
        ) : (
          <div className="mt-1 flex items-center justify-between text-[10px] tabular-nums text-stone-500"><span>{formatTime(currentTime)}</span><p className="max-w-[55%] truncate font-semibold text-navy-900 dark:text-stone-100">{title}</p><span>-{formatTime(Math.max(0, duration - currentTime))}</span></div>
        )}

        <div className="mx-auto mt-1 grid max-w-xs grid-cols-3 items-center justify-items-center">
          <button onClick={onPrevious} disabled={!onPrevious} className={`flex h-11 w-11 items-center justify-center text-2xl disabled:opacity-25 ${premium ? 'text-stone-300' : 'text-stone-600'}`} aria-label={t('listening.previousStory')}>‹</button>
          <button
            onClick={togglePlay}
            disabled={!hasAudio || isLoading}
            className={`flex h-12 w-12 items-center justify-center rounded-full shadow-md transition-transform duration-150 active:scale-95 motion-reduce:transform-none
                        disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
                        ${premium
                          ? `bg-amber-500 text-navy-950 focus-visible:ring-amber-400 focus-visible:ring-offset-navy-900 ${isPlaying ? 'audio-aura' : ''}`
                          : 'bg-amber-600 text-white focus-visible:ring-amber-700'}`}
            aria-label={isPlaying ? t('audioPlayer.pauseAudio') : t('audioPlayer.playAudio')}
          >
            {isPlaying ? <PauseIcon className="h-5 w-5" /> : <PlayIcon className="ml-0.5 h-5 w-5" />}
          </button>
          <button onClick={onNext} disabled={!onNext} className={`flex h-11 w-11 items-center justify-center text-2xl disabled:opacity-25 ${premium ? 'text-stone-300' : 'text-stone-600'}`} aria-label={t('listening.nextStory')}>›</button>
        </div>
      </div>
    </section>
  )
}

function PlayIcon({ className }: { className: string }) {
  return <svg className={className} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.344-5.891a1.5 1.5 0 000-2.538L6.3 2.84z" /></svg>
}

function PauseIcon({ className }: { className: string }) {
  return <svg className={className} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path d="M5.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75A.75.75 0 007.25 3h-1.5zm6.5 0a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75a.75.75 0 00-.75-.75h-1.5z" /></svg>
}
