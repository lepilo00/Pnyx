import { useSyncExternalStore } from 'react'

const PROGRESS_KEY = 'pnyx-listening-progress-v3'

export interface StoryProgress {
  position: number
  duration: number
  completed: boolean
  updatedAt: string
}

interface ListeningProgress {
  lastStoryId?: string
  playbackRate: number
  stories: Record<string, StoryProgress>
}

const EMPTY_PROGRESS: ListeningProgress = { playbackRate: 1, stories: {} }
const listeners = new Set<() => void>()

function readProgress(): ListeningProgress {
  try {
    const value = JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? 'null') as Partial<ListeningProgress> | null
    if (!value || typeof value !== 'object') return EMPTY_PROGRESS
    return {
      lastStoryId: typeof value.lastStoryId === 'string' ? value.lastStoryId : undefined,
      playbackRate: typeof value.playbackRate === 'number' ? value.playbackRate : 1,
      stories: value.stories && typeof value.stories === 'object' ? value.stories : {},
    }
  } catch {
    return EMPTY_PROGRESS
  }
}

let snapshot = readProgress()

function persist(next: ListeningProgress) {
  snapshot = next
  try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(next)) } catch { /* memory fallback */ }
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useListeningProgress(): ListeningProgress {
  return useSyncExternalStore(subscribe, () => snapshot, () => EMPTY_PROGRESS)
}

export function getStoryProgress(storyId: string): StoryProgress | undefined {
  return snapshot.stories[storyId]
}

export function saveStoryProgress(storyId: string, position: number, duration: number, completed = false) {
  if (!storyId) return
  const safeDuration = Number.isFinite(duration) ? Math.max(0, duration) : 0
  const safePosition = completed ? safeDuration : Math.max(0, Math.min(position, safeDuration || position))
  persist({
    ...snapshot,
    lastStoryId: storyId,
    stories: {
      ...snapshot.stories,
      [storyId]: { position: safePosition, duration: safeDuration, completed, updatedAt: new Date().toISOString() },
    },
  })
}

export function savePlaybackRate(playbackRate: number) {
  persist({ ...snapshot, playbackRate })
}

export function useListenedStopIds(): readonly string[] {
  const progress = useListeningProgress()
  return Object.entries(progress.stories).filter(([, value]) => value.completed).map(([id]) => id)
}

export function markStopAsListened(stopId: string): void {
  const previous = snapshot.stories[stopId]
  saveStoryProgress(stopId, previous?.duration ?? 0, previous?.duration ?? 0, true)
}
