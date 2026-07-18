import { useEffect, useRef, useState } from 'react'
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
  initialPosition?: number
  initialPlaybackRate?: number
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
  { onPlay, onPause, onEnded, initialPosition = 0, initialPlaybackRate = 1 }: UseAudioPlayerOptions = {}
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

  const hasAudio = Boolean(src)

  // Callbacks live in a ref so listener binding never depends on their identity
  const callbacksRef = useRef({ onPlay, onPause, onEnded })
  useEffect(() => {
    callbacksRef.current = { onPlay, onPause, onEnded }
  })

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onTimeUpdate = () => setCurrentTime(audio.currentTime)
    const onLoadedMetadata = () => {
      setDuration(audio.duration)
      if (initialPosition > 0 && initialPosition < audio.duration - 2) {
        audio.currentTime = initialPosition
        setCurrentTime(initialPosition)
      }
      audio.playbackRate = initialPlaybackRate
      setIsLoading(false)
    }
    const onCanPlay = () => setIsLoading(false)
    const onPauseEvent = () => {
      setIsPlaying(false)
      if (!audio.ended) callbacksRef.current.onPause?.(audio.currentTime, audio.duration)
    }
    const onEnding = () => {
      setIsPlaying(false)
      setCurrentTime(audio.duration)
      setHasCompleted(true)
      callbacksRef.current.onEnded?.(audio.duration)
    }
    const onError = () => { setHasError(true); setIsLoading(false); setIsPlaying(false) }
    const onWaiting = () => setIsLoading(true)

    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('loadedmetadata', onLoadedMetadata)
    audio.addEventListener('canplay', onCanPlay)
    audio.addEventListener('pause', onPauseEvent)
    audio.addEventListener('ended', onEnding)
    audio.addEventListener('error', onError)
    audio.addEventListener('waiting', onWaiting)
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('loadedmetadata', onLoadedMetadata)
      audio.removeEventListener('canplay', onCanPlay)
      audio.removeEventListener('pause', onPauseEvent)
      audio.removeEventListener('ended', onEnding)
      audio.removeEventListener('error', onError)
      audio.removeEventListener('waiting', onWaiting)
    }
  }, [hasAudio, initialPlaybackRate, initialPosition])

  // A new track (chapter change, language change) resets all playback state.
  // State is adjusted during render (https://react.dev/learn/you-might-not-need-an-effect)
  // so the old track's UI state never flashes for the new src.
  const [prevSrc, setPrevSrc] = useState(src)
  if (prevSrc !== src) {
    setPrevSrc(src)
    setIsPlaying(false); setCurrentTime(0); setDuration(0)
    setHasError(false); setIsLoading(false); setHasStarted(false); setHasCompleted(false)
  }

  const togglePlay = async () => {
    const audio = audioRef.current
    if (!audio || !hasAudio) return
    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
      return
    }
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

  const audioElement = hasAudio ? <audio ref={audioRef} src={src} preload="metadata" /> : null

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
