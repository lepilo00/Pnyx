import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import Layout from '@/components/Layout'
import DisclaimerBox from '@/components/DisclaimerBox'
import EmailSignupForm from '@/components/EmailSignupForm'
import { track } from '@/lib/analytics'

const STOP_TITLES = [
  'Why almost everyone misses the Pnyx',
  'Where the Athenian Assembly met',
  'Who was allowed to speak — and who was excluded',
  'What democracy meant then — and what it means now',
]

export default function LandingPage() {
  useEffect(() => {
    void track('landing_page_view', '/')
  }, [])

  return (
    <Layout>
      {/* ── Hero ── */}
      <section className="-mx-4 px-6 pt-10 pb-8 mb-6
                           bg-gradient-to-b from-amber-50 to-stone-50
                           dark:from-stone-900 dark:to-stone-950
                           border-b border-stone-100 dark:border-stone-800">
        {/* Badge */}
        <div className="flex justify-center mb-6">
          <span className="inline-flex items-center gap-2 bg-white dark:bg-stone-800
                           border border-stone-200 dark:border-stone-700
                           text-stone-600 dark:text-stone-300
                           text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Athens, Greece · Free · ~20 min
          </span>
        </div>

        {/* Headline */}
        <h1 className="font-serif text-[2rem] sm:text-4xl font-bold text-stone-900 dark:text-stone-50
                        leading-tight text-center mb-4">
          You saw the Acropolis.{' '}
          <span className="text-amber-600 dark:text-amber-400">
            Now stand where democracy actually spoke.
          </span>
        </h1>

        <p className="text-stone-600 dark:text-stone-400 leading-relaxed text-base text-center mb-6 max-w-sm mx-auto">
          A free self-guided educational audio walk to the Pnyx — one of Athens' most
          overlooked historic places.
        </p>

        {/* Map illustration */}
        <div className="mb-6 -mx-2">
          <img
            src="/pnyx-map.png"
            alt="Illustrated map showing the walking path from the Acropolis area to the Pnyx — approximately 10 minutes on foot"
            className="w-full rounded-2xl shadow-md"
          />
        </div>

        {/* CTAs */}
        <div className="space-y-3">
          <Link
            to="/start"
            className="flex items-center justify-center gap-2 w-full
                       bg-amber-600 hover:bg-amber-700 active:bg-amber-800
                       text-white font-semibold text-lg py-4 rounded-2xl
                       transition-colors shadow-lg shadow-amber-200 dark:shadow-amber-900/30"
          >
            Start the free walk
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <a
            href="#signup"
            className="flex items-center justify-center w-full
                       bg-white dark:bg-stone-800
                       hover:bg-stone-50 dark:hover:bg-stone-700
                       border border-stone-200 dark:border-stone-700
                       text-stone-700 dark:text-stone-200
                       font-medium text-base py-3.5 rounded-2xl
                       transition-colors"
          >
            Notify me when extended version launches
          </a>
        </div>
      </section>

      {/* ── Feature pills ── */}
      <div className="flex flex-wrap gap-2 justify-center mb-8">
        {[
          { icon: '🎧', text: '4 audio stops' },
          { icon: '⏱', text: '~20 minutes' },
          { icon: '🆓', text: 'Always free' },
          { icon: '📍', text: 'Pnyx Hill' },
        ].map(({ icon, text }) => (
          <span
            key={text}
            className="inline-flex items-center gap-1.5
                       bg-white dark:bg-stone-900
                       border border-stone-200 dark:border-stone-800
                       text-stone-600 dark:text-stone-300
                       text-sm px-3 py-1.5 rounded-full shadow-sm"
          >
            <span>{icon}</span>
            <span>{text}</span>
          </span>
        ))}
      </div>

      {/* ── Stop preview ── */}
      <section className="mb-8">
        <h2 className="font-serif text-xl font-bold text-stone-800 dark:text-stone-100 mb-3">
          4 stops on this walk
        </h2>
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-800 shadow-sm overflow-hidden">
          {STOP_TITLES.map((title, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 px-4 py-3.5 ${
                i < STOP_TITLES.length - 1
                  ? 'border-b border-stone-50 dark:border-stone-800'
                  : ''
              }`}
            >
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">{title}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── About section ── */}
      <section className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-800 shadow-sm p-5 mb-8">
        <h2 className="font-serif text-lg font-bold text-stone-800 dark:text-stone-100 mb-2">
          About the Pnyx
        </h2>
        <p className="text-stone-600 dark:text-stone-400 text-sm leading-relaxed">
          The Pnyx is the hill in central Athens where the citizens' assembly gathered for over
          200 years. While millions visit the Acropolis each year, the Pnyx — a short walk away —
          remains largely unknown. This walk tells the story of the place where democracy was
          not just invented, but practised.
        </p>
      </section>

      {/* ── Legal disclaimer ── */}
      <div className="mb-8">
        <DisclaimerBox variant="legal" />
      </div>

      {/* ── Email signup ── */}
      <section id="signup" className="mb-8 scroll-mt-20">
        <div className="mb-4">
          <h2 className="font-serif text-xl font-bold text-stone-800 dark:text-stone-100 mb-1">
            Extended version coming soon
          </h2>
          <p className="text-stone-500 dark:text-stone-400 text-sm">
            Get notified when the full 45-minute walk launches.
          </p>
        </div>
        <EmailSignupForm source="landing" />
      </section>
    </Layout>
  )
}
