import { Link } from 'react-router-dom'
import PremiumImage from '@/components/PremiumImage'
import type { Stop } from '@/lib/types'

interface PremiumDiscoverCardProps {
  imageSrc: string
  title: string
  description: string
  /** When set (content unlocked), the card renders as a link to its chapter. */
  to?: string
  /** Router state passed along with the link, matching the app's `state={{ stops }}` convention. */
  stops?: Stop[]
}

// One "What you'll discover" card: square illustration, title, one-line pitch.
export default function PremiumDiscoverCard({
  imageSrc,
  title,
  description,
  to,
  stops,
}: PremiumDiscoverCardProps) {
  const content = (
    <>
      <PremiumImage src={imageSrc} containerClassName="aspect-square rounded-xl" />
      <h3 className="mt-3 text-sm font-semibold leading-snug text-stone-800 dark:text-stone-100">
        {title}
      </h3>
      <p className="mt-1 text-xs leading-relaxed text-stone-500 dark:text-stone-400">
        {description}
      </p>
    </>
  )

  const cardClass =
    'block rounded-2xl border border-stone-200/70 bg-white p-3 shadow-sm dark:border-stone-800 dark:bg-stone-900'

  if (to) {
    return (
      <Link
        to={to}
        state={{ stops }}
        className={`${cardClass} transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-400/70 hover:shadow-md`}
      >
        {content}
      </Link>
    )
  }

  return <div className={cardClass}>{content}</div>
}
