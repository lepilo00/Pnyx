import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

export interface AudioPlayerControls {
  hasAudio: boolean
  isPlaying: boolean
  currentTime: number
  duration: number
  isLoading: boolean
  hasError: boolean
  /** True once playback has been started at least once for the current src */
  hasStarted: boolean
  /** True once the current track has played through to the end */
  hasCompleted: boolean
  playbackRate: number
  togglePlay: () => void
  seek: (time: number) => void
  skip: (seconds: number) => void
  setPlaybackRate: (rate: number) => void
  /** The single <audio> element — render it exactly once per track */
  audioElement: ReactNode
}

interface UseAudioPlayerOptions {
  onPlay?: () => void
  onPause?: (position: number, duration: number) => void
  onEnded?: (duration: number) => void
  onPositionRestored?: (position: number, duration: number) => void
  initialPosition?: number
  initialProgressRatio?: number
  initialPlaybackRate?: number
  /** Stable story id. A source change with the same key is a language swap. */
  continuityKey?: string
}

interface PendingSourceContinuity {
  position: number
  progressRatio?: number
  shouldResume: boolean
}

export function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

// Single source of truth for one audio track's playback. Owns the <audio>
// element (returned as audioElement) so multiple player UIs — the full card
// and the sticky mini player — can share identical state without ever
// creating a second audio element for the same track.
export function useAudioPlayer(
  src: string,
  {
    onPlay,
    onPause,
    onEnded,
    onPositionRestored,
    initialPosition = 0,
    initialProgressRatio,
    initialPlaybackRate = 1,
    continuityKey,
  }: UseAudioPlayerOptions = {}
): AudioPlayerControls {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [hasCompleted, setHasCompleted] = useState(false)
  const [playbackRate, setPlaybackRateState] = useState(initialPlaybackRate)
  const pendingSourceContinuity = useRef<PendingSourceContinuity | null>(null)
  const previousSource = useRef({ src, continuityKey })

  const hasAudio = Boolean(src)

  // Callbacks live in a ref so listener binding never depends on their identity
  const callbacksRef = useRef({ onPlay, onPause, onEnded, onPositionRestored })
  useEffect(() => {
    callbacksRef.current = { onPlay, onPause, onEnded, onPositionRestored }
  })

  const handleTimeUpdate = () => {
    const audio = audioRef.current
    if (!audio) return
    setCurrentTime(audio.currentTime)
  }

  const handleLoadedMetadata = () => {
    const audio = audioRef.current
    if (!audio) return
    const mediaDuration = Number.isFinite(audio.duration) ? Math.max(0, audio.duration) : 0
    const continuity = pendingSourceContinuity.current
    pendingSourceContinuity.current = null
    const useInitialRatio = !continuity && Number.isFinite(initialProgressRatio)
    const requestedPosition = continuity
      ? continuity.progressRatio !== undefined && mediaDuration > 0
        ? continuity.progressRatio * mediaDuration
        : continuity.position
      : useInitialRatio && mediaDuration > 0
        ? Math.max(0, Math.min(1, initialProgressRatio ?? 0)) * mediaDuration
        : initialPosition
    const maximumPosition = mediaDuration > 0 ? Math.max(0, mediaDuration - 0.05) : Math.max(0, requestedPosition)
    const restoredPosition = Math.max(0, Math.min(requestedPosition, maximumPosition))

    setDuration(mediaDuration)
    if (restoredPosition > 0) {
      try { audio.currentTime = restoredPosition } catch { /* media may not be seekable yet */ }
      setCurrentTime(restoredPosition)
    }
    audio.playbackRate = initialPlaybackRate
    setIsLoading(false)

    if ((continuity || useInitialRatio) && mediaDuration > 0) {
      callbacksRef.current.onPositionRestored?.(restoredPosition, mediaDuration)
    }
    if (continuity?.shouldResume) {
      setIsLoading(true)
      void audio.play().then(() => {
        setIsPlaying(true)
        setIsLoading(false)
        setHasStarted(true)
      }).catch((error: unknown) => {
        setIsPlaying(false)
        setIsLoading(false)
        if (!(error instanceof DOMException && error.name === 'AbortError')) setHasError(true)
      })
    }
  }

  const handlePause = () => {
    const audio = audioRef.current
    if (!audio) return
    setIsPlaying(false)
    if (!audio.ended && !pendingSourceContinuity.current) callbacksRef.current.onPause?.(audio.currentTime, audio.duration)
  }

  const handleEnded = () => {
    const audio = audioRef.current
    if (!audio) return
    setIsPlaying(false)
    setCurrentTime(audio.duration)
    setHasCompleted(true)
    callbacksRef.current.onEnded?.(audio.duration)
  }

  const handleError = () => {
    pendingSourceContinuity.current = null
    setHasError(true); setIsLoading(false); setIsPlaying(false)
  }

  // Capture the outgoing media state before paint. The same story id means the
  // new source is a localized version; a different id is a normal track change.
  useLayoutEffect(() => {
    if (previousSource.current.src === src && previousSource.current.continuityKey === continuityKey) return
    const isLocalizedReplacement = Boolean(
      src && previousSource.current.src && continuityKey && previousSource.current.continuityKey === continuityKey
    )
    pendingSourceContinuity.current = isLocalizedReplacement
      ? {
          position: currentTime,
          progressRatio: duration > 0 ? Math.max(0, Math.min(1, currentTime / duration)) : undefined,
          shouldResume: isPlaying,
        }
      : null
    previousSource.current = { src, continuityKey }
    setIsPlaying(false); setCurrentTime(0); setDuration(0)
    setHasError(false); setIsLoading(false); setHasStarted(false); setHasCompleted(false)
  }, [continuityKey, currentTime, duration, isPlaying, src])

  const togglePlay = async () => {
    const audio = audioRef.current
    if (!audio || !hasAudio) return
    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
      return
    }
    setHasError(false)
    setIsLoading(true)
    try {
      // Only one inline player should be audible at a time.
      document.querySelectorAll('audio').forEach((otherAudio) => {
        if (otherAudio !== audio && !otherAudio.paused) otherAudio.pause()
      })
      if (audio.ended) {
        audio.currentTime = 0
        setCurrentTime(0)
      }
      await audio.play()
      setIsPlaying(true)
      setIsLoading(false)
      setHasStarted(true)
      callbacksRef.current.onPlay?.()
    } catch (err) {
      // pause() during a pending play() aborts it — not a real failure
      if (err instanceof DOMException && err.name === 'AbortError') {
        setIsLoading(false)
        return
      }
      setHasError(true)
      setIsLoading(false)
    }
  }

  const seek = (time: number) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = time
    setCurrentTime(time)
  }

  const skip = (seconds: number) => seek(currentTime + seconds)

  const setPlaybackRate = (rate: number) => {
    const audio = audioRef.current
    if (audio) audio.playbackRate = rate
    setPlaybackRateState(rate)
  }

  const audioElement = hasAudio ? (
    <audio
      ref={audioRef}
      src={src}
      preload="metadata"
      onTimeUpdate={handleTimeUpdate}
      onLoadedMetadata={handleLoadedMetadata}
      onCanPlay={() => setIsLoading(false)}
      onPause={handlePause}
      onEnded={handleEnded}
      onError={handleError}
      onWaiting={() => setIsLoading(true)}
    />
  ) : null

  return {
    hasAudio,
    isPlaying,
    currentTime,
    duration,
    isLoading,
    hasError,
    hasStarted,
    hasCompleted,
    playbackRate,
    togglePlay,
    seek,
    skip,
    setPlaybackRate,
    audioElement,
  }
}
