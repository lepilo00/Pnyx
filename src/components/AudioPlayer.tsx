import { useRef, useState, useEffect } from 'react'

interface AudioPlayerProps {
  src: string
  title: string
  onPlay?: () => void
  onEnded?: () => void
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function AudioPlayer({ src, title, onPlay, onEnded }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)

  const hasAudio = Boolean(src)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onTimeUpdate = () => setCurrentTime(audio.currentTime)
    const onLoadedMetadata = () => {
      setDuration(audio.duration)
      setIsLoading(false)
    }
    const onCanPlay = () => setIsLoading(false)
    const onEnding = () => {
      setIsPlaying(false)
      setCurrentTime(0)
      onEnded?.()
    }
    const onError = () => {
      setHasError(true)
      setIsLoading(false)
      setIsPlaying(false)
    }
    const onWaiting = () => setIsLoading(true)

    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('loadedmetadata', onLoadedMetadata)
    audio.addEventListener('canplay', onCanPlay)
    audio.addEventListener('ended', onEnding)
    audio.addEventListener('error', onError)
    audio.addEventListener('waiting', onWaiting)

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('loadedmetadata', onLoadedMetadata)
      audio.removeEventListener('canplay', onCanPlay)
      audio.removeEventListener('ended', onEnding)
      audio.removeEventListener('error', onError)
      audio.removeEventListener('waiting', onWaiting)
    }
  }, [onEnded])

  // Reset player when src changes
  useEffect(() => {
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)
    setHasError(false)
    setIsLoading(false)
  }, [src])

  const togglePlay = async () => {
    const audio = audioRef.current
    if (!audio || !hasAudio) return

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      setIsLoading(true)
      try {
        await audio.play()
        setIsPlaying(true)
        onPlay?.()
      } catch {
        setHasError(true)
        setIsLoading(false)
      }
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    if (!audio) return
    const time = Number(e.target.value)
    audio.currentTime = time
    setCurrentTime(time)
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-4">
      {/* Hidden audio element — controlled imperatively */}
      {hasAudio && <audio ref={audioRef} src={src} preload="metadata" />}

      <p className="text-sm font-medium text-stone-500 mb-3">{title}</p>

      {/* Scrubber */}
      <input
        type="range"
        min={0}
        max={duration || 1}
        value={currentTime}
        onChange={handleSeek}
        disabled={!hasAudio || hasError}
        className="w-full mb-1 accent-amber-600 disabled:opacity-40"
        aria-label="Audio progress"
      />

      <div className="flex justify-between text-xs text-stone-400 mb-3">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      <button
        onClick={togglePlay}
        disabled={!hasAudio || hasError || isLoading}
        className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-stone-200 disabled:text-stone-400
                   text-white font-semibold py-3 rounded-xl transition-colors
                   flex items-center justify-center gap-2 text-base"
        aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
      >
        {isLoading ? (
          <>
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Loading…
          </>
        ) : isPlaying ? (
          <>
            <PauseIcon />
            Pause
          </>
        ) : hasError ? (
          'Audio unavailable'
        ) : !hasAudio ? (
          'Audio coming soon'
        ) : (
          <>
            <PlayIcon />
            Play audio
          </>
        )}
      </button>
    </div>
  )
}

function PlayIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.344-5.891a1.5 1.5 0 000-2.538L6.3 2.84z" />
    </svg>
  )
}

function PauseIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M5.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75A.75.75 0 007.25 3h-1.5zm6.5 0a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75a.75.75 0 00-.75-.75h-1.5z" />
    </svg>
  )
}
