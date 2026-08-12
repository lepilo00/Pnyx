import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Trans, useTranslation } from 'react-i18next'
import Layout from '@/components/Layout'
import DonationQrPanel from '@/components/DonationQrPanel'
import { track } from '@/lib/analytics'
import { DONATION } from '@/lib/constants'

const PRESET_AMOUNTS = [3, 6, 10]

export default function SupportPage() {
  const { t } = useTranslation()
  const [selectedAmount, setSelectedAmount] = useState<number>(PRESET_AMOUNTS[1])
  const [showCustom, setShowCustom] = useState(false)
  const [customAmount, setCustomAmount] = useState('')
  const [showQr, setShowQr] = useState(false)
  const [selfReported, setSelfReported] = useState(false)
  const [shareStatus, setShareStatus] = useState('')

  useEffect(() => {
    void track('support_screen_shown', '/support')
  }, [])

  const parsedCustomAmount = Number.parseFloat(customAmount.replace(',', '.'))
  const customAmountValid = Number.isFinite(parsedCustomAmount) && parsedCustomAmount >= 1
  const activeAmount = showCustom ? (customAmountValid ? parsedCustomAmount : null) : selectedAmount

  const pickPreset = (amount: number) => {
    setSelectedAmount(amount)
    setShowCustom(false)
    setShowQr(false)
  }

  const pickCustom = () => {
    setShowCustom(true)
    setShowQr(false)
  }

  const handleDonateClick = () => {
    if (activeAmount === null) return
    setShowQr(true)
    void track('donation_panel_opened', '/support', { metadata: { amount: activeAmount, source: 'support_page' } })
  }

  const handleDonated = (amount: number) => {
    setSelfReported(true)
    void track('donation_self_reported', '/support', { metadata: { amount, source: 'support_page' } })
  }

  const share = async () => {
    const data = { title: t('menu.shareTitle'), text: t('menu.shareText'), url: window.location.origin }
    try {
      if (navigator.share) {
        await navigator.share(data)
      } else {
        await navigator.clipboard.writeText(data.url)
        setShareStatus(t('menu.shareCopied'))
        window.setTimeout(() => setShareStatus(''), 3000)
      }
    } catch (error) {
      if ((error as DOMException).name !== 'AbortError') setShareStatus(t('menu.shareFailed'))
    }
  }

  return (
    <Layout showBack contentWidth="wide">
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        <div className="text-center max-w-xl mx-auto mb-9">
          <p className="text-xs font-bold tracking-widest uppercase text-orange-700 dark:text-orange-400 mb-3">
            {t('support.eyebrow')}
          </p>
          <h1 className="font-serif text-[2rem] sm:text-4xl font-bold text-navy-900 dark:text-stone-100 leading-tight mb-4">
            <Trans i18nKey="support.heroTitle" components={{ accent: <span className="text-orange-700 dark:text-orange-400" /> }} />
          </h1>
          <p className="text-stone-600 dark:text-stone-300 leading-relaxed">
            <Trans i18nKey="support.heroBody" components={{ accent: <span className="text-orange-700 dark:text-orange-400 font-semibold" /> }} />
          </p>
        </div>

        <div className="card p-5 sm:p-8">
          <h2 className="font-serif text-xl text-center text-navy-900 dark:text-stone-100 mb-5">
            {t('support.cardTitle')}
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {PRESET_AMOUNTS.map((amount) => {
              const active = !showCustom && selectedAmount === amount
              return (
                <button
                  key={amount}
                  onClick={() => pickPreset(amount)}
                  aria-pressed={active}
                  className={`relative rounded-xl py-5 text-center font-serif text-2xl border transition-colors ${
                    active
                      ? 'border-orange-600 bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400'
                      : 'border-stone-200 dark:border-stone-700 text-orange-700 dark:text-orange-400 hover:border-orange-300 dark:hover:border-orange-700'
                  }`}
                >
                  {active && (
                    <span
                      aria-hidden="true"
                      className="absolute -top-2.5 -right-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-orange-600 shadow-sm"
                    >
                      <HeartIcon />
                    </span>
                  )}
                  €{amount}
                </button>
              )
            })}
            <button
              onClick={pickCustom}
              aria-pressed={showCustom}
              className={`rounded-xl py-5 flex flex-col items-center justify-center gap-1.5 border transition-colors ${
                showCustom
                  ? 'border-orange-600 bg-orange-50 dark:bg-orange-950/20'
                  : 'border-stone-200 dark:border-stone-700 hover:border-orange-300 dark:hover:border-orange-700'
              }`}
            >
              <PencilIcon />
              <span className="text-sm font-semibold text-stone-600 dark:text-stone-300">{t('support.otherAmountLabel')}</span>
            </button>
          </div>

          {showCustom && (
            <div className="mt-4 max-w-xs mx-auto">
              <label htmlFor="support-custom-amount" className="sr-only">{t('support.customLabel')}</label>
              <input
                id="support-custom-amount"
                type="number"
                min="1"
                step="0.5"
                inputMode="decimal"
                autoFocus
                value={customAmount}
                onChange={(event) => { setCustomAmount(event.target.value); setShowQr(false) }}
                placeholder={t('support.customPlaceholder')}
                className="input text-center"
              />
            </div>
          )}

          {!showQr ? (
            <button
              onClick={handleDonateClick}
              disabled={activeAmount === null}
              className="mt-5 w-full bg-orange-700 hover:bg-orange-800 disabled:opacity-50 disabled:cursor-not-allowed
                         text-white font-semibold text-base py-3.5 rounded-2xl shadow-sm transition-colors"
            >
              {t('support.donateButton', { amount: activeAmount ?? '' })}
            </button>
          ) : (
            <div className="mt-5 rounded-2xl bg-parchment-50 dark:bg-stone-800 p-4">
              <button
                onClick={() => setShowQr(false)}
                className="mb-3 text-sm font-semibold text-orange-700 dark:text-orange-400 underline underline-offset-4"
              >
                ← {t('support.cardTitle')}
              </button>
              {selfReported
                ? <p className="py-5 text-center text-sm leading-6 text-green-700 dark:text-green-400">{t('listen.bonusTransition.selfReportedThanks')}</p>
                : (
                  <DonationQrPanel
                    fixedAmount={activeAmount ?? undefined}
                    remittanceText={DONATION.remittanceText}
                    confirmLabel={t('listen.bonusTransition.selfReport')}
                    onConfirm={handleDonated}
                  />
                )}
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1.5 text-xs text-stone-500 dark:text-stone-400">
            <span className="inline-flex items-center gap-1.5"><LockIcon />{t('support.trustOneTime')}</span>
            <Dot />
            <span className="inline-flex items-center gap-1.5"><UserIcon />{t('support.trustNoAccount')}</span>
            <Dot />
            <span className="inline-flex items-center gap-1.5"><ShieldCheckIcon />{t('support.trustSecure')}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 my-10 max-w-md mx-auto" aria-hidden="true">
          <div className="h-px flex-1 bg-stone-200 dark:bg-stone-800" />
          <OliveBranchDivider />
          <div className="h-px flex-1 bg-stone-200 dark:bg-stone-800" />
        </div>

        <div className="text-center text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
          <p>{t('support.creditsIntro')}</p>
          <p>{t('support.creditsBody')}</p>
          <div className="mt-3 flex items-center justify-center gap-x-6 gap-y-1.5 flex-wrap">
            <Link to="/about" className="inline-flex items-center gap-1 font-semibold text-orange-700 dark:text-orange-400 hover:underline underline-offset-4">
              {t('support.linkWhoWeAre')} <span aria-hidden="true">→</span>
            </Link>
            <Link to="/about" className="inline-flex items-center gap-1 font-semibold text-orange-700 dark:text-orange-400 hover:underline underline-offset-4">
              {t('support.linkSources')} <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-stone-200 dark:border-stone-800 bg-parchment-50 dark:bg-stone-900 p-5 sm:p-6 flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
          <OliveBranchIllustration />
          <div className="flex-1 text-center sm:text-left">
            <h3 className="font-serif text-lg text-navy-900 dark:text-stone-100">{t('support.notReadyTitle')}</h3>
            <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">{t('support.notReadySubtitle')}</p>
          </div>
          <div className="shrink-0 text-center">
            <button
              onClick={() => void share()}
              className="inline-flex items-center gap-2 rounded-2xl border border-orange-600 text-orange-700 dark:text-orange-400
                         font-semibold px-5 py-3 hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-colors"
            >
              <ShareIcon />{t('menu.share')}
            </button>
            {shareStatus && <p className="mt-2 text-xs text-stone-500 dark:text-stone-400" role="status" aria-live="polite">{shareStatus}</p>}
          </div>
        </div>
      </div>
    </Layout>
  )
}

function Dot() {
  return <span aria-hidden="true" className="text-stone-300 dark:text-stone-600">·</span>
}

const Svg = ({ children, className = 'w-4 h-4' }: { children: React.ReactNode; className?: string }) =>
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-3 h-3 text-white" fill="currentColor" aria-hidden="true">
      <path d="M12 20.6l-1.4-1.3C5.4 14.8 2 11.7 2 7.9 2 4.9 4.4 2.5 7.4 2.5c1.7 0 3.3.8 4.6 2.1a6.3 6.3 0 0 1 4.6-2.1c3 0 5.4 2.4 5.4 5.4 0 3.8-3.4 6.9-8.6 11.4l-1.4 1.3Z" />
    </svg>
  )
}

