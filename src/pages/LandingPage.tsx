import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import Layout from '@/components/Layout'
import DisclaimerBox from '@/components/DisclaimerBox'
import EmailSignupForm from '@/components/EmailSignupForm'
import { track } from '@/lib/analytics'

export default function LandingPage() {
  useEffect(() => {
    void track('landing_page_view', '/')
  }, [])

  return (
    <Layout>
      {/* Hero */}
      <section className="text-center pt-6 pb-8">
        <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1 rounded-full mb-6">
          <span>🏛</span>
          <span>Free · 20 minutes · Pnyx, Athens</span>
        </div>

        <h1 className="font-serif text-3xl font-bold text-stone-900 leading-tight mb-4">
          You saw the Acropolis. Now stand where democracy actually spoke.
        </h1>

        <p className="text-stone-600 leading-relaxed mb-8 text-base">
          A free 20-minute self-guided educational audio walk to the Pnyx — one of Athens' most
          overlooked historic places.
        </p>

        <Link
          to="/start"
          className="block w-full bg-amber-600 hover:bg-amber-700 text-white
                     font-semibold text-lg py-4 rounded-2xl transition-colors text-center"
        >
          Start the free walk →
        </Link>
      </section>

      {/* What to expect */}
      <section className="mb-8 space-y-3">
        <h2 className="font-serif text-xl font-bold text-stone-800">What to expect</h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: '🎧', label: '4 audio stops' },
            { icon: '🕐', label: '~20 minutes' },
            { icon: '🆓', label: 'Completely free' },
          ].map(({ icon, label }) => (
            <div key={label} className="bg-white rounded-2xl border border-stone-100 p-3 text-center shadow-sm">
              <div className="text-2xl mb-1">{icon}</div>
              <p className="text-xs font-medium text-stone-600">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* About the site */}
      <section className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 mb-8">
        <h2 className="font-serif text-lg font-bold text-stone-800 mb-2">About the Pnyx</h2>
        <p className="text-stone-600 text-sm leading-relaxed">
          The Pnyx is the hill in central Athens where the citizens' assembly of ancient Athens
          gathered for over 200 years. While millions visit the Acropolis each year, the Pnyx —
          just a short walk away — remains largely unknown. This walk tells the story of the place
          where democracy was practised, debated and challenged.
        </p>
      </section>

      {/* Legal disclaimer */}
      <div className="mb-8">
        <DisclaimerBox variant="legal" />
      </div>

      {/* Email signup */}
      <section className="mb-8">
        <div className="text-center mb-4">
          <h2 className="font-serif text-xl font-bold text-stone-800 mb-1">
            Extended version coming soon
          </h2>
          <p className="text-stone-500 text-sm">
            Get notified when the full 45-minute walk launches.
          </p>
        </div>
        <EmailSignupForm source="landing" />
      </section>
    </Layout>
  )
}
