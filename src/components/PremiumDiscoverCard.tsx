import { Link } from 'react-router-dom'
import PremiumImage from '@/components/PremiumImage'
import type { Stop } from '@/lib/types'

interface PremiumDiscoverCardProps {
  imageSrc: string
  title: string
  description: string
  to?: string
  stops?: Stop[]
}

export default function PremiumDiscoverCard({ imageSrc, title, description, to, stops }: PremiumDiscoverCardProps) {
  const content = (
    <article className="flex h-full gap-4 bg-[#f4ecdf]/55 p-4 transition-colors group-hover:bg-[#f1e6d5]/75 dark:bg-stone-900/30 dark:group-hover:bg-stone-900/55">
      <PremiumImage src={imageSrc} containerClassName="h-24 w-24 shrink-0 rounded-md min-[600px]:h-28 min-[600px]:w-28" imgClassName="h-full w-full object-cover" />
      <div className="min-w-0">
        <h3 className="font-serif text-[15px] font-bold leading-[1.25] text-stone-900 min-[600px]:text-base dark:text-stone-100">{title}</h3>
        <p className="mt-1.5 text-xs leading-[1.5] text-stone-600 dark:text-stone-400">{description}</p>
      </div>
    </article>
  )

  if (!to) return content
  return (
    <Link to={to} state={{ stops }} className="group block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-600">
      {content}
    </Link>
  )
}
