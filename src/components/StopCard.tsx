import type { Stop } from '@/lib/types'

interface StopCardProps {
  stop: Stop
  isCurrentStop?: boolean
  onClick?: () => void
}

export default function StopCard({ stop, isCurrentStop, onClick }: StopCardProps) {
  const excerpt =
    stop.description.length > 90 ? stop.description.slice(0, 90) + '…' : stop.description

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border p-4 transition-all ${
        onClick ? 'cursor-pointer hover:shadow-sm' : ''
      } ${
        isCurrentStop
          ? 'border-amber-400 bg-amber-50 ring-1 ring-amber-400'
          : 'border-stone-200 bg-white'
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
            isCurrentStop ? 'bg-amber-500 text-white' : 'bg-stone-100 text-stone-500'
          }`}
        >
          {stop.order_index}
        </span>
        <div>
          <p className="font-semibold text-stone-800 text-sm leading-snug">{stop.title}</p>
          <p className="text-stone-500 text-xs mt-1 leading-relaxed">{excerpt}</p>
        </div>
      </div>
    </div>
  )
}
