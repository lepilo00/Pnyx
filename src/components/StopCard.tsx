import type { Stop } from '@/lib/types'

interface StopCardProps {
  stop: Stop
  isCurrentStop?: boolean
  onClick?: () => void
}

export default function StopCard({ stop, isCurrentStop, onClick }: StopCardProps) {
  const excerpt =
    stop.description.length > 85 ? stop.description.slice(0, 85) + '…' : stop.description

  return (
    <div
      onClick={onClick}
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
          {stop.order_index}
        </span>
        <div className="min-w-0">
          <p className="font-semibold text-stone-800 dark:text-stone-100 text-sm leading-snug">
            {stop.title}
          </p>
          <p className="text-stone-500 dark:text-stone-400 text-xs mt-1 leading-relaxed">
            {excerpt}
          </p>
        </div>
      </div>
    </div>
  )
}
