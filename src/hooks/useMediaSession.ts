import { useEffect } from 'react'
import type { AudioPlayerControls } from '@/hooks/useAudioPlayer'

const SEEK_OFFSET_SECONDS = 10

export interface UseMediaSessionOptions {
  player: AudioPlayerControls
  /** Story title shown on the lock screen. */
  title: string
  /** Tour/guide name, shown as artist. */
  artist: string
  album?: string
  /** Absolute or root-relative artwork URL (the source images are ≥512×512). */
  artworkUrl?: string
  /** When set, exposes lock-screen next/previous controls. */
  onNext?: () => void
  onPrevious?: () => void
}

// All navigator.mediaSession access lives here so lock-screen metadata and
// controls stay consistent wherever the shared audio player is used. Playback
// itself stays on the real <audio> element (required for iOS background
// playback) — this hook only mirrors its state. No-ops where unsupported.
export function useMediaSession({ player, title, artist, album = 'PNYX Athens', artworkUrl, onNext, onPrevious }: UseMediaSessionOptions) {
  const { hasAudio, isPlaying, currentTime, duration, playbackRate, togglePlay, seek, skip } = player

  // Metadata — refreshed the moment the active story changes so the lock
  // screen never shows a stale title (including auto-play transitions).
  useEffect(() => {
    if (!('mediaSession' in navigator) || !hasAudio) return
    navigator.mediaSession.metadata = new MediaMetadata({
      title,
      artist,
      album,
      artwork: artworkUrl ? [{ src: artworkUrl, sizes: '512x512', type: 'image/png' }] : [],
    })
    return () => { navigator.mediaSession.metadata = null }
  }, [hasAudio, title, artist, album, artworkUrl])

  // Action handlers.
  useEffect(() => {
    if (!('mediaSession' in navigator) || !hasAudio) return
    const session = navigator.mediaSession
    const handlers: [MediaSessionAction, MediaSessionActionHandler | null][] = [
      ['play', () => { if (!player.isPlaying) void togglePlay() }],
      ['pause', () => { if (player.isPlaying) void togglePlay() }],
      ['seekbackward', (details) => skip(-(details.seekOffset ?? SEEK_OFFSET_SECONDS))],
      ['seekforward', (details) => skip(details.seekOffset ?? SEEK_OFFSET_SECONDS)],
      ['seekto', (details) => { if (typeof details.seekTime === 'number') seek(details.seekTime) }],
      ['nexttrack', onNext ?? null],
      ['previoustrack', onPrevious ?? null],
    ]
    for (const [action, handler] of handlers) {
      try {
        session.setActionHandler(action, handler)
      } catch {
        // Action not supported by this browser — ignore.
      }
    }
    return () => {
      for (const [action] of handlers) {
        try { session.setActionHandler(action, null) } catch { /* ignore */ }
      }
    }
    // player identity changes every render; the specific fields below are what matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAudio, onNext, onPrevious, player.isPlaying])

  // Playback + position state, kept current on play/pause/seek/story change.
  useEffect(() => {
    if (!('mediaSession' in navigator) || !hasAudio) return
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused'
    if ('setPositionState' in navigator.mediaSession && Number.isFinite(duration) && duration > 0) {
      navigator.mediaSession.setPositionState({
        duration,
        playbackRate: playbackRate || 1,
        position: Math.min(Math.max(currentTime, 0), duration),
      })
    }
  }, [hasAudio, isPlaying, currentTime, duration, playbackRate])
}
