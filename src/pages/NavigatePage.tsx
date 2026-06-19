import { lazy, Suspense, useState } from 'react'
import Layout from '@/components/Layout'
import Compass from '@/components/Compass'
import ArrivalGalleryModal from '@/components/ArrivalGalleryModal'
import { useGeolocation } from '@/hooks/useGeolocation'
import { useCompass } from '@/hooks/useCompass'
import { track } from '@/lib/analytics'
import { PNYX_GALLERY_IMAGES } from '@/data/pnyxImages'

const MapNavigation = lazy(() => import('@/components/MapNavigation'))

const PNYX = { lat: 37.9715, lon: 23.7196 }
const GOOGLE_MAPS_URL =
  `https://www.google.com/maps/dir/?api=1&destination=${PNYX.lat},${PNYX.lon}&travelmode=walking`
const STREET_VIEW_URL =
  `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${PNYX.lat},${PNYX.lon}`

function toRad(d: number) { return (d * Math.PI) / 180 }

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function bearingDeg(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLon = toRad(lon2 - lon1)
  const y = Math.sin(dLon) * Math.cos(toRad(lat2))
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon)
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
}

function formatDistance(m: number): string {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`
}

export default function NavigatePage() {
  const { position, error: geoError, isLoading } = useGeolocation()
  const { heading, isAvailable, permissionState, requestPermission } = useCompass()
  const [isArrivalModalOpen, setIsArrivalModalOpen] = useState(false)

  const distance =
    position ? haversineMeters(position.lat, position.lon, PNYX.lat, PNYX.lon) : null
  const bearingToPnyx =
    position ? bearingDeg(position.lat, position.lon, PNYX.lat, PNYX.lon) : 0

  return (
    <Layout>
      <div className="space-y-5">
        {/* Header */}
        <div>
          <p className="text-xs uppercase tracking-widest text-amber-600 dark:text-amber-500 font-semibold mb-1">
            Navigate
          </p>
          <h1 className="font-serif text-2xl font-bold text-stone-900 dark:text-stone-100 leading-tight">
            Get to the Pnyx
          </h1>
          <p className="text-stone-500 dark:text-stone-400 text-sm mt-1">
            Pnyx Hill · Athens, Greece
          </p>
        </div>

        {/* Map */}
        <div className="rounded-2xl overflow-hidden border border-stone-100 dark:border-stone-800 shadow-sm">
          <Suspense
            fallback={
              <div className="w-full h-72 bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                <div className="w-7 h-7 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
              </div>
            }
          >
            <MapNavigation
              userLat={position?.lat ?? null}
              userLon={position?.lon ?? null}
              accuracy={position?.accuracy ?? null}
            />
          </Suspense>
        </div>

        {/* Distance card */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-800 shadow-sm p-4">
          {isLoading && (
            <div className="flex items-center gap-3 text-stone-500 dark:text-stone-400">
              <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              <p className="text-sm">Acquiring your location…</p>
            </div>
          )}

          {geoError && (
            <p className="text-sm text-red-600 dark:text-red-400">{geoError}</p>
          )}

          {distance !== null && (
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs text-stone-400 dark:text-stone-500 uppercase tracking-widest font-semibold mb-0.5">
                  Distance to Pnyx
                </p>
                <p className="font-serif text-3xl font-bold text-stone-900 dark:text-stone-100 leading-none">
                  {formatDistance(distance)}
                </p>
              </div>
              {position?.accuracy != null && (
                <p className="text-xs text-stone-400 dark:text-stone-500 pb-0.5">
                  ±{Math.round(position.accuracy)} m accuracy
                </p>
              )}
            </div>
          )}
        </div>

        {/* Compass card */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-800 shadow-sm p-5">
          <Compass
            deviceHeading={heading}
            bearingToPnyx={bearingToPnyx}
            isAvailable={isAvailable}
            permissionState={permissionState}
            onRequestPermission={requestPermission}
          />
        </div>

        {/* Google Maps CTA */}
        <a
          href={GOOGLE_MAPS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full
                     bg-white dark:bg-stone-900
                     hover:bg-stone-50 dark:hover:bg-stone-800
                     border border-stone-200 dark:border-stone-700
                     text-stone-700 dark:text-stone-200
                     font-semibold py-4 rounded-2xl transition-colors shadow-sm"
        >
          <svg className="w-5 h-5 text-stone-400 dark:text-stone-500" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
          </svg>
          Open in Google Maps
        </a>

        {/* Arrival CTA */}
        <button
          onClick={() => {
            setIsArrivalModalOpen(true)
            void track('destination_arrived', '/navigate')
          }}
          className="flex items-center justify-center gap-2 w-full
                     bg-amber-600 hover:bg-amber-700 active:bg-amber-800
                     text-white font-semibold py-4 rounded-2xl
                     transition-colors shadow-lg shadow-amber-200 dark:shadow-amber-900/30"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          I've arrived
        </button>

        {/* Safety note */}
        <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 p-4 text-sm text-stone-700 dark:text-stone-300">
          <p className="leading-relaxed">
            <strong className="font-semibold text-stone-800 dark:text-stone-200">Safety: </strong>
            Use the map only as assistance. Always follow local signs, paths and safety rules.
          </p>
        </div>

        <p className="text-xs text-stone-400 dark:text-stone-500 text-center leading-relaxed pb-2">
          This is not turn-by-turn navigation and does not replace Google Maps or professional navigation tools.
        </p>
      </div>

      <ArrivalGalleryModal
        isOpen={isArrivalModalOpen}
        onClose={() => setIsArrivalModalOpen(false)}
        images={PNYX_GALLERY_IMAGES}
        streetViewUrl={STREET_VIEW_URL}
      />
    </Layout>
  )
}
