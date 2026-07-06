import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import QRCode from 'qrcode'
import { DONATION } from '@/lib/constants'
import { buildEpcQrPayload } from '@/lib/epcQr'
import { track } from '@/lib/analytics'

const PRESET_AMOUNTS = [5, 10, 20]
const MIN_AMOUNT = 1
const MAX_AMOUNT = 999999

interface DonationModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function DonationModal({ isOpen, onClose }: DonationModalProps) {
  const { t } = useTranslation()
  const [selected, setSelected] = useState<number | 'custom'>(PRESET_AMOUNTS[0])
  const [customValue, setCustomValue] = useState('')
  const [qrDataUrl, setQrDataUrl] = useState('')
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)

  const customAmount = Number.parseFloat(customValue.replace(',', '.'))
  const amount = selected === 'custom' ? customAmount : selected
  const amountValid =
    Number.isFinite(amount) && amount >= MIN_AMOUNT && amount <= MAX_AMOUNT

  useEffect(() => {
    if (isOpen) {
      setSelected(PRESET_AMOUNTS[0])
      setCustomValue('')
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null
    closeButtonRef.current?.focus()
    document.body.style.overflow = 'hidden'

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
      previouslyFocusedRef.current?.focus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || !amountValid) {
      setQrDataUrl('')
      return
    }
    let cancelled = false
    const payload = buildEpcQrPayload({
      recipientName: DONATION.recipientName,
      iban: DONATION.iban,
      amountEur: amount,
      remittanceText: DONATION.remittanceText,
    })
    QRCode.toDataURL(payload, { errorCorrectionLevel: 'M', margin: 2, width: 480 })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url)
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl('')
      })
    return () => {
      cancelled = true
    }
  }, [isOpen, amountValid, amount])

  const selectPreset = (value: number) => {
    setSelected(value)
    void track('donation_amount_selected', window.location.pathname, {
      metadata: { amount: value },
    })
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="donation-title"
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-stone-900 rounded-2xl max-w-md w-full max-h-[95vh] flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-2 flex-shrink-0">
          <h2
            id="donation-title"
            className="font-serif text-xl font-bold text-stone-900 dark:text-stone-100"
          >
            {t('donation.title')}
          </h2>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label={t('donation.closeAria')}
            className="w-9 h-9 flex items-center justify-center rounded-full flex-shrink-0
                       bg-stone-100 dark:bg-stone-800
                       text-stone-600 dark:text-stone-300
                       hover:bg-stone-200 dark:hover:bg-stone-700
                       transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-5 pb-5 overflow-y-auto space-y-4">
          <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
            {t('donation.body')}
          </p>

          {/* Amount buttons */}
          <div className="grid grid-cols-4 gap-2">
            {PRESET_AMOUNTS.map((value) => (
              <button
                key={value}
                onClick={() => selectPreset(value)}
                aria-pressed={selected === value}
                className={`py-2.5 rounded-xl font-semibold text-sm transition-colors ${
                  selected === value
                    ? 'bg-amber-600 text-white shadow-sm shadow-amber-200 dark:shadow-amber-900/30'
                    : 'bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 hover:border-amber-400 dark:hover:border-amber-500'
                }`}
              >
                {value} €
              </button>
            ))}
            <button
              onClick={() => setSelected('custom')}
              aria-pressed={selected === 'custom'}
              className={`py-2.5 rounded-xl font-semibold text-sm transition-colors ${
                selected === 'custom'
                  ? 'bg-amber-600 text-white shadow-sm shadow-amber-200 dark:shadow-amber-900/30'
                  : 'bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 hover:border-amber-400 dark:hover:border-amber-500'
              }`}
            >
              {t('donation.customButton')}
            </button>
          </div>

          {/* Custom amount input */}
          {selected === 'custom' && (
            <div>
              <label
                htmlFor="donation-custom-amount"
                className="block text-xs font-semibold text-stone-500 dark:text-stone-400 mb-1"
              >
                {t('donation.customLabel')}
              </label>
              <div className="relative">
                <input
                  id="donation-custom-amount"
                  type="number"
                  inputMode="decimal"
                  min={MIN_AMOUNT}
                  max={MAX_AMOUNT}
                  step="0.5"
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  placeholder={t('donation.customPlaceholder')}
                  autoFocus
                  className="w-full rounded-xl border border-stone-200 dark:border-stone-700
                             bg-white dark:bg-stone-800
                             text-stone-800 dark:text-stone-100
                             px-3 py-2.5 pr-8 text-sm
                             focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-stone-400 dark:text-stone-500">
                  €
                </span>
              </div>
              {customValue !== '' && !amountValid && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  {t('donation.invalidAmount', { min: MIN_AMOUNT })}
                </p>
              )}
            </div>
          )}

          {/* QR code — white card so banking apps can scan it in dark mode too */}
          <div className="flex flex-col items-center">
            <div className="bg-white rounded-xl p-3 border border-stone-200 dark:border-stone-700">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={t('donation.qrAlt', { amount: amountValid ? amount : '' })}
                  className="w-44 h-44"
                />
              ) : (
                <div className="w-44 h-44 flex items-center justify-center text-xs text-stone-400 text-center px-4">
                  {t('donation.invalidAmount', { min: MIN_AMOUNT })}
                </div>
              )}
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-2 text-center">
              {t('donation.scanHint')}
            </p>
          </div>

          {/* Manual transfer fallback */}
          <p className="text-xs text-stone-400 dark:text-stone-500 text-center leading-relaxed">
            {t('donation.recipientLabel')}: {DONATION.recipientName} · IBAN:{' '}
            <span className="font-mono">{DONATION.iban}</span>
          </p>

          {/* Continue without donating */}
          <button
            onClick={onClose}
            className="w-full bg-white dark:bg-stone-900
                       hover:bg-stone-50 dark:hover:bg-stone-800
                       border border-stone-200 dark:border-stone-700
                       text-stone-600 dark:text-stone-300
                       font-medium text-sm py-3 rounded-2xl transition-colors"
          >
            {t('donation.continueButton')}
          </button>
        </div>
      </div>
    </div>
  )
}
