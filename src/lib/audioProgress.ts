import { useSyncExternalStore } from 'react'

// Product-specific, versioned key. Older keys can contain stale development
// progress that incorrectly pre-marks a chapter as listened.
const LISTENED_STOPS_KEY = 'pnyx-listened-stops-v2'

interface Snapshot {
  listenedStopIds: readonly string[]
}

const listeners = new Set<() => void>()

function readListenedStops(): readonly string[] {
  try {
    const stored = JSON.parse(localStorage.getItem(LISTENED_STOPS_KEY) ?? '[]')
    return Array.isArray(stored)
      ? [...new Set(stored.filter((id): id is string => typeof id === 'string'))]
      : []
  } catch {
    return []
  }
}

let snapshot: Snapshot = { listenedStopIds: readListenedStops() }

function subscribe(listener: () => void): () => void {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === LISTENED_STOPS_KEY) notify(readListenedStops())
  }

  listeners.add(listener)
  if (typeof window !== 'undefined') window.addEventListener('storage', handleStorage)

  return () => {
    listeners.delete(listener)
    if (typeof window !== 'undefined') window.removeEventListener('storage', handleStorage)
  }
}

function getSnapshot(): Snapshot {
  return snapshot
}

function notify(listenedStopIds: readonly string[]): void {
  snapshot = { listenedStopIds }
  listeners.forEach((listener) => listener())
}

export function useListenedStopIds(): readonly string[] {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot).listenedStopIds
}

export function markStopAsListened(stopId: string): void {
  const listenedStops = new Set([...readListenedStops(), ...snapshot.listenedStopIds])
  if (listenedStops.has(stopId)) return

  listenedStops.add(stopId)
  const listenedStopIds = [...listenedStops]
  try {
    localStorage.setItem(LISTENED_STOPS_KEY, JSON.stringify(listenedStopIds))
  } catch {
    // Keep the in-memory progress reactive when storage is unavailable.
  }
  notify(listenedStopIds)
}
