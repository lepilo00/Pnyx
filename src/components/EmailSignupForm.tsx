import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { track } from '@/lib/analytics'

interface EmailSignupFormProps {
  source: string
  onSuccess?: () => void
}

export default function EmailSignupForm({ source, onSuccess }: EmailSignupFormProps) {
  const [email, setEmail] = useState('')
  const [consent, setConsent] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isValid = email.includes('@') && consent

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return
    setIsSubmitting(true)
    setError(null)

    const { error: dbError } = await supabase
      .from('email_signups')
      .insert({ email: email.trim().toLowerCase(), source, consent })

    if (dbError) {
      setError('Something went wrong. Please try again.')
      setIsSubmitting(false)
      return
    }

    void track('email_signup_submitted', window.location.pathname, { metadata: { source } })
    setSubmitted(true)
    onSuccess?.()
  }

  if (submitted) {
    return (
      <div className="rounded-2xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/50 p-5 text-center">
        <div className="text-2xl mb-2">✓</div>
        <p className="text-green-700 dark:text-green-400 font-semibold text-base">You're on the list!</p>
        <p className="text-green-600 dark:text-green-500 text-sm mt-1">
          We'll notify you when the extended version launches.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-3">
      <div>
        <label
          htmlFor={`email-${source}`}
          className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1"
        >
          Email address
        </label>
        <input
          id={`email-${source}`}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          autoComplete="email"
          required
          className="input"
        />
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-1 accent-amber-600 w-4 h-4 flex-shrink-0"
        />
        <span className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
          I agree to receive occasional updates about this walk. You can unsubscribe at any time.
        </span>
      </label>

      {error && (
        <p role="alert" className="text-red-600 dark:text-red-400 text-sm">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!isValid || isSubmitting}
        className="w-full bg-stone-800 dark:bg-stone-100 hover:bg-stone-900 dark:hover:bg-white
                   disabled:bg-stone-200 dark:disabled:bg-stone-700
                   disabled:text-stone-400 dark:disabled:text-stone-500
                   text-white dark:text-stone-900
                   font-semibold py-3 rounded-xl transition-colors text-base"
      >
        {isSubmitting ? 'Submitting…' : 'Notify me when it launches'}
      </button>
    </form>
  )
}
