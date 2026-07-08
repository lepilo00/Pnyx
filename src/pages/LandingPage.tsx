import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from '@/components/Layout'
import DisclaimerBox from '@/components/DisclaimerBox'
import EmailSignupForm from '@/components/EmailSignupForm'
import HeroSlideshow from '@/components/HeroSlideshow'
import AudioPlayer from '@/components/AudioPlayer'
import { track } from '@/lib/analytics'
import { useIntroAudio } from '@/lib/useIntroAudio'
import { LANDING_HERO_IMAGES } from '@/data/heroSlideshowImages'

const STOP_KEYS = ['stop1', 'stop2', 'stop3', 'stop4'] as const

export default function LandingPage() {
  const { t } = useTranslation()
  const introAudioUrl = useIntroAudio()

  useEffect(() => {
    void track('landing_page_view', '/')
  }, [])

  return (
    <Layout>
      {/* ── Hero ── */}
      <section className="-mx-4 -mt-6 px-6 pt-6 pb-8 mb-6
                           bg-gradient-to-b from-amber-50 to-stone-50
                           dark:from-stone-900 dark:to-stone-950
                           border-b border-stone-100 dark:border-stone-800">
        {/* Headline — at the top */}
        <h1 className="font-serif text-3xl sm:text-4xl font-bold
                      text-stone-900 dark:text-stone-50
                      leading-tight text-center mb-4">
          <span className="text-amber-600 dark:text-amber-400">
            {t('landing.hero.reveal')}
          </span>
        </h1>

        {/* Teaser badge */}
        <div className="text-center mb-5">
          <p className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5
                        bg-amber-100 border border-amber-300 text-amber-800
                        dark:bg-amber-900/40 dark:border-amber-700 dark:text-amber-200
                        font-sans text-sm font-semibold tracking-wide">
            <span aria-hidden="true">✦</span>
            {t('landing.hero.hook1')}
          </p>
        </div>

        {/* Hook line */}
        <div className="max-w-sm mx-auto mb-4 text-center">
          <p className="font-serif italic text-lg sm:text-xl text-stone-700 dark:text-stone-200 leading-snug">
            {t('landing.hero.hook2')}
          </p>
        </div>

        {/* Supporting copy */}
        <p className="font-sans text-stone-600 dark:text-stone-400
                      leading-relaxed text-[15px] text-center mb-6
                      max-w-sm mx-auto">
          {t('landing.hero.support')}
        </p>

        {/* Image slideshow */}
        <div className="mb-6 -mx-2">
          <HeroSlideshow images={LANDING_HERO_IMAGES} />
        </div>

        {/* Intro audio — only once an intro track is configured in the walk row */}
        {introAudioUrl && (
          <div className="mb-6">
            <AudioPlayer
              src={introAudioUrl}
              title={t('landing.introAudio.title')}
              onPlay={() => void track('intro_audio_started', '/')}
            />
          </div>
        )}

        {/* CTAs */}
        <div className="space-y-3">
          <Link
            to="/start"
            className="flex items-center justify-center gap-2 w-full
                       bg-amber-600 hover:bg-amber-700 active:bg-amber-800
                       text-white font-semibold text-lg py-4 rounded-2xl
                       transition-colors shadow-lg shadow-amber-200 dark:shadow-amber-900/30"
          >
            {t('landing.cta.startWalk')}
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
            {t('landing.cta.notifyMe')}
          </a>
        </div>
      </section>

      {/* ── Feature pills ── */}
      <div className="flex flex-wrap gap-2 justify-center mb-8">
        {[
          { icon: '🎧', text: t('landing.features.audioStops') },
          { icon: '⏱', text: t('landing.features.duration') },
          { icon: '🆓', text: t('landing.features.free') },
          { icon: '📍', text: t('landing.features.location') },
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
          {t('landing.stopsPreview.heading')}
        </h2>
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-800 shadow-sm overflow-hidden">
          {STOP_KEYS.map((key, i) => (
            <div
              key={key}
              className={`flex items-start gap-3 px-4 py-3.5 ${
                i < STOP_KEYS.length - 1
                  ? 'border-b border-stone-50 dark:border-stone-800'
                  : ''
              }`}
            >
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
                {t(`stops.${key}.title`)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── About section ── */}
      <section className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-800 shadow-sm p-5 mb-8">
        <h2 className="font-serif text-lg font-bold text-stone-800 dark:text-stone-100 mb-2">
          {t('landing.about.heading')}
        </h2>
        <p className="text-stone-600 dark:text-stone-400 text-sm leading-relaxed">
          {t('landing.about.body')}
        </p>
      </section>

      {/* ── Who made this ── */}
      <section className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-800 shadow-sm p-5 mb-8">
        <h2 className="font-serif text-lg font-bold text-stone-800 dark:text-stone-100 mb-2">
          {t('landing.aboutTeam.heading')}
        </h2>
        <p className="text-stone-600 dark:text-stone-400 text-sm leading-relaxed mb-3">
          {t('landing.aboutTeam.body')}
        </p>
        <Link
          to="/about"
          className="text-sm font-medium text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 transition-colors"
        >
          {t('landing.aboutTeam.link')} →
        </Link>
      </section>

      {/* ── Legal disclaimer ── */}
      <div className="mb-8">
        <DisclaimerBox variant="legal" />
      </div>

      {/* ── Email signup ── */}
      <section id="signup" className="mb-8 scroll-mt-20">
        <div className="mb-4">
          <h2 className="font-serif text-xl font-bold text-stone-800 dark:text-stone-100 mb-1">
            {t('landing.signup.heading')}
          </h2>
          <p className="text-stone-500 dark:text-stone-400 text-sm">
            {t('landing.signup.subhead')}
          </p>
        </div>
        <EmailSignupForm source="landing" />
      </section>
    </Layout>
  )
}
