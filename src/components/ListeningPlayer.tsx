import { formatTime } from '@/hooks/useAudioPlayer'
import type { AudioPlayerControls } from '@/hooks/useAudioPlayer'
import { useTranslation } from 'react-i18next'

interface Props { player: AudioPlayerControls; title: string; onPrevious?: () => void; onNext?: () => void }

export default function ListeningPlayer({ player, title, onPrevious, onNext }: Props) {
  const { t } = useTranslation()
  const { currentTime, duration, isPlaying, isLoading, hasAudio, togglePlay, seek } = player
  const progress = duration ? currentTime / duration * 100 : 0
  return (
    <section className="fixed inset-x-0 bottom-0 z-40" aria-label={`Audio player: ${title}`}>
      <div className="mx-auto max-w-lg border-t border-amber-200 bg-parchment-50/95 px-4 pt-2 shadow-[0_-12px_35px_rgba(28,25,23,0.12)] backdrop-blur-xl dark:border-stone-700 dark:bg-stone-900/95" style={{ paddingBottom: 'calc(.6rem + env(safe-area-inset-bottom))' }}>
        <input type="range" min={0} max={duration || 1} value={currentTime} onChange={(event) => seek(Number(event.target.value))} className="audio-scrubber w-full" style={{ '--progress': `${progress}%` } as React.CSSProperties} aria-label="Audio progress" />
        <div className="mt-1 flex items-center justify-between text-[10px] tabular-nums text-stone-500"><span>{formatTime(currentTime)}</span><p className="max-w-[55%] truncate font-semibold text-navy-900 dark:text-stone-100">{title}</p><span>-{formatTime(Math.max(0, duration - currentTime))}</span></div>
        <div className="mx-auto mt-1 grid max-w-xs grid-cols-3 items-center justify-items-center">
          <button onClick={onPrevious} disabled={!onPrevious} className="flex h-11 w-11 items-center justify-center text-2xl text-stone-600 disabled:opacity-25" aria-label={t('listening.previousStory')}>‹</button>
          <button onClick={togglePlay} disabled={!hasAudio || isLoading} className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-600 text-white shadow-md disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-700 focus-visible:ring-offset-2" aria-label={isPlaying ? t('audioPlayer.pauseAudio') : t('audioPlayer.playAudio')}>{isPlaying ? <PauseIcon className="h-5 w-5" /> : <PlayIcon className="ml-0.5 h-5 w-5" />}</button>
          <button onClick={onNext} disabled={!onNext} className="flex h-11 w-11 items-center justify-center text-2xl text-stone-600 disabled:opacity-25" aria-label={t('listening.nextStory')}>›</button>
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
