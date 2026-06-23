import { useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabaseClient'
import { track } from '@/lib/analytics'

interface FeedbackFormProps {
  onSuccess?: () => void
}

type WouldPay = 'yes' | 'maybe' | 'no'

const RATING_LABEL_KEYS = ['', 'poor', 'fair', 'good', 'veryGood', 'excellent']

export default function FeedbackForm({ onSuccess }: FeedbackFormProps) {
  const { t } = useTranslation()
  const [rating, setRating] = useState<number | null>(null)
  const [hoveredRating, setHoveredRating] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const [wouldPay, setWouldPay] = useState<WouldPay | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rating) return
    setIsSubmitting(true)
    setError(null)

    const { error: dbError } = await supabase.from('feedback').insert({
      rating,
      message: message.trim() || null,
      would_pay: wouldPay,
    })

    if (dbError) {
      setError(t('forms.feedback.errorGeneric'))
      setIsSubmitting(false)
      return
    }

    void track('feedback_submitted', window.location.pathname)
    if (wouldPay) {
      void track('would_pay_answered', window.location.pathname, { metadata: { would_pay: wouldPay } })
    }
    setSubmitted(true)
    onSuccess?.()
  }

  if (submitted) {
    return (
      <div className="rounded-2xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/50 p-5 text-center">
        <div className="text-2xl mb-2">✓</div>
        <p className="text-green-700 dark:text-green-400 font-semibold text-base">{t('forms.feedback.thankYou')}</p>
        <p className="text-green-600 dark:text-green-500 text-sm mt-1">{t('forms.feedback.thankYouBody')}</p>
      </div>
    )
  }

  const displayRating = hoveredRating ?? rating

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Star rating */}
      <div>
        <p className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-3">
          {t('forms.feedback.ratingQuestion')}
        </p>
        <div className="flex gap-1" role="group" aria-label={t('forms.feedback.ratingGroupLabel')}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(null)}
              aria-label={t('forms.feedback.starLabel', { count: star })}
              className={`text-4xl transition-all duration-100 hover:scale-110 active:scale-95 ${
                displayRating !== null && star <= displayRating
                  ? 'text-amber-400'
                  : 'text-stone-200 dark:text-stone-700'
              }`}
            >
              ★
            </button>
          ))}
        </div>
        {rating && (
          <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">
            {t(`forms.feedback.ratingLabels.${RATING_LABEL_KEYS[rating]}`)}
          </p>
        )}
      </div>

      {/* Would you pay */}
      <div>
        <p className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
          <Trans
            i18nKey="forms.feedback.wouldPayQuestion"
            values={{ price: '€6.99' }}
            components={{ strong: <strong className="text-stone-900 dark:text-stone-100" /> }}
          />
        </p>
        <div className="grid grid-cols-3 gap-2">
          {(['yes', 'maybe', 'no'] as WouldPay[]).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setWouldPay(wouldPay === opt ? null : opt)}
              className={`py-2.5 rounded-xl text-sm font-semibold border transition-all duration-150 capitalize ${
                wouldPay === opt
                  ? opt === 'yes'
                    ? 'bg-green-500 border-green-500 text-white shadow-sm'
                    : opt === 'maybe'
                    ? 'bg-amber-500 border-amber-500 text-white shadow-sm'
                    : 'bg-red-400 border-red-400 text-white shadow-sm'
                  : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:border-stone-400 dark:hover:border-stone-500'
              }`}
            >
              {t(`forms.feedback.wouldPayOptions.${opt}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Comment */}
      <div>
        <label
          htmlFor="feedback-message"
          className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1"
        >
          {t('forms.feedback.commentsLabel')}{' '}
          <span className="text-stone-400 dark:text-stone-500 font-normal">{t('forms.feedback.optional')}</span>
        </label>
        <textarea
          id="feedback-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t('forms.feedback.commentsPlaceholder')}
          rows={3}
          className="input resize-none"
        />
      </div>

      {error && (
        <p role="alert" className="text-red-600 dark:text-red-400 text-sm">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!rating || isSubmitting}
        className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-stone-200 dark:disabled:bg-stone-700
                   disabled:text-stone-400 dark:disabled:text-stone-500
                   text-white font-semibold py-3.5 rounded-xl transition-colors text-base"
      >
        {isSubmitting ? t('forms.feedback.submittingButton') : t('forms.feedback.submitButton')}
      </button>
    </form>
  )
}
