import { Link } from 'react-router-dom'
import StoryIllustration from '@/components/StoryIllustration'
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
    <article className="flex min-h-[6.25rem] items-center gap-3 py-3.5 transition-colors group-hover:bg-amber-50/60 min-[430px]:gap-4 min-[430px]:py-4 dark:group-hover:bg-stone-900/50">
      <StoryIllustration src={imageSrc} alt={title} size="medium" circular />
      <div className="min-w-0 flex-1">
        <h3 className="font-serif text-[15px] font-bold leading-[1.22] text-navy-900 min-[430px]:text-base dark:text-stone-100">{title}</h3>
        <p className="mt-1 text-[11px] leading-[1.45] text-stone-600 min-[430px]:text-xs dark:text-stone-400">{description}</p>
      </div>
      {to && <ChevronGlyph />}
    </article>
  )

  if (!to) return content
  return (
    <Link to={to} state={{ stops }} className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-700">
      {content}
    </Link>
  )
}

function ChevronGlyph() {
  return (
    <svg className="h-5 w-5 shrink-0 text-navy-900 dark:text-stone-300" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="m7.5 4.5 5 5.5-5 5.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
