import type { Stop } from '@/lib/types'

interface StopCardProps {
  stop: Stop
  isCurrentStop?: boolean
  /** Paid chapter the visitor has not unlocked yet — tap leads to the premium screen. */
  locked?: boolean
  onClick?: () => void
  /** Max excerpt length in characters; 0 hides the description entirely. */
  excerptChars?: number
}

export default function StopCard({
  stop,
  isCurrentStop,
  locked,
  onClick,
  excerptChars = 85,
}: StopCardProps) {
  const excerpt =
    stop.description.length > excerptChars
      ? stop.description.slice(0, excerptChars).trimEnd() + '…'
      : stop.description

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick()
              }
            }
          : undefined
      }
      className={`rounded-2xl border p-4 transition-all duration-200 ${
        onClick ? 'cursor-pointer active:scale-[0.99]' : ''
      } ${
        isCurrentStop
          ? 'border-amber-400 dark:border-amber-500 bg-amber-50 dark:bg-amber-950/20 ring-1 ring-amber-400 dark:ring-amber-500'
          : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-stone-300 dark:hover:border-stone-700'
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
            isCurrentStop
              ? 'bg-amber-500 text-white'
              : 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400'
          }`}
        >
          {locked ? <LockIcon /> : stop.order_index}
        </span>
        <div className="min-w-0">
          <p
            className={`font-semibold text-sm leading-snug ${
              locked
                ? 'text-stone-500 dark:text-stone-400'
                : 'text-stone-800 dark:text-stone-100'
            }`}
          >
            {stop.title}
          </p>
          {excerptChars > 0 && !locked && (
            <p className="text-stone-500 dark:text-stone-400 text-xs mt-1 leading-relaxed">
              {excerpt}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function LockIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  )
}
