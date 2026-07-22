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
    <header className="bg-[#faf4e8] dark:bg-stone-900 lg:grid lg:min-h-[26rem] lg:grid-cols-[0.82fr_1.18fr]">
      <div className="flex flex-col justify-center px-5 pb-5 pt-6 min-[390px]:px-7 min-[390px]:pb-6 min-[390px]:pt-7 lg:px-12 lg:py-14 xl:px-16">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-navy-900 dark:text-amber-400">{eyebrow}</p>
        <h1 className="mt-1.5 max-w-[12ch] font-serif text-[2.15rem] font-bold leading-[1.02] tracking-[-0.025em] text-navy-900 min-[390px]:text-[2.55rem] lg:text-5xl dark:text-stone-50">{title}</h1>
        <p className="mt-3 max-w-[42ch] text-xs leading-[1.55] text-stone-700 min-[390px]:text-[13px] lg:mt-5 lg:text-sm lg:leading-6 dark:text-stone-300">{intro}</p>
      </div>
      <PremiumImage
        src="/premium/hero.png"
        alt={heroAlt}
        loading="eager"
        containerClassName="aspect-[2.12/1] min-h-[10.5rem] bg-[#faf4e8] lg:aspect-auto lg:min-h-full"
        imgClassName="h-full w-full object-cover object-[58%_center] lg:object-[62%_center]"
      />
    </header>
  )
}

export interface ExperienceStat {
  label: string
  icon: 'audio' | 'bonus' | 'duration'
}

export function ExperienceStats({ stats }: { stats: ExperienceStat[] }) {
  return (
    <dl className="grid grid-cols-3 bg-navy-900 px-2 py-3 text-white min-[390px]:px-4 min-[390px]:py-4 lg:px-8 lg:py-5">
      {stats.map((stat, index) => (
        <div key={stat.icon} className={`flex min-w-0 flex-col items-center gap-2 px-1 text-center min-[480px]:flex-row min-[480px]:gap-2.5 min-[480px]:px-2 min-[600px]:justify-center lg:px-5 ${index > 0 ? 'border-l border-white/20' : ''}`}>
          <dt className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-amber-500 text-amber-400 min-[480px]:h-11 min-[480px]:w-11" aria-hidden="true">
            <StatGlyph icon={stat.icon} />
          </dt>
          <dd className="min-w-0 max-w-[11rem] break-words text-[9px] font-semibold uppercase leading-[1.35] tracking-[0.03em] text-stone-100 min-[430px]:text-[10px] min-[480px]:text-left lg:text-xs">{stat.label}</dd>
        </div>
      ))}
    </dl>
  )
}

interface BonusStoriesSectionProps {
  heading: string
  body: string
  includedLabel: string
  stories: Stop[]
  allStops: Stop[]
  unlocked: boolean
}

export function BonusStoriesSection({ heading, body, includedLabel, stories, allStops, unlocked }: BonusStoriesSectionProps) {
  return (
    <section aria-labelledby="bonus-heading" className="border-y border-amber-200/80 bg-[#f2f1ed] px-5 py-7 min-[390px]:px-7 lg:px-12 lg:py-10 dark:border-stone-700 dark:bg-stone-900/65">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="bonus-heading" className="font-serif text-2xl font-bold leading-tight text-navy-900 lg:text-3xl dark:text-stone-100">{heading}</h2>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-stone-600 lg:text-sm dark:text-stone-400">{body}</p>
          </div>
          <span className="shrink-0 border border-amber-600/55 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-amber-800 dark:text-amber-400">{includedLabel}</span>
        </div>

        {stories.length > 0 ? (
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-6 min-[390px]:grid-cols-3 lg:mt-8 lg:gap-x-8 lg:gap-y-8">
            {stories.map((story) => (
              <BonusStoryItem key={story.id} story={story} allStops={allStops} unlocked={unlocked} />
            ))}
          </div>
        ) : (
          <div className="mt-5 flex justify-center">
            <StoryIllustration src="/premium/bonus.png" alt="" size="large" circular />
          </div>
        )}
      </div>
    </section>
  )
}

function BonusStoryItem({ story, allStops, unlocked }: { story: Stop; allStops: Stop[]; unlocked: boolean }) {
  const content = (
    <article className="group flex h-full flex-col items-center text-center">
      <StoryIllustration
        src={getBonusStoryArtwork(story, allStops) || '/premium/bonus.png'}
        alt={story.title}
        size="large"
        circular
        className="border border-amber-200/80 transition-transform group-hover:-translate-y-0.5 dark:border-stone-700"
      />
      <h3 className="mt-2.5 max-w-[15ch] font-serif text-sm font-bold leading-[1.25] text-navy-900 dark:text-stone-100">{story.title}</h3>
      {story.subtitle && <p className="mt-1 text-[10px] leading-snug text-stone-500 dark:text-stone-400">{story.subtitle}</p>}
    </article>
  )

  if (!unlocked) return content
  return (
    <Link to={`/stop/${story.id}`} state={{ stops: allStops }} className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-700 focus-visible:ring-offset-4">
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
    <aside className="fixed inset-x-0 bottom-0 z-30 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] md:hidden" aria-label={heading}>
      <div className="mx-auto grid max-w-lg grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border border-navy-700 bg-navy-900 p-2 text-white shadow-[0_-6px_24px_rgba(15,23,48,0.16)] min-[390px]:grid-cols-[minmax(0,1fr)_auto_auto]">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-amber-600 text-amber-400" aria-hidden="true"><LockGlyph /></span>
          <div className="min-w-0">
            <p className="line-clamp-2 font-serif text-xs font-bold leading-tight min-[390px]:text-sm">{heading}</p>
            <p className="mt-0.5 hidden truncate text-[8px] text-stone-300 min-[390px]:block">{conditions}</p>
          </div>
        </div>
        <strong className="font-serif text-base text-white min-[390px]:text-lg">{price}</strong>
        <button onClick={onUnlock} className="col-span-2 min-h-11 w-full bg-amber-600 px-2.5 text-[11px] font-bold leading-tight text-white transition-colors hover:bg-amber-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-900 active:bg-amber-700 min-[390px]:col-span-1 min-[390px]:max-w-[8rem] min-[430px]:px-4 min-[430px]:text-xs">
          <span className="flex items-center justify-center gap-1">{buttonLabel}<ArrowRightGlyph /></span>
        </button>
      </div>
    </aside>
  )
}

function StatGlyph({ icon }: { icon: ExperienceStat['icon'] }) {
  if (icon === 'bonus') return <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3l2.5 5.6 6 .6-4.5 4.1 1.3 5.9L12 16.1l-5.3 3.1 1.3-5.9L3.5 9.2l6-.6L12 3z" /></svg>
  if (icon === 'duration') return <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" strokeLinecap="round" /></svg>
  return <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 10v4m4.5-8v12M14 7v10m4.5-6v2" /></svg>
}

function LockGlyph() {
  return <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M6 8V6a4 4 0 118 0v2h.5A1.5 1.5 0 0116 9.5v6a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 014 15.5v-6A1.5 1.5 0 015.5 8H6zm2 0h4V6a2 2 0 10-4 0v2z" /></svg>
}

function ArrowRightGlyph() {
  return <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 10h12M11 5l5 5-5 5" /></svg>
}