function LockIcon() {
  return <Svg><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></Svg>
}

function UserIcon() {
  return <Svg><circle cx="12" cy="8" r="3.5" /><path d="M4.5 20c1-4.2 4.4-7 7.5-7s6.5 2.8 7.5 7" /></Svg>
}

function ShieldCheckIcon() {
  return <Svg><path d="M12 3l7 3v6c0 5-3.5 8.5-7 9-3.5-.5-7-4-7-9V6l7-3Z" /><path d="M9 12l2 2 4-4" /></Svg>
}

function PencilIcon() {
  return <Svg className="w-4 h-4 text-stone-500 dark:text-stone-400"><path d="M4 20l.9-4L16 4.9a1.3 1.3 0 0 1 1.8 0l1.3 1.3a1.3 1.3 0 0 1 0 1.8L8 19l-4 1Z" /><path d="M13.5 6.5l4 4" /></Svg>
}

function ShareIcon() {
  return <Svg className="w-4 h-4"><path d="M14 4h6v6M20 4l-9 9" /><path d="M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6" /></Svg>
}

function OliveBranchDivider() {
  return (
    <svg viewBox="0 0 60 24" className="h-4 w-10 shrink-0">
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 20c10-2 18-8 24-16" stroke="#8b8952" strokeWidth="1.6" />
        <g fill="#8b8952">
          <ellipse cx="11" cy="17" rx="3" ry="6" transform="rotate(-40 11 17)" />
          <ellipse cx="19" cy="11" rx="3" ry="6" transform="rotate(-25 19 11)" />
          <ellipse cx="27" cy="6" rx="3" ry="6" transform="rotate(-10 27 6)" />
        </g>
      </g>
    </svg>
  )
}

function OliveBranchIllustration() {
  return (
    <svg viewBox="0 0 70 90" className="h-16 w-14 shrink-0" aria-hidden="true">
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M35 84c6-20 10-38 14-64" stroke="#7c7a45" strokeWidth="2" />
        <g fill="#8b8952" stroke="#8b8952">
          <ellipse cx="38" cy="70" rx="5" ry="10" transform="rotate(-55 38 70)" />
          <ellipse cx="42" cy="55" rx="5" ry="10" transform="rotate(-40 42 55)" />
          <ellipse cx="46" cy="40" rx="5" ry="10" transform="rotate(-25 46 40)" />
          <ellipse cx="49" cy="25" rx="5" ry="10" transform="rotate(-12 49 25)" />
        </g>
      </g>
    </svg>
  )
}
