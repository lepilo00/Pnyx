import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import DonationQrPanel from '@/components/DonationQrPanel'
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

// "Go deeper on the Pnyx" — the premium paywall. A standalone dark navy
// screen (deliberately outside the light/dark theme) listing the locked
// chapters and the one-time unlock.
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
  const paidStops = displayStops.filter((s) => s.is_paid && !s.is_bonus)
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
            {paidStops.map((stop) => (
              <div
                key={stop.id}
                onClick={effectivelyUnlocked ? () => navigate(`/stop/${stop.id}`, { state: { stops } }) : undefined}
                role={effectivelyUnlocked ? 'button' : undefined}
                tabIndex={effectivelyUnlocked ? 0 : undefined}
                onKeyDown={
                  effectivelyUnlocked
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          navigate(`/stop/${stop.id}`, { state: { stops } })
                        }
                      }
                    : undefined
                }
                className={`flex items-center gap-3 rounded-2xl border border-navy-700 bg-navy-850 px-4 py-3.5 ${
                  effectivelyUnlocked ? 'cursor-pointer hover:border-navy-600 transition-colors' : ''
                }`}
              >
                <span className="flex-shrink-0 w-8 h-8 rounded-full border border-navy-600 bg-navy-800
                                 text-parchment-50 text-sm font-bold flex items-center justify-center">
                  {stop.order_index}
                </span>
                <p className="font-medium text-sm text-parchment-50 leading-snug">
                  {t('premium.chapterLabel', { number: stop.order_index })} — {stop.title}
                </p>
              </div>
            ))}

            {/* Bonus stories */}
            {bonusStops.length > 0 && effectivelyUnlocked ? (
              bonusStops.map((stop) => (
                <div
                  key={stop.id}
                  onClick={() => navigate(`/stop/${stop.id}`, { state: { stops } })}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      navigate(`/stop/${stop.id}`, { state: { stops } })
                    }
                  }}
                  className="flex items-center gap-3 rounded-2xl border border-navy-700 bg-navy-850 px-4 py-3.5
                             cursor-pointer hover:border-navy-600 transition-colors"
                >
                  <span className="flex-shrink-0 w-8 h-8 rounded-full border border-navy-600 bg-navy-800
                                   text-amber-400 text-sm flex items-center justify-center">
                    ★
                  </span>
                  <p className="font-medium text-sm text-parchment-50 leading-snug">{stop.title}</p>
                </div>
              ))
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
