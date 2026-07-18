import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from '@/components/Layout'
import DonationQrPanel from '@/components/DonationQrPanel'
import PremiumImage from '@/components/PremiumImage'
import PremiumDiscoverCard from '@/components/PremiumDiscoverCard'
import { supabase } from '@/lib/supabaseClient'
import { track } from '@/lib/analytics'
import { withTimeout } from '@/lib/withTimeout'
import { useFallbackStops } from '@/data/fallbackStops'
import { useLocalizedStops } from '@/lib/useLocalizedStops'
import { useEntitlements } from '@/lib/entitlements'
import { useUnlockPrice } from '@/lib/useAppSettings'
import { UNLOCK } from '@/lib/constants'
import type { Stop } from '@/lib/types'

interface PremiumPageState {
  /** Locked chapter the visitor tried to open; continue there after unlocking. */
  fromStopId?: string
  stops?: Stop[]
}

// The discover grid is marketing copy, so it lives in translations rather than
// the stops table. The order here is the zip order against paidStops
// (order_index-sorted) once the content is unlocked.
const DISCOVER_CARDS = ['assembly', 'citizen', 'questioned', 'legacy'] as const

// "Go Deeper on the Pnyx": light marketing page for the full experience —
// hero, what-you'll-discover grid, bonus banner, and the navy unlock card
// carrying the honor-system payment flow.
export default function PremiumPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const fallbackStops = useFallbackStops()
  const { unlocked, unlock } = useEntitlements()
  const unlockPrice = useUnlockPrice()
  const [showPayment, setShowPayment] = useState(false)

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
    // fallbackStops intentionally omitted — see StartPage.tsx for rationale.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stops.length, i18n.language])

  useEffect(() => {
    void track('paywall_shown', '/premium', { stop_id: state.fromStopId })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const displayStops = useLocalizedStops(stops)
  const paidStops = displayStops.filter((s) => s.is_paid)
  const bonusStops = displayStops.filter((s) => s.is_bonus)
  // No paid chapters configured = the whole experience is free.
  const effectivelyUnlocked = unlocked || paidStops.length === 0

  // Discover cards deep-link to their chapters only when the mapping is
  // unambiguous: unlocked content and exactly one paid stop per card.
  const linkedStops =
    effectivelyUnlocked && paidStops.length === DISCOVER_CARDS.length ? paidStops : null

  const continueWalk = () => {
    const target =
      (state.fromStopId && stops.find((s) => s.id === state.fromStopId)) || paidStops[0]
    if (target) {
      navigate(`/stop/${target.id}`, { state: { stops } })
    } else {
      navigate('/start')
    }
  }

  const handlePaid = () => {
    unlock('purchase')
    void track('unlock_confirmed', '/premium', {
      stop_id: state.fromStopId,
      metadata: { amount: unlockPrice },
    })
    continueWalk()
  }

  const priceLabel = unlockPrice.toFixed(2).replace(/\.00$/, '')

  return (
    <Layout showBack>
      <div className="space-y-6">
        {/* Hero */}
        <header className="pt-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-500 mb-2">
            {t('premium.eyebrow')}
          </p>
          <h1 className="font-serif text-3xl leading-tight font-bold text-stone-900 dark:text-stone-100">
            {t('premium.title')}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-stone-600 dark:text-stone-300 max-w-sm">
            {t('premium.intro')}
          </p>
          <PremiumImage
            src="/premium/hero.png"
            alt={t('premium.heroAlt')}
            containerClassName="mt-4 -mx-2 aspect-[16/9] rounded-2xl border border-stone-200/70 dark:border-stone-800"
          />
        </header>

        {/* Meta row */}
        <div className="grid grid-cols-3 divide-x divide-stone-300/60 dark:divide-stone-700">
          {[
            [<EqualizerGlyph />, t('premium.meta.audio')],
            [<StarGlyph />, t('premium.meta.bonus')],
            [<ClockGlyph />, t('premium.meta.duration')],
          ].map(([icon, label]) => (
            <div key={String(label)} className="flex items-center justify-center gap-2 px-2">
              <span
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-amber-600/40 text-amber-700 dark:border-amber-500/40 dark:text-amber-500"
                aria-hidden="true"
              >
                {icon}
              </span>
              <span className="text-[11px] min-[380px]:text-xs font-medium leading-snug text-stone-600 dark:text-stone-300">
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* What you'll discover */}
        <section>
          <h2 className="mb-4 text-center font-serif text-2xl font-bold text-stone-900 dark:text-stone-100">
            {t('premium.discover.heading')}
          </h2>
          <div className="grid grid-cols-2 gap-3">
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
        </section>

        {/* Bonus stories banner */}
        <section className="flex items-center gap-3 rounded-2xl border border-amber-200/80 bg-amber-50/80 p-4 shadow-sm dark:border-amber-900/50 dark:bg-amber-950/20">
          <PremiumImage
            src="/premium/bonus.png"
            containerClassName="h-11 w-11 flex-shrink-0 rounded-xl border border-amber-200/80 dark:border-amber-900/50"
          />
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-stone-800 dark:text-stone-100">
              {t('premium.bonusBanner.title')}
            </h2>
            <p className="mt-0.5 text-xs leading-relaxed text-stone-600 dark:text-stone-300">
              {t('premium.bonusBanner.body')}
            </p>
          </div>
          <span className="flex-shrink-0 rounded-full border border-amber-600/50 px-2.5 py-0.5 text-[11px] font-medium text-amber-700 dark:border-amber-500/50 dark:text-amber-400">
            {t('premium.bonusBanner.included')}
          </span>
        </section>

        {/* Unlock / continue card */}
        <section className="rounded-2xl border border-navy-700 bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 p-5 shadow-lg shadow-navy-950/20">
          <div className="flex items-start gap-3">
            <span
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-navy-600 bg-navy-800 text-amber-400"
              aria-hidden="true"
            >
              {effectivelyUnlocked ? <CheckGlyph /> : <LockGlyph />}
            </span>
            <div className="min-w-0">
              <h2 className="font-serif text-xl font-bold leading-snug text-white">
                {effectivelyUnlocked ? t('premium.unlockedHeading') : t('premium.unlock.heading')}
              </h2>
              {!effectivelyUnlocked && (
                <p className="mt-1 text-xs leading-relaxed text-stone-300">
                  {t('premium.unlock.conditions')}
                </p>
              )}
            </div>
          </div>

          {effectivelyUnlocked ? (
            <>
              <button
                onClick={continueWalk}
                className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl bg-amber-600
                           py-3 font-semibold text-white shadow-sm transition-colors
                           hover:bg-amber-500 active:bg-amber-700"
              >
                {t('premium.continueWalk')}
                <ArrowRightGlyph />
              </button>

              {bonusStops.length > 0 && (
                <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
                  {bonusStops.map((stop) => (
                    <Link
                      key={stop.id}
                      to={`/stop/${stop.id}`}
                      state={{ stops }}
                      className="flex items-center gap-2.5 rounded-xl border border-navy-700 bg-navy-900/60
                                 px-3.5 py-2.5 text-sm text-parchment-50 transition-colors hover:border-navy-600"
                    >
                      <span className="text-amber-400" aria-hidden="true"><StarGlyph /></span>
                      <span className="min-w-0 flex-1 truncate">{stop.title}</span>
                      <span className="text-navy-500" aria-hidden="true">→</span>
                    </Link>
                  ))}
                </div>
              )}
            </>
          ) : showPayment ? (
            <div className="mt-4">
              <DonationQrPanel
                fixedAmount={unlockPrice}
                remittanceText={UNLOCK.remittanceText}
                confirmLabel={t('premium.confirmButton')}
                onConfirm={handlePaid}
                tone="dark"
              />
            </div>
          ) : (
            <>
              <p className="mt-4 font-serif text-4xl font-bold text-amber-400">
                €{priceLabel}
              </p>
              <button
                onClick={() => setShowPayment(true)}
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-amber-600
                           py-3 font-semibold text-white shadow-sm transition-colors
                           hover:bg-amber-500 active:bg-amber-700"
              >
                {t('premium.unlock.button')}
                <ArrowRightGlyph />
              </button>
            </>
          )}

          {!effectivelyUnlocked && (
            <p className="mt-3 flex items-start gap-1.5 text-xs leading-relaxed text-stone-400">
              <span className="mt-0.5 flex-shrink-0" aria-hidden="true"><ShieldGlyph /></span>
              {t('premium.unlock.support')}
            </p>
          )}
        </section>
      </div>
    </Layout>
  )
}

function EqualizerGlyph() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M5 10v4m4.5-8v12M14 7v10m4.5-6v2" />
    </svg>
  )
}

function StarGlyph() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 3l2.5 5.6 6 .6-4.5 4.1 1.3 5.9L12 16.1l-5.3 3.1 1.3-5.9L3.5 9.2l6-.6L12 3z" />
    </svg>
  )
}

function ClockGlyph() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function LockGlyph() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M6 8V6a4 4 0 118 0v2h.5A1.5 1.5 0 0116 9.5v6a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 014 15.5v-6A1.5 1.5 0 015.5 8H6zm2 0h4V6a2 2 0 10-4 0v2z" />
    </svg>
  )
}

function CheckGlyph() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
      <path d="M4 10l4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ShieldGlyph() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ArrowRightGlyph() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 10h12M11 5l5 5-5 5" />
    </svg>
  )
}
