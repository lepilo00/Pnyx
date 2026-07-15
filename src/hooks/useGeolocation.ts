import { useState, useEffect } from 'react'

export interface GeoPosition {
  lat: number
  lon: number
  accuracy: number
  heading: number | null
}

interface GeolocationState {
  position: GeoPosition | null
  error: string | null
  isLoading: boolean
}

export function useGeolocation(): GeolocationState {
  const [state, setState] = useState<GeolocationState>(() =>
    typeof navigator !== 'undefined' && navigator.geolocation
      ? { position: null, error: null, isLoading: true }
      : { position: null, error: 'Geolocation is not supported by your browser.', isLoading: false }
  )

  useEffect(() => {
    if (!navigator.geolocation) return

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setState({
          position: {
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            heading: pos.coords.heading,
          },
          error: null,
          isLoading: false,
        })
      },
      (err) => {
        const messages: Record<number, string> = {
          1: 'Location access was denied. Please allow location access in your browser settings.',
          2: 'Your location could not be determined.',
          3: 'Location request timed out.',
        }
        setState({
          position: null,
          error: messages[err.code] ?? 'An unknown location error occurred.',
          isLoading: false,
        })
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  return state
}
