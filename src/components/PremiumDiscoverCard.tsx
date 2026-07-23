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
    <article className="premium-discover-card">
      <div className="premium-discover-card__art">
        <StoryIllustration
          src={imageSrc}
          alt={title}
          size="fluid"
          className="h-full w-full bg-[#fcf8f0] dark:bg-stone-900"
          imgClassName="premium-discover-card__image"
        />
      </div>
      <div className="premium-discover-card__copy">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <ChevronGlyph />
    </article>
  )

  if (!to) return content
  return (
    <Link to={to} state={{ stops }} className="premium-discover-card__link">
      {content}
    </Link>
  )
}

function ChevronGlyph() {
  return (
    <svg className="premium-discover-card__chevron" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="m7.5 4.5 5 5.5-5 5.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
