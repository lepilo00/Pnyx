import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from '@/components/Layout'
import DonationQrPanel from '@/components/DonationQrPanel'
import { track } from '@/lib/analytics'
import { DONATION } from '@/lib/constants'
import { useEntitlements, isStopLocked } from '@/lib/entitlements'
import type { Stop } from '@/lib/types'

interface SupportPageState {
  nextStopId?: string
  stops?: Stop[]
}

export default function SupportPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { unlocked, unlock } = useEntitlements()
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
  const [showCustom, setShowCustom] = useState(false)
  const [customAmount, setCustomAmount] = useState('')
  const state = (location.state as SupportPageState | null) ?? {}
  const nextStop = state.nextStopId
    ? state.stops?.find((stop) => stop.id === state.nextStopId)
    : undefined

  useEffect(() => {
    void track('support_screen_shown', '/support')
  }, [])

  const continueToWalk = (nowUnlocked: boolean) => {
    if (nextStop) {
      if (!nowUnlocked && isStopLocked(nextStop, false)) {
        navigate('/premium', { state: { fromStopId: nextStop.id, stops: state.stops } })
      } else {
        navigate(`/stop/${nextStop.id}`, { state: { stops: state.stops } })
      }
      return
    }
    navigate('/start')
  }

  const handleDonated = (amount: number) => {
    unlock('donation')
    void track('donation_unlock', '/support', { metadata: { amount } })
    continueToWalk(true)
  }

  const parsedCustomAmount = Number.parseFloat(customAmount.replace(',', '.'))
  const customAmountValid = Number.isFinite(parsedCustomAmount) && parsedCustomAmount >= 1

  return (
    <Layout>
      <div className="max-w-sm mx-auto px-1 pb-5">
        <div className="text-center pt-7">
          <h1 className="font-serif text-[2.65rem] font-normal text-orange-700 dark:text-orange-500 leading-[1.05] mb-2 whitespace-pre-line">
            {t('support.title')}
          </h1>
          <SupportIllustration />
          <p className="text-stone-700 dark:text-stone-300 text-[0.94rem] leading-6 max-w-xs mx-auto whitespace-pre-line mt-1">
            {t('support.body')}
          </p>
        </div>

        <div className="mt-7 bg-gradient-to-br from-orange-700 to-orange-600 rounded-2xl px-4 py-5 shadow-lg shadow-orange-200/70 dark:shadow-orange-950/30">
          {selectedAmount === null ? (
            <>
              <h2 className="font-serif text-xl text-white text-center mb-4">{t('support.chooseAmount')}</h2>
              <div className="grid grid-cols-2 gap-3">
                {[5, 10, 25].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => { setSelectedAmount(amount); setShowCustom(false) }}
                    className="rounded-xl bg-parchment-50 py-3.5 font-serif text-xl text-orange-700 shadow-sm hover:bg-white active:scale-[0.98] transition-all"
                  >
                    €{amount}
                  </button>
                ))}
                <button
                  onClick={() => setShowCustom(true)}
                  className="rounded-xl bg-parchment-50 py-3.5 font-serif text-lg text-orange-700 shadow-sm hover:bg-white active:scale-[0.98] transition-all"
                >
                  {t('support.customButton')}
                </button>
              </div>

              {showCustom && (
                <div className="mt-3 flex gap-2">
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    inputMode="decimal"
                    value={customAmount}
                    onChange={(event) => setCustomAmount(event.target.value)}
                    placeholder={t('support.customPlaceholder')}
                    aria-label={t('support.customLabel')}
                    className="min-w-0 flex-1 rounded-xl bg-white px-3 py-3 text-stone-900 outline-none ring-2 ring-transparent focus:ring-orange-300"
                  />
                  <button
                    disabled={!customAmountValid}
                    onClick={() => setSelectedAmount(parsedCustomAmount)}
                    className="rounded-xl bg-stone-900 px-4 font-semibold text-white disabled:opacity-40"
                  >
                    OK
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-2xl bg-parchment-50 dark:bg-stone-900 p-4">
              <button
                onClick={() => setSelectedAmount(null)}
                className="mb-3 text-sm font-semibold text-orange-700 dark:text-orange-400 underline underline-offset-4"
              >
                ← {t('support.chooseAmount')}
              </button>
              <DonationQrPanel
                fixedAmount={selectedAmount}
                remittanceText={DONATION.remittanceText}
                confirmLabel={t('support.confirmButton')}
                onConfirm={handleDonated}
              />
            </div>
          )}

          <p className="text-orange-50 text-sm text-center mt-4 flex items-center justify-center gap-2">
            <span className="text-xl leading-none" aria-hidden="true">♡</span>
            {t('support.note')}
          </p>
        </div>

        <div className="text-center pt-7 pb-2">
          <button
            onClick={() => continueToWalk(unlocked)}
            className="font-serif text-orange-700 dark:text-orange-400 font-semibold text-base underline underline-offset-4 hover:text-orange-800 dark:hover:text-orange-300 transition-colors"
          >
            {t('support.skip')}
          </button>
        </div>
      </div>
    </Layout>
  )
}

function SupportIllustration() {
  return (
    <svg viewBox="0 0 320 170" className="mx-auto h-36 w-full max-w-xs" aria-hidden="true">
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <g stroke="#7c7a45" strokeWidth="2">
          <path d="M30 139c20-8 32-25 40-49M45 126l-18-12M53 115l-17-17M61 102l-10-20M68 91l2-20" />
          <path d="M290 139c-20-8-32-25-40-49M275 126l18-12M267 115l17-17M259 102l10-20M252 91l-2-20" />
        </g>
        <g fill="#8b8952" stroke="#8b8952">
          <ellipse cx="33" cy="111" rx="5" ry="11" transform="rotate(-50 33 111)" />
          <ellipse cx="45" cy="99" rx="5" ry="11" transform="rotate(-42 45 99)" />
          <ellipse cx="57" cy="86" rx="5" ry="11" transform="rotate(-25 57 86)" />
          <ellipse cx="287" cy="111" rx="5" ry="11" transform="rotate(50 287 111)" />
          <ellipse cx="275" cy="99" rx="5" ry="11" transform="rotate(42 275 99)" />
          <ellipse cx="263" cy="86" rx="5" ry="11" transform="rotate(25 263 86)" />
        </g>
        <g stroke="#c7633d" strokeWidth="1.7">
          <path d="M184 12c-8 15-14 26-20 34l-17 10-4 20 12 9 19-13 13-22 25-17" />
          <path d="M145 57l20 8M153 48l19 9M160 40l18 9M169 31l16 8" />
          <path d="M143 76c-4-1-9 2-10 7-1 4 2 8 7 8 6 0 11-5 15-10" />
        </g>
        <circle cx="144" cy="96" r="12" fill="#d4aa45" stroke="#9c7629" strokeWidth="2" />
        <path d="M144 89v14M139 93h8M139 99h8" stroke="#fff4cb" strokeWidth="1.5" />
        <g stroke="#77746d" strokeWidth="1.5">
          <ellipse cx="160" cy="133" rx="54" ry="13" fill="#f8f4e9" />
          <path d="M108 132c8 25 95 25 104 0M121 145c14 14 63 14 78 0M101 153h118M116 158h88" />
        </g>
      </g>
    </svg>
  )
}
