import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { track } from '@/lib/analytics'

interface FeedbackFormProps {
  onSuccess?: () => void
}

type WouldPay = 'yes' | 'maybe' | 'no'

export default function FeedbackForm({ onSuccess }: FeedbackFormProps) {
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
      setError('Something went wrong. Please try again.')
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
      <div className="rounded-2xl bg-green-50 border border-green-200 p-5 text-center">
        <p className="text-green-700 font-semibold text-base">Thank you for your feedback!</p>
        <p className="text-green-600 text-sm mt-1">It helps us build a better experience.</p>
      </div>
    )
  }

  const displayRating = hoveredRating ?? rating

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Star rating */}
      <div>
        <p className="text-sm font-medium text-stone-700 mb-2">How was your experience?</p>
        <div className="flex gap-2" role="group" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(null)}
              aria-label={`${star} star${star > 1 ? 's' : ''}`}
              className={`text-3xl transition-colors ${
                displayRating !== null && star <= displayRating
                  ? 'text-amber-400'
                  : 'text-stone-200'
              }`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      {/* Would you pay */}
      <div>
        <p className="text-sm font-medium text-stone-700 mb-2">
          Would you pay <strong>€6.99</strong> for the full 45-minute version?
        </p>
        <div className="flex gap-2">
          {(['yes', 'maybe', 'no'] as WouldPay[]).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setWouldPay(wouldPay === opt ? null : opt)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors capitalize ${
                wouldPay === opt
                  ? 'bg-amber-600 border-amber-600 text-white'
                  : 'bg-white border-stone-300 text-stone-600 hover:border-amber-400'
              }`}
            >
              {opt === 'yes' ? 'Yes' : opt === 'maybe' ? 'Maybe' : 'No'}
            </button>
          ))}
        </div>
      </div>

      {/* Message */}
      <div>
        <label htmlFor="feedback-message" className="block text-sm font-medium text-stone-700 mb-1">
          Any comments? <span className="text-stone-400 font-normal">(optional)</span>
        </label>
        <textarea
          id="feedback-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="What did you enjoy? What could be better?"
          rows={3}
          className="w-full border border-stone-300 rounded-xl px-4 py-3 text-base
                     focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent
                     placeholder:text-stone-400 resize-none"
        />
      </div>

      {error && (
        <p role="alert" className="text-red-600 text-sm">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!rating || isSubmitting}
        className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-stone-200 disabled:text-stone-400
                   text-white font-semibold py-3 rounded-xl transition-colors text-base"
      >
        {isSubmitting ? 'Submitting…' : 'Submit feedback'}
      </button>
    </form>
  )
}
