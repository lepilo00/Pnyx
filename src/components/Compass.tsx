import type { CompassPermissionState } from '@/hooks/useCompass'

interface CompassProps {
  deviceHeading: number | null
  bearingToPnyx: number
  isAvailable: boolean
  permissionState: CompassPermissionState
  onRequestPermission: () => void
}

export default function Compass({
  deviceHeading,
  bearingToPnyx,
  isAvailable,
  permissionState,
  onRequestPermission,
}: CompassProps) {
  if (permissionState === 'unavailable' || (permissionState === 'granted' && !isAvailable)) {
    return (
      <p className="text-sm text-stone-400 dark:text-stone-500 text-center py-1">
        Compass is not available on this device/browser.
      </p>
    )
  }

  if (permissionState === 'denied') {
    return (
      <p className="text-sm text-stone-400 dark:text-stone-500 text-center py-1">
        Compass access was denied.
      </p>
    )
  }

  if (permissionState === 'prompt') {
    return (
      <div className="flex flex-col items-center gap-2 py-1">
        <p className="text-xs text-stone-400 dark:text-stone-500 text-center">
          Enable compass to see direction to the Pnyx
        </p>
        <button
          onClick={onRequestPermission}
          className="inline-flex items-center gap-2 px-4 py-2
                     bg-stone-100 dark:bg-stone-800
                     hover:bg-stone-200 dark:hover:bg-stone-700
                     text-stone-700 dark:text-stone-300
                     rounded-xl text-sm font-medium transition-colors"
        >
          🧭 Enable compass
        </button>
      </div>
    )
  }

  // granted + isAvailable + heading available — waiting for first reading
  if (deviceHeading === null) {
    return (
      <div className="flex items-center justify-center gap-2 py-2 text-stone-400 dark:text-stone-500">
        <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm">Waiting for compass…</p>
      </div>
    )
  }

  const arrowAngle = (bearingToPnyx - deviceHeading + 360) % 360

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-xs uppercase tracking-widest text-amber-600 dark:text-amber-500 font-semibold">
        Direction to Pnyx
      </p>

      {/* Compass rose */}
      <div className="relative w-24 h-24">
        {/* N/S/E/W labels */}
        <span className="absolute top-0 left-1/2 -translate-x-1/2 text-[9px] font-bold text-stone-400 dark:text-stone-500">N</span>
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[9px] font-bold text-stone-400 dark:text-stone-500">S</span>
        <span className="absolute left-0 top-1/2 -translate-y-1/2 text-[9px] font-bold text-stone-400 dark:text-stone-500">W</span>
        <span className="absolute right-0 top-1/2 -translate-y-1/2 text-[9px] font-bold text-stone-400 dark:text-stone-500">E</span>

        {/* Circle */}
        <div className="absolute inset-3 rounded-full border-2 border-stone-200 dark:border-stone-700
                        bg-white dark:bg-stone-900 shadow-sm flex items-center justify-center">
          {/* Arrow pointing to Pnyx */}
          <svg
            width="28"
            height="28"
            viewBox="0 0 28 28"
            style={{
              transform: `rotate(${arrowAngle}deg)`,
              transition: 'transform 0.25s ease-out',
            }}
            aria-label={`${Math.round(arrowAngle)} degrees to Pnyx`}
          >
            {/* Up = towards Pnyx */}
            <polygon points="14,2 18,22 14,19 10,22" fill="#d97706" />
            {/* Down half */}
            <polygon points="14,26 10,8 14,11 18,8" fill="#a8a29e" opacity="0.4" />
          </svg>
        </div>
      </div>

      <p className="text-xs text-stone-400 dark:text-stone-500">
        {Math.round(arrowAngle)}° · {cardinalDirection(arrowAngle)}
      </p>
    </div>
  )
}

function cardinalDirection(deg: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  return dirs[Math.round(deg / 45) % 8]
}
