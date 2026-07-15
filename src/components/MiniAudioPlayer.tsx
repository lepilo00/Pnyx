import { useTranslation } from 'react-i18next'
import { formatTime } from '@/hooks/useAudioPlayer'
import type { AudioPlayerControls } from '@/hooks/useAudioPlayer'
import { PlayIcon, PauseIcon } from './AudioPlayer'

interface MiniAudioPlayerProps {
  player: AudioPlayerControls
  title: string
}

// Compact player pinned to the bottom of the viewport so playback stays
// controllable while the visitor scrolls through the chapter text. Purely
// presentational — the page owns the audio state (useAudioPlayer) and
// decides when this bar is rendered.
export default function MiniAudioPlayer({ player, title }: MiniAudioPlayerProps) {
  const { t } = useTranslation()
  const { isPlaying, currentTime, duration, isLoading, togglePlay, seek } = player

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="fixed bottom-0 inset-x-0 z-30" role="region" aria-label={title}>
      <div
        className="max-w-lg mx-auto bg-white/95 dark:bg-stone-900/95 backdrop-blur-sm
                   border-t sm:border-x border-stone-200 dark:border-stone-800
                   sm:rounded-t-2xl shadow-[0_-6px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_-6px_24px_rgba(0,0,0,0.45)]
                   px-4 pt-3"
        style={{ paddingBottom: 'calc(0.625rem + env(safe-area-inset-bottom))' }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={togglePlay}
            disabled={isLoading}
            aria-label={isPlaying ? t('audioPlayer.pauseAudio') : t('audioPlayer.playAudio')}
            className="flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center
                       bg-gradient-to-br from-amber-400 to-amber-600 text-white
                       shadow-md shadow-amber-300/50 dark:shadow-amber-900/40
                       hover:from-amber-500 hover:to-amber-700 active:scale-95
                       transition-all duration-200 disabled:opacity-60
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2
                       focus-visible:ring-offset-white dark:focus-visible:ring-offset-stone-900"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              <PauseIcon className="w-5 h-5" />
            ) : (
              <PlayIcon className="w-5 h-5 ml-0.5" />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-stone-800 dark:text-stone-100 truncate">
              {title}
            </p>
            <p className="text-xs text-stone-400 dark:text-stone-500 tabular-nums">
              {formatTime(currentTime)} / {formatTime(duration)}
            </p>
          </div>
        </div>

        <input
          type="range"
          min={0}
          max={duration || 1}
          value={currentTime}
          onChange={(e) => seek(Number(e.target.value))}
          className="audio-scrubber w-full mt-2"
          style={{ '--progress': `${progress}%` } as React.CSSProperties}
          aria-label={t('audioPlayer.progressLabel')}
        />
      </div>
    </div>
  )
}
