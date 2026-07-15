import { useSyncExternalStore } from 'react'
import type { Stop } from './types'

// Honor-system unlock state, persisted only for the current browser session.
// A tiny module-level store (instead of a Context) so any component can
// subscribe via useEntitlements() and re-render the moment the visitor
// confirms a donation or one-time payment.

const UNLOCK_KEY = 'dw-unlocked'

export type UnlockMethod = 'donation' | 'purchase'

interface Snapshot {
  unlocked: boolean
}

function readSnapshot(): Snapshot {
  try {
    return {
      unlocked: sessionStorage.getItem(UNLOCK_KEY) !== null,
    }
  } catch {
    return { unlocked: false }
  }
}

let snapshot: Snapshot = readSnapshot()
const listeners = new Set<() => void>()

function notify() {
  snapshot = readSnapshot()
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot(): Snapshot {
  return snapshot
}

export function isUnlocked(): boolean {
  return snapshot.unlocked
}

export function setUnlocked(method: UnlockMethod): void {
  try {
    sessionStorage.setItem(UNLOCK_KEY, JSON.stringify({ method, at: new Date().toISOString() }))
  } catch {
    // Private mode etc. — unlock still applies for this page load via the snapshot below.
    snapshot = { ...snapshot, unlocked: true }
    listeners.forEach((listener) => listener())
    return
  }
  notify()
}

// A chapter is locked only when the admin marked it paid AND the visitor has
// not unlocked. With no paid chapters the whole experience is free.
export function isStopLocked(stop: Stop, unlocked: boolean): boolean {
  return !!stop.is_paid && !unlocked
}

export function useEntitlements() {
  const { unlocked } = useSyncExternalStore(subscribe, getSnapshot)
  return {
    unlocked,
    unlock: setUnlocked,
  }
}
