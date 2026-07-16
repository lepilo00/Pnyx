import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import DonationQrPanel from '@/components/DonationQrPanel'
import { supabase } from '@/lib/supabaseClient'
import { track } from '@/lib/analytics'
import { withTimeout } from '@/lib/withTimeout'
import { useFallbackStops } from '@/data/fallbackStops'
import { useLocalizedStops } from '@/lib/useLocalizedStops'
import { useEntitlements } from '@/lib/entitlements'
import { useUnlockPrice } from '@/lib/useAppSettings'
import { useListenedStopIds } from '@/lib/audioProgress'
import { UNLOCK } from '@/lib/constants'
import type { Stop } from '@/lib/types'

interface PremiumPageState {
  /** Locked chapter the visitor tried to open; continue there after unlocking. */
  fromStopId?: string
  stops?: Stop[]
}

// "Go deeper on the Pnyx": a standalone navy screen listing every chapter,
// its listened/locked state, bonus content, and the one-time unlock.
export default function PremiumPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const fallbackStops = useFallbackStops()
  const { unlocked, unlock } = useEntitlements()
  const unlockPrice = useUnlockPrice()
  const listenedStopIds = useListenedStopIds()
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
  const chapterStops = displayStops.filter((s) => !s.is_bonus)
  const paidStops = displayStops.filter((s) => s.is_paid)
  const bonusStops = displayStops.filter((s) => s.is_bonus)
  // No paid chapters configured = the whole experience is free.
  const effectivelyUnlocked = unlocked || paidStops.length === 0

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
    <div className="min-h-screen bg-navy-950 text-stone-100 flex flex-col">
      {/* Minimal navy header */}
      <header className="px-4 py-3 sticky top-0 z-10 bg-navy-950/90 backdrop-blur-sm border-b border-navy-800">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <button
            onClick={() => navigate(-1)}
            aria-label={t('common.backToHome')}
            className="w-9 h-9 flex items-center justify-center rounded-xl
                       text-stone-400 hover:text-stone-100 hover:bg-navy-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div className="flex items-baseline gap-1.5">
            <span className="font-serif text-lg font-bold text-amber-500 tracking-wide">
              {t('common.brand.title')}
            </span>
            <span className="text-sm text-stone-400">{t('common.brand.subtitle')}</span>
          </div>
          <span className="w-9 h-9" aria-hidden="true" />
        </div>
      </header>

      <main className="flex-1 px-4 py-8 max-w-lg mx-auto w-full">
        <div className="space-y-6">
          {/* Headline */}
          <div className="text-center">
            <h1 className="font-serif text-3xl font-bold text-parchment-50 leading-tight mb-3">
              {t('premium.title')}
            </h1>
            <div className="flex items-center justify-center gap-3 text-stone-400 mb-3" aria-hidden="true">
              <span className="h-px w-10 bg-navy-600" />
              <span className="text-lg">🏛</span>
              <span className="h-px w-10 bg-navy-600" />
            </div>
            <p className="text-stone-300 text-sm leading-relaxed max-w-xs mx-auto">
              {t('premium.subtitle')}
            </p>
          </div>

          {/* Chapters */}
          <div className="space-y-2.5">
            {chapterStops.map((stop) => {
              const isLocked = !!stop.is_paid && !effectivelyUnlocked
              const isListened = listenedStopIds.includes(stop.id)

              return (
                <PremiumChapterRow
                  key={stop.id}
                  stop={stop}
                  stops={stops}
                  isLocked={isLocked}
                  isListened={isListened}
                />
              )
            })}

            {/* Bonus stories */}
            {bonusStops.length > 0 && effectivelyUnlocked ? (
              bonusStops.map((stop) => {
                const isListened = listenedStopIds.includes(stop.id)
                return (
                  <Link
                    key={stop.id}
                    to={`/stop/${stop.id}`}
                    state={{ stops }}
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 transition-colors hover:border-navy-600 ${
                      isListened
                        ? 'border-navy-700/70 bg-navy-900/50 text-stone-400'
                        : 'border-navy-700 bg-navy-850 text-parchment-50'
                    }`}
                  >
                    <span className={`flex-shrink-0 w-8 h-8 rounded-full border flex items-center justify-center ${
                      isListened
                        ? 'border-stone-500/50 bg-stone-500/15 text-stone-400'
                        : 'border-navy-600 bg-navy-800 text-amber-400'
                    }`}>
                      {isListened ? <CheckGlyph /> : '★'}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium text-sm leading-snug">{stop.title}</span>
                      {isListened && (
                        <span className="mt-0.5 block text-xs text-stone-500">{t('audioPlayer.completed')}</span>
                      )}
                    </span>
                    <span className="text-navy-500" aria-hidden="true">→</span>
                  </Link>
                )
              })
            ) : (
              <div className="flex items-center gap-3 rounded-2xl border border-navy-700 bg-navy-850 px-4 py-3.5">
                <span className="flex-shrink-0 w-8 h-8 rounded-full border border-navy-600 bg-navy-800
                                 text-amber-400 text-sm flex items-center justify-center">
                  ★
                </span>
                <p className="font-medium text-sm text-parchment-50 leading-snug">
                  {t('premium.bonusItem')}
                </p>
              </div>
            )}
          </div>

          {/* CTA / payment */}
          {effectivelyUnlocked ? (
            <button
              onClick={continueWalk}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold text-base py-4
                         rounded-2xl shadow-lg shadow-black/30 transition-colors"
            >
              {t('premium.continueWalk')}
            </button>
          ) : showPayment ? (
            <div className="bg-navy-850 border border-navy-700 rounded-3xl p-4">
              <h2 className="text-parchment-50 font-semibold text-center mb-4">
                {t('premium.unlockCta', { price: priceLabel })}
              </h2>
              <DonationQrPanel
                fixedAmount={unlockPrice}
                remittanceText={UNLOCK.remittanceText}
                confirmLabel={t('premium.confirmButton')}
                onConfirm={handlePaid}
                tone="dark"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <button
                onClick={() => setShowPayment(true)}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold text-base py-4
                           rounded-2xl shadow-lg shadow-black/30 transition-colors"
              >
                {t('premium.unlockCta', { price: priceLabel })}
              </button>
              <p className="text-xs text-stone-400 text-center">{t('premium.oneTime')}</p>
            </div>
          )}

          {/* Feature icons */}
          <div className="grid grid-cols-3 divide-x divide-navy-700 border-t border-navy-700 pt-5">
            {[
              { icon: '🎧', label: t('premium.features.audio') },
              { icon: '★', label: t('premium.features.bonus') },
              { icon: '📱', label: t('premium.features.noApp') },
            ].map(({ icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-1.5 px-2 text-center">
                <span className="text-lg text-amber-400" aria-hidden="true">
                  {icon}
                </span>
                <span className="text-xs text-stone-300 leading-tight">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

interface PremiumChapterRowProps {
  stop: Stop
  stops: Stop[]
  isLocked: boolean
  isListened: boolean
}

function PremiumChapterRow({ stop, stops, isLocked, isListened }: PremiumChapterRowProps) {
  const { t } = useTranslation()
  const className = `flex items-center gap-3 rounded-2xl border px-4 py-3.5 transition-colors ${
    isListened ? 'border-navy-700/70 bg-navy-900/50' : 'border-navy-700 bg-navy-850'
  } ${!isLocked ? 'hover:border-navy-600' : ''}`

  const content = (
    <>
      <span className={`flex-shrink-0 w-8 h-8 rounded-full border text-sm font-bold flex items-center justify-center ${
        isListened
          ? 'border-stone-500/50 bg-stone-500/15 text-stone-400'
          : 'border-navy-600 bg-navy-800 text-parchment-50'
      }`}>
        {isListened ? <CheckGlyph /> : stop.order_index}
      </span>

      <span className="min-w-0 flex-1">
        <span className={`block font-medium text-sm leading-snug ${
          isListened ? 'text-stone-400' : 'text-parchment-50'
        }`}>
          {t('premium.chapterLabel', { number: stop.order_index })} — {stop.title}
        </span>
        {isListened && (
          <span className="mt-0.5 block text-xs text-stone-500">{t('audioPlayer.completed')}</span>
        )}
      </span>

      {isLocked ? (
        <span className="text-stone-500" aria-label={t('premium.lockedLabel')}>
          <LockGlyph />
        </span>
      ) : !stop.is_paid && !isListened ? (
        <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[11px] font-medium text-amber-400">
          {t('premium.freeLabel')}
        </span>
      ) : (
        <span className="text-navy-500" aria-hidden="true">→</span>
      )}
    </>
  )

  if (isLocked) return <div className={className}>{content}</div>

  return (
    <Link to={`/stop/${stop.id}`} state={{ stops }} className={className}>
      {content}
    </Link>
  )
}

function CheckGlyph() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 10.5l3.5 3.5L16 6" />
    </svg>
  )
}

function LockGlyph() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4.5" y="8.5" width="11" height="8" rx="2" />
      <path d="M7 8.5V6a3 3 0 016 0v2.5" />
    </svg>
  )
}
