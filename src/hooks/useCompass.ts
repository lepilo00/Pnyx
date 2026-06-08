import { useState, useEffect, useCallback } from 'react'

export type CompassPermissionState = 'prompt' | 'granted' | 'denied' | 'unavailable'

export interface CompassState {
  heading: number | null
  isAvailable: boolean
  permissionState: CompassPermissionState
  requestPermission: () => Promise<void>
}

type DOEWithPermission = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<'granted' | 'denied'>
}

type DOEWithWebkit = DeviceOrientationEvent & {
  webkitCompassHeading?: number
}

export function useCompass(): CompassState {
  const [heading, setHeading] = useState<number | null>(null)
  const [isAvailable, setIsAvailable] = useState(false)
  const [permissionState, setPermissionState] = useState<CompassPermissionState>('prompt')

  const handleOrientation = useCallback((e: DeviceOrientationEvent) => {
    const webkit = (e as DOEWithWebkit).webkitCompassHeading
    if (webkit != null && isFinite(webkit)) {
      setHeading(webkit)
      setIsAvailable(true)
    } else if (e.alpha != null) {
      setHeading((360 - e.alpha + 360) % 360)
      setIsAvailable(true)
    }
  }, [])

  const startListening = useCallback(() => {
    window.addEventListener('deviceorientation', handleOrientation, true)
    setPermissionState('granted')
  }, [handleOrientation])

  const requestPermission = useCallback(async () => {
    const DOE = DeviceOrientationEvent as DOEWithPermission
    if (typeof DOE.requestPermission === 'function') {
      try {
        const result = await DOE.requestPermission()
        if (result === 'granted') {
          startListening()
        } else {
          setPermissionState('denied')
        }
      } catch {
        setPermissionState('unavailable')
      }
    } else {
      startListening()
    }
  }, [startListening])

  useEffect(() => {
    if (!window.DeviceOrientationEvent) {
      setPermissionState('unavailable')
      return
    }

    const DOE = DeviceOrientationEvent as DOEWithPermission

    // Non-iOS: start immediately, no permission prompt needed
    if (typeof DOE.requestPermission !== 'function') {
      startListening()
    }
    // iOS: stay in 'prompt' state until user taps "Enable compass"

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true)
    }
  }, [startListening, handleOrientation])

  return { heading, isAvailable, permissionState, requestPermission }
}
