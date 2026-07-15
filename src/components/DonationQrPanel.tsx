import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import QRCode from 'qrcode'
import { DONATION } from '@/lib/constants'
import { buildEpcQrPayload } from '@/lib/epcQr'
import { track } from '@/lib/analytics'

const MIN_AMOUNT = 1
const MAX_AMOUNT = 999999

interface DonationQrPanelProps {
  /** Selectable amounts; ignored when fixedAmount is set. */
  presets?: number[]
  /** Locks the amount (one-time unlock price) and hides the picker. */
  fixedAmount?: number
  /** Remittance line encoded into the SEPA QR (donation vs unlock). */
  remittanceText: string
  /** Label of the honor-system confirm button ("I donated" / "I've paid"). */
  confirmLabel: string
  onConfirm: (amount: number) => void
  /** dark = rendered on the navy premium screen. */
  tone?: 'light' | 'dark'
}

export default function DonationQrPanel({
  presets = [5, 10, 25],
  fixedAmount,
  remittanceText,
  confirmLabel,
  onConfirm,
  tone = 'light',
}: DonationQrPanelProps) {
  const { t } = useTranslation()
  const [selected, setSelected] = useState<number | 'custom'>(fixedAmount ?? presets[0])
  const [customValue, setCustomValue] = useState('')
  const [qrDataUrl, setQrDataUrl] = useState('')

  const customAmount = Number.parseFloat(customValue.replace(',', '.'))
  const amount = fixedAmount ?? (selected === 'custom' ? customAmount : (selected as number))
  const amountValid = Number.isFinite(amount) && amount >= MIN_AMOUNT && amount <= MAX_AMOUNT

  useEffect(() => {
    if (!amountValid) {
      return
    }
    let cancelled = false
    const payload = buildEpcQrPayload({
      recipientName: DONATION.recipientName,
      iban: DONATION.iban,
      amountEur: amount,
      remittanceText,
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
  }, [amountValid, amount, remittanceText])

  const selectPreset = (value: number) => {
    setSelected(value)
    void track('donation_amount_selected', window.location.pathname, {
      metadata: { amount: value },
    })
  }

  const dark = tone === 'dark'
  const visibleQrDataUrl = amountValid ? qrDataUrl : ''
  const mutedText = dark ? 'text-stone-300/80' : 'text-stone-500 dark:text-stone-400'
  const faintText = dark ? 'text-stone-400/70' : 'text-stone-400 dark:text-stone-500'

  return (
    <div className="space-y-4">
      {fixedAmount === undefined && (
        <>
          {/* Amount buttons */}
          <div className="grid grid-cols-4 gap-2">
            {presets.map((value) => (
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
              {t('support.customButton')}
            </button>
          </div>

          {/* Custom amount input */}
          {selected === 'custom' && (
            <div>
              <label
                htmlFor="donation-custom-amount"
                className={`block text-xs font-semibold mb-1 ${mutedText}`}
              >
                {t('support.customLabel')}
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
                  placeholder={t('support.customPlaceholder')}
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
                  {t('support.invalidAmount', { min: MIN_AMOUNT })}
                </p>
              )}
            </div>
          )}
        </>
      )}

      {/* QR code — always on a white card so banking apps can scan it */}
      <div className="flex flex-col items-center">
        <div className="bg-white rounded-xl p-3 border border-stone-200">
          {visibleQrDataUrl ? (
            <img
              src={visibleQrDataUrl}
              alt={t('support.qrAlt', { amount: amountValid ? amount : '' })}
              className="w-44 h-44"
            />
          ) : (
            <div className="w-44 h-44 flex items-center justify-center text-xs text-stone-400 text-center px-4">
              {t('support.invalidAmount', { min: MIN_AMOUNT })}
            </div>
          )}
        </div>
        <p className={`text-xs mt-2 text-center ${mutedText}`}>{t('support.scanHint')}</p>
      </div>

      {/* Manual transfer fallback */}
      <p className={`text-xs text-center leading-relaxed ${faintText}`}>
        {t('support.recipientLabel')}: {DONATION.recipientName} · IBAN:{' '}
        <span className="font-mono">{DONATION.iban}</span>
      </p>

      {/* Honor-system confirmation */}
      <button
        onClick={() => onConfirm(amount)}
        disabled={!amountValid}
        className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed
                   text-white font-semibold text-sm py-3 rounded-2xl shadow-sm transition-colors"
      >
        {confirmLabel}
      </button>
    </div>
  )
}
