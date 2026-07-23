import { Link } from 'react-router-dom'
import PremiumImage from '@/components/PremiumImage'
import StoryIllustration from '@/components/StoryIllustration'
import { getBonusStoryArtwork } from '@/lib/storyArtwork'
import type { Stop } from '@/lib/types'

interface FullExperienceHeroProps {
  eyebrow: string
  title: string
  intro: string
  heroAlt: string
}

export function FullExperienceHero({ eyebrow, title, intro, heroAlt }: FullExperienceHeroProps) {
  return (
    <header className="premium-hero">
      <PremiumImage
        src="/premium/test-slika-tretja-stran-hero.png"
        alt={heroAlt}
        loading="eager"
        containerClassName="premium-hero__art"
        imgClassName="premium-hero__image"
      />
      <div className="premium-hero__veil" aria-hidden="true" />
      <div className="premium-hero__copy">
        <p className="premium-hero__eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="premium-hero__intro">{intro}</p>
      </div>
    </header>
  )
}

export interface ExperienceStat {
  label: string
  value?: string
  icon: 'audio' | 'bonus' | 'languages'
}

export function ExperienceStats({ stats }: { stats: ExperienceStat[] }) {
  return (
    <dl className="premium-stats">
      {stats.map((stat, index) => (
        <div key={stat.icon} className={`premium-stat ${index > 0 ? 'premium-stat--divided' : ''}`}>
          <dt className="premium-stat__icon" aria-hidden="true">
            <StatGlyph icon={stat.icon} />
          </dt>
          <dd>
            {stat.value && <strong>{stat.value}</strong>}
            <span>{stat.label}</span>
          </dd>
        </div>
      ))}
    </dl>
  )
}

interface BonusStoriesSectionProps {
  heading: string
  body: string
  includedLabel: string
  seeAllLabel: string
  stories: Stop[]
  allStops: Stop[]
  unlocked: boolean
}

export function BonusStoriesSection({
  heading,
  body,
  includedLabel,
  seeAllLabel,
  stories,
  allStops,
  unlocked,
}: BonusStoriesSectionProps) {
  return (
    <section aria-labelledby="bonus-heading" className="premium-bonus">
      <div className="premium-bonus__watermark" aria-hidden="true" />
      <div className="premium-bonus__inner">
        <div className="premium-bonus__heading">
          <h2 id="bonus-heading">{heading}</h2>
          <p><strong>{includedLabel} — </strong>{body}</p>
        </div>

        {stories.length > 0 ? (
          <div id="premium-bonus-stories" className="premium-bonus__rail">
            {stories.map((story) => (
              <BonusStoryItem key={story.id} story={story} allStops={allStops} unlocked={unlocked} />
            ))}
          </div>
        ) : (
          <div className="premium-bonus__empty">
            <StoryIllustration src="/premium/bonus.png" alt="" size="large" circular />
          </div>
        )}

        {stories.length > 0 && (
          <a href="#premium-bonus-stories" className="premium-bonus__see-all">
            {seeAllLabel}
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="m5 7.5 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        )}
      </div>
    </section>
  )
}

function BonusStoryItem({ story, allStops, unlocked }: { story: Stop; allStops: Stop[]; unlocked: boolean }) {
  const artwork = getBonusStoryArtwork(story, allStops) || '/premium/bonus.png'
  const artworkClassName = artwork.endsWith('/pericles.png')
    ? 'premium-bonus-card__image premium-bonus-card__image--pericles'
    : 'premium-bonus-card__image'
  const content = (
    <article className="premium-bonus-card">
      <div className="premium-bonus-card__art">
        <StoryIllustration
          src={artwork}
          alt={story.title}
          size="fluid"
          circular
          className="h-full w-full bg-[#f8f1e5] dark:bg-stone-900"
          imgClassName={artworkClassName}
        />
      </div>
      <h3>{story.title}</h3>
    </article>
  )

  if (!unlocked) return content
  return (
    <Link to={`/stop/${story.id}`} state={{ stops: allStops }} className="premium-bonus-card__link">
      {content}
    </Link>
  )
}

interface StickyUnlockBarProps {
  heading: string
  conditions: string
  price: string
  buttonLabel: string
  onUnlock: () => void
}

export function StickyUnlockBar({ heading, conditions, price, buttonLabel, onUnlock }: StickyUnlockBarProps) {
  return (
    <aside className="premium-unlock-dock" aria-label={heading}>
      <div className="premium-unlock-dock__bar">
        <span className="premium-unlock-dock__icon" aria-hidden="true"><LockGlyph /></span>
        <div className="premium-unlock-dock__copy">
          <p>{heading}</p>
          <small>{conditions}</small>
        </div>
        <strong className="premium-unlock-dock__price">{price}</strong>
        <button onClick={onUnlock} className="premium-unlock-dock__button">
          <span>{buttonLabel}</span><ArrowRightGlyph />
        </button>
      </div>
    </aside>
  )
}

function StatGlyph({ icon }: { icon: ExperienceStat['icon'] }) {
  if (icon === 'bonus') {
    return <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3l2.5 5.6 6 .6-4.5 4.1 1.3 5.9L12 16.1l-5.3 3.1 1.3-5.9L3.5 9.2l6-.6L12 3z" /></svg>
  }
  if (icon === 'languages') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <circle cx="12" cy="12" r="8.5" />
        <path d="M3.5 12h17M12 3.5c2.2 2.3 3.2 5.1 3.2 8.5s-1 6.2-3.2 8.5M12 3.5C9.8 5.8 8.8 8.6 8.8 12s1 6.2 3.2 8.5" strokeLinecap="round" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M5 13v5M19 13v5M5 14a7 7 0 0114 0" strokeLinecap="round" />
      <rect x="3.5" y="12" width="4" height="8" rx="1.5" />
      <rect x="16.5" y="12" width="4" height="8" rx="1.5" />
    </svg>
  )
}

function LockGlyph() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M6 8V6a4 4 0 118 0v2h.5A1.5 1.5 0 0116 9.5v6a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 014 15.5v-6A1.5 1.5 0 015.5 8H6zm2 0h4V6a2 2 0 10-4 0v2z" />
    </svg>
  )
}

function ArrowRightGlyph() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 10h12M11 5l5 5-5 5" />
    </svg>
  )
}
