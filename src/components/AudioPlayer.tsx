import { useTranslation } from 'react-i18next'
import { useAudioPlayer, formatTime } from '@/hooks/useAudioPlayer'
import type { AudioPlayerControls } from '@/hooks/useAudioPlayer'

interface AudioPlayerProps {
  src: string
  title: string
  onPlay?: () => void
  onEnded?: () => void
  /** Shared playback state owned by the page (e.g. mirrored by a sticky mini
      player). When omitted the card owns its own audio element. */
  player?: AudioPlayerControls
}

export default function AudioPlayer({ src, title, onPlay, onEnded, player }: AudioPlayerProps) {
  const { t } = useTranslation()
  // Standalone fallback (landing-page intro audio). With an external player
  // the internal hook gets an empty src, so it renders no audio element and
  // never competes with the shared one.
  const internal = useAudioPlayer(player ? '' : src, { onPlay, onEnded })
  const { hasAudio, isPlaying, currentTime, duration, isLoading, hasError, togglePlay, seek } =
    player ?? internal

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    seek(Number(e.target.value))
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-800 shadow-md shadow-stone-200/60 dark:shadow-black/20 overflow-hidden">
      {internal.audioElement}

      <div className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <p className="text-xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-widest">
            {title}
          </p>
          {/* Tiny equalizer while playing */}
          {isPlaying && (
            <span className="flex items-end gap-[3px] h-3.5" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="audio-wave-bar w-[3px] h-full rounded-full bg-amber-500"
                  style={{ animationDelay: `${i * 160}ms` }}
                />
              ))}
            </span>
          )}
        </div>

        {/* Main play/pause button */}
        <button
          onClick={togglePlay}
          disabled={!hasAudio || hasError || isLoading}
          className="w-full flex items-center gap-4 text-left group rounded-xl
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2
                     focus-visible:ring-offset-white dark:focus-visible:ring-offset-stone-900"
          aria-label={isPlaying ? t('audioPlayer.pauseAudio') : t('audioPlayer.playAudio')}
        >
          {/* Circle icon */}
          <div className={`flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center
                           transition-all duration-200 ${
            !hasAudio || hasError
              ? 'bg-stone-100 dark:bg-stone-800 text-stone-300 dark:text-stone-600'
              : isLoading
              ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-400'
              : `bg-gradient-to-br from-amber-400 to-amber-600 text-white
                 shadow-lg shadow-amber-300/50 dark:shadow-amber-900/40
                 group-hover:from-amber-500 group-hover:to-amber-700
                 group-hover:shadow-amber-400/60 group-hover:scale-[1.04]
                 group-active:scale-95 ${isPlaying ? 'audio-aura' : ''}`
          }`}>
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              <PauseIcon />
            ) : (
              <PlayIcon />
            )}
          </div>

          {/* Status text */}
          <div className="min-w-0">
            <p className="font-semibold text-stone-800 dark:text-stone-100 text-base leading-tight truncate">
              {isLoading
                ? t('audioPlayer.loadingAudio')
                : isPlaying
                ? t('audioPlayer.playing')
                : hasError
                ? t('audioPlayer.unavailable')
                : !hasAudio
                ? t('audioPlayer.comingSoon')
                : t('audioPlayer.playAudio')}
            </p>
            <p className="text-sm text-stone-400 dark:text-stone-500 mt-1 tabular-nums">
              {hasAudio && !hasError ? `${formatTime(currentTime)} / ${formatTime(duration)}` : t('audioPlayer.noAudioYet')}
            </p>
          </div>
        </button>

        {/* Scrubber */}
        {hasAudio && !hasError && (
          <div className="mt-5">
            <input
              type="range"
              min={0}
              max={duration || 1}
              value={currentTime}
              onChange={handleSeek}
              disabled={!hasAudio || hasError}
              className="audio-scrubber w-full disabled:opacity-40"
              style={{ '--progress': `${progress}%` } as React.CSSProperties}
              aria-label={t('audioPlayer.progressLabel')}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export function PlayIcon({ className = 'w-6 h-6 ml-0.5' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.344-5.891a1.5 1.5 0 000-2.538L6.3 2.84z" />
    </svg>
  )
}

export function PauseIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M5.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75A.75.75 0 007.25 3h-1.5zm6.5 0a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75a.75.75 0 00-.75-.75h-1.5z" />
    </svg>
  )
}
