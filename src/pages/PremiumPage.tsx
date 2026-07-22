import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from '@/components/Layout'
import DonationQrPanel from '@/components/DonationQrPanel'
import PremiumDiscoverCard from '@/components/PremiumDiscoverCard'
import {
  BonusStoriesSection,
  ExperienceStats,
  FullExperienceHero,
  StickyUnlockBar,
  type ExperienceStat,
} from '@/components/PremiumExperience'
import { supabase } from '@/lib/supabaseClient'
import { track } from '@/lib/analytics'
import { withTimeout } from '@/lib/withTimeout'
import { useFallbackStops } from '@/data/fallbackStops'
import { useLocalizedStops } from '@/lib/useLocalizedStops'
import { useEntitlements } from '@/lib/entitlements'
import { useUnlockPrice } from '@/lib/useAppSettings'
import { UNLOCK } from '@/lib/constants'
import type { Stop } from '@/lib/types'
import { useListeningProgress } from '@/lib/audioProgress'
import { getResumeStory } from '@/lib/resumeStory'
import { groupStories } from '@/lib/storyGroups'

interface PremiumPageState {
  /** Locked chapter the visitor tried to open; continue there after unlocking. */
  fromStopId?: string
  stops?: Stop[]
}

// Marketing copy stays translation-backed. The order maps to paid chapters
// only when all four destinations are unambiguous and already accessible.
const DISCOVER_CARDS = ['assembly', 'citizen', 'questioned', 'legacy'] as const

