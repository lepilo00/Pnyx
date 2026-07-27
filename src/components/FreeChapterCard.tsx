import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAudioPlayer, formatTime } from '@/hooks/useAudioPlayer'

interface FreeChapterCardProps {
  index: number
  title: string
  src: string
  transcript?: string
  isListened: boolean
  isExpanded: boolean
  onToggleExpanded: () => void
  onPlay: () => void
  onEnded: () => void
}

// One free chapter in the accordion list: collapsed row (number/check, title,
// duration, play button) that expands into the inline player with an optional
// transcript. The audio element stays mounted while collapsed so metadata
// (duration) is available and playback survives collapsing the card.
export default function FreeChapterCard({
  index,
  title,
  src,
  transcript,
  isListened,
  isExpanded,
  onToggleExpanded,
  onPlay,
  onEnded,
}: FreeChapterCardProps) {
  const { t } = useTranslation()
  const player = useAudioPlayer(src, { onPlay, onEnded })
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(false)

  const isPlayable = player.hasAudio && !player.hasError

  const handleCollapsedPlay = () => {
    if (!isExpanded) onToggleExpanded()
    void player.togglePlay()
  }

  return (
    <div
      className={`rounded-xl border shadow-sm transition-colors duration-300 ${
        isExpanded
          ? 'border-amber-200 bg-amber-50/80 dark:border-amber-900/50 dark:bg-amber-950/20'
          : 'border-stone-200/70 bg-white dark:border-stone-800 dark:bg-stone-900'
      }`}
    >
      {player.audioElement}

      <div className="flex min-h-[64px] items-center gap-2 px-3 py-2">
        <button
          onClick={onToggleExpanded}
          aria-expanded={isExpanded}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          {isListened ? (
            <span
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center font-serif text-xl text-amber-700"
              aria-label={t('audioPlayer.completed')}
            >
              <CheckGlyph />
            </span>
          ) : (
            <span
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center border-r border-stone-200 pr-2 font-serif text-2xl font-bold text-amber-700"
              aria-hidden="true"
            >
              {String(index + 1).padStart(2, '0')}
            </span>
          )}

          <span className="min-w-0 flex-1">
            <span
              className={`block font-serif text-[13px] font-bold leading-snug ${
                isListened && !isExpanded
                  ? 'text-stone-500 dark:text-stone-400'
                  : 'text-stone-800 dark:text-stone-100'
              }`}
            >
              {title}
            </span>
            <span className="mt-0.5 line-clamp-2 text-[10px] leading-tight text-stone-500 dark:text-stone-400">
              {!isPlayable ? (
                t('audioPlayer.unavailable')
              ) : (
                <>
                  {transcript}
                </>
              )}
            </span>
          </span>

          {(isExpanded || isListened || !isPlayable) && (
            <span
              className={`flex-shrink-0 text-stone-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
              aria-hidden="true"
            >
              <ChevronDownGlyph />
            </span>
          )}
        </button>

        {!isExpanded && isPlayable && (
          <button
            onClick={handleCollapsedPlay}
            aria-label={`${t('audioPlayer.playAudio')}: ${title}`}
            className="order-first ml-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2
                       border-amber-600 text-amber-600 transition-colors
                       hover:bg-amber-50 dark:border-amber-500 dark:text-amber-400 dark:hover:bg-amber-950/30"
          >
            {player.isLoading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
            ) : (
              <PlayGlyph />
            )}
          </button>
        )}
        {!isExpanded && <span className="w-9 shrink-0 text-right text-[10px] tabular-nums text-stone-600">{player.duration > 0 ? formatTime(player.duration) : ''}</span>}
      </div>

      {isExpanded && isPlayable && (
        <div className="px-4 pb-4">
          <div className="flex items-center gap-3">
            <span className="text-xs tabular-nums text-stone-500 dark:text-stone-400">
              {formatTime(player.currentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={player.duration || 1}
              step={0.1}
              value={player.currentTime}
              onChange={(event) => player.seek(Number(event.target.value))}
              disabled={player.duration <= 0}
              className="audio-scrubber min-w-0 flex-1 disabled:opacity-40"
              style={{
                '--progress': `${player.duration > 0 ? (player.currentTime / player.duration) * 100 : 0}%`,
              } as React.CSSProperties}
              aria-label={`${t('audioPlayer.progressLabel')}: ${title}`}
            />
            <span className="text-xs tabular-nums text-stone-500 dark:text-stone-400">
              {formatTime(player.duration)}
            </span>
            <button
              onClick={player.togglePlay}
              aria-label={`${player.isPlaying ? t('audioPlayer.pauseAudio') : t('audioPlayer.playAudio')}: ${title}`}
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-600
                         text-white shadow-sm transition-colors hover:bg-amber-700 active:bg-amber-800"
            >
              {player.isLoading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : player.isPlaying ? (
                <PauseGlyph />
              ) : (
                <PlayGlyph />
              )}
            </button>
          </div>

          {transcript && (
            <div className="mt-3 border-t border-amber-200/70 pt-2 dark:border-amber-900/40">
              <button
                onClick={() => setIsTranscriptOpen((open) => !open)}
                aria-expanded={isTranscriptOpen}
                className="flex w-full items-center justify-between gap-2 py-1 text-sm font-medium
                           text-stone-600 transition-colors hover:text-amber-700
                           dark:text-stone-300 dark:hover:text-amber-400"
              >
                <span className="flex items-center gap-1.5">
                  <TranscriptGlyph />
                  {t('freeExperience.transcript')}
                </span>
                <span
                  className={`text-stone-400 transition-transform duration-200 ${isTranscriptOpen ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                >
                  <ChevronDownGlyph />
                </span>
              </button>
              {isTranscriptOpen && (
                <p className="mt-2 text-sm leading-relaxed text-stone-600 dark:text-stone-300">
                  {transcript}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function PlayGlyph() {
  return (
    <svg className="ml-0.5 h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

function PauseGlyph() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" />
    </svg>
  )
}

function CheckGlyph() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
      <path d="M4 10l4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ChevronDownGlyph() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M5 8l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function TranscriptGlyph() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M7 3h7l5 5v13H7z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 3v5h5M10 12h6m-6 4h6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
