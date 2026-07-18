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
    <article className="flex h-full gap-4 p-4 transition-colors group-hover:bg-white/35 dark:group-hover:bg-stone-900/35">
      <PremiumImage src={imageSrc} containerClassName="h-20 w-20 shrink-0 rounded-md min-[430px]:h-24 min-[430px]:w-24" imgClassName="h-full w-full object-cover" />
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