export default function PremiumPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const fallbackStops = useFallbackStops()
  const { unlocked, unlock } = useEntitlements()
  const listeningProgress = useListeningProgress()
  const unlockPrice = useUnlockPrice()
  const [showPayment, setShowPayment] = useState(false)
  const unlockSectionRef = useRef<HTMLElement>(null)

  const state = (location.state as PremiumPageState | null) ?? {}
  const [stops, setStops] = useState<Stop[]>(state.stops ?? [])

  useEffect(() => {
    if (stops.length > 0) return
    async function loadStops() {
      const result = await withTimeout(
        supabase
          .from('stops')
          .select('*')
          .eq('is_published', true)
          .order('order_index', { ascending: true }),
        3000
      )
      const data = result?.data
      const error = result?.error
      setStops(error || !data || data.length === 0 ? fallbackStops : (data as Stop[]))
    }
    void loadStops()
    // fallbackStops intentionally omitted; localized fallback data is refreshed
    // by the language-bound query effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stops.length, i18n.language])

  useEffect(() => {
    void track('paywall_shown', '/premium', { stop_id: state.fromStopId })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const displayStops = useLocalizedStops(stops)
  const { mainStories, bonusStories } = groupStories(displayStops)
  const paidStops = mainStories.filter((story) => story.is_paid)
  const effectivelyUnlocked = unlocked || paidStops.length === 0
  const linkedStops = effectivelyUnlocked && paidStops.length === DISCOVER_CARDS.length ? paidStops : null

  const continueWalk = () => {
    const target =
      (state.fromStopId && displayStops.find((story) => story.id === state.fromStopId)) ||
      getResumeStory(displayStops, listeningProgress)
    if (target) navigate(`/stop/${target.id}`, { state: { stops } })
    else navigate('/start')
  }

  const handlePaid = () => {
    unlock('purchase')
    void track('unlock_confirmed', '/premium', {
      stop_id: state.fromStopId,
      metadata: { amount: unlockPrice },
    })
    continueWalk()
  }

  const openPayment = () => {
    setShowPayment(true)
    window.requestAnimationFrame(() => {
      unlockSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }

  const priceLabel = `€${unlockPrice.toFixed(2).replace(/\.00$/, '')}`
  const audioLabel = withDynamicCount(t('premium.meta.audio'), mainStories.length)
  const stats: ExperienceStat[] = [
    { icon: 'audio', label: audioLabel },
    { icon: 'bonus', label: t('premium.meta.bonus') },
    { icon: 'duration', label: t('premium.meta.duration') },
  ]

  return (
    <Layout showBack contentWidth="wide">
      <div className={`overflow-hidden bg-parchment-100 dark:bg-stone-950 ${!effectivelyUnlocked && !showPayment ? 'pb-[calc(7rem+env(safe-area-inset-bottom))] min-[390px]:pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0' : ''}`}>
        <FullExperienceHero
          eyebrow={t('premium.eyebrow')}
          title={t('premium.title')}
          intro={t('premium.intro')}
          heroAlt={t('premium.heroAlt')}
        />

        <ExperienceStats stats={stats} />

        <section aria-labelledby="discover-heading" className="px-5 py-7 min-[390px]:px-7 lg:px-12 lg:py-12">
          <div className="mx-auto max-w-4xl">
            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-amber-300/80 dark:bg-stone-700" aria-hidden="true" />
              <h2 id="discover-heading" className="text-center font-serif text-xl font-bold leading-tight text-navy-900 min-[390px]:text-2xl lg:text-3xl dark:text-stone-100">
                {t('premium.discover.heading')}
              </h2>
              <span className="h-px flex-1 bg-amber-300/80 dark:bg-stone-700" aria-hidden="true" />
            </div>

            <div className="mt-4 divide-y divide-amber-200/80 border-y border-amber-200/80 min-[600px]:mt-6 dark:divide-stone-700 dark:border-stone-700">
              {DISCOVER_CARDS.map((cardKey, index) => (
                <PremiumDiscoverCard
                  key={cardKey}
                  imageSrc={`/premium/chapter-${index + 1}.png`}
                  title={t(`premium.discover.${cardKey}.title`)}
                  description={t(`premium.discover.${cardKey}.body`)}
                  to={linkedStops ? `/stop/${linkedStops[index].id}` : undefined}
                  stops={linkedStops ? stops : undefined}
                />
              ))}
            </div>
          </div>
        </section>

        <BonusStoriesSection
          heading={t('premium.bonusBanner.title')}
          body={t('premium.bonusBanner.body')}
          includedLabel={t('premium.bonusBanner.included')}
          stories={bonusStories}
          allStops={stops}
          unlocked={effectivelyUnlocked}
        />

        <section
          ref={unlockSectionRef}
          aria-labelledby="unlock-heading"
          className={`${!effectivelyUnlocked && !showPayment ? 'hidden md:block' : ''} bg-parchment-100 px-4 py-6 min-[390px]:px-7 lg:px-12 lg:py-10 dark:bg-stone-950`}
        >
          <div className="mx-auto max-w-4xl border border-navy-700 bg-navy-900 p-4 text-white min-[390px]:p-5 lg:p-7">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-amber-600 text-amber-400" aria-hidden="true">
                {effectivelyUnlocked ? <CheckGlyph /> : <LockGlyph />}
              </span>
              <div className="min-w-0 flex-1 lg:flex lg:items-start lg:justify-between lg:gap-8">
                <div>
                  <h2 id="unlock-heading" className="font-serif text-xl font-bold leading-snug lg:text-2xl">
                    {effectivelyUnlocked ? t('premium.unlockedHeading') : t('premium.unlock.heading')}
                  </h2>
                  {!effectivelyUnlocked && <p className="mt-1 text-xs leading-relaxed text-stone-300">{t('premium.unlock.conditions')}</p>}
                </div>
                {!effectivelyUnlocked && !showPayment && <p className="mt-3 shrink-0 font-serif text-3xl font-bold text-amber-400 lg:mt-0">{priceLabel}</p>}
              </div>
            </div>

            {effectivelyUnlocked ? (
              <button onClick={continueWalk} className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 bg-amber-600 px-4 font-semibold text-white transition-colors hover:bg-amber-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-900 active:bg-amber-700">
                {t('premium.continueWalk')}<ArrowRightGlyph />
              </button>
            ) : showPayment ? (
              <div className="mt-5 border-t border-white/15 pt-5">
                <DonationQrPanel
                  fixedAmount={unlockPrice}
                  remittanceText={UNLOCK.remittanceText}
                  confirmLabel={t('premium.confirmButton')}
                  onConfirm={handlePaid}
                  tone="dark"
                />
              </div>
            ) : (
              <button onClick={openPayment} className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 bg-amber-600 px-4 font-semibold text-white transition-colors hover:bg-amber-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-900 active:bg-amber-700">
                {t('premium.unlock.button')}<ArrowRightGlyph />
              </button>
            )}

            {!effectivelyUnlocked && <p className="mt-3 flex items-start gap-1.5 text-xs leading-relaxed text-stone-400"><span className="mt-0.5 shrink-0" aria-hidden="true"><ShieldGlyph /></span>{t('premium.unlock.support')}</p>}
          </div>
        </section>

        {!effectivelyUnlocked && !showPayment && (
          <StickyUnlockBar
            heading={t('premium.unlock.heading')}
            conditions={t('premium.unlock.conditions')}
            price={priceLabel}
            buttonLabel={t('premium.unlock.button')}
            onUnlock={openPayment}
          />
        )}
      </div>
    </Layout>
  )
}

function withDynamicCount(label: string, count: number): string {
  if (count <= 0 || !/\d/.test(label)) return label
  return label.replace(/\d+/, String(count))
}

function LockGlyph() {
  return <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M6 8V6a4 4 0 118 0v2h.5A1.5 1.5 0 0116 9.5v6a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 014 15.5v-6A1.5 1.5 0 015.5 8H6zm2 0h4V6a2 2 0 10-4 0v2z" /></svg>
}

function CheckGlyph() {
  return <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><path d="M4 10l4 4 8-8" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function ShieldGlyph() {
  return <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3z" strokeLinecap="round" strokeLinejoin="round" /><path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function ArrowRightGlyph() {
  return <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 10h12M11 5l5 5-5 5" /></svg>
}
