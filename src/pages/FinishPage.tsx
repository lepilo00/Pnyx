import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import Layout from '@/components/Layout'
import FeedbackForm from '@/components/FeedbackForm'
import EmailSignupForm from '@/components/EmailSignupForm'
import { track } from '@/lib/analytics'

export default function FinishPage() {
  useEffect(() => {
    void track('walk_completed', '/finish')
  }, [])

  return (
    <Layout>
      <div className="space-y-8">
        {/* Completion header */}
        <section className="text-center pt-4">
          <div className="text-5xl mb-4">🏛</div>
          <h1 className="font-serif text-3xl font-bold text-stone-900 mb-2">
            You've completed the walk.
          </h1>
          <p className="text-stone-600 leading-relaxed">
            You've stood where Athenian citizens debated war, law, and the future of their city.
            Not many tourists make it here.
          </p>
        </section>

        {/* Divider */}
        <div className="border-t border-stone-200" />

        {/* Feedback section */}
        <section>
          <h2 className="font-serif text-xl font-bold text-stone-800 mb-1">
            How was the experience?
          </h2>
          <p className="text-stone-500 text-sm mb-4">
            Your feedback helps us build a better walk.
          </p>
          <FeedbackForm />
        </section>

        {/* Divider */}
        <div className="border-t border-stone-200" />

        {/* Email signup */}
        <section>
          <h2 className="font-serif text-xl font-bold text-stone-800 mb-1">
            The full version is coming
          </h2>
          <p className="text-stone-500 text-sm mb-4">
            The extended 45-minute walk covers more of Athenian democracy in depth.
            Leave your email to be the first to know.
          </p>
          <EmailSignupForm source="finish" />
        </section>

        {/* Divider */}
        <div className="border-t border-stone-200" />

        {/* Back home */}
        <div className="text-center pb-4">
          <Link to="/" className="text-amber-600 font-semibold hover:text-amber-700 transition-colors">
            ← Back to start
          </Link>
        </div>
      </div>
    </Layout>
  )
}
