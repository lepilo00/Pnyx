import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from '@/components/Layout'
import DisclaimerBox from '@/components/DisclaimerBox'
import EmailSignupForm from '@/components/EmailSignupForm'
import HeroSlideshow from '@/components/HeroSlideshow'
import { track } from '@/lib/analytics'
import { LANDING_HERO_IMAGES } from '@/data/heroSlideshowImages'

export default function LandingPage() {
  const { t } = useTranslation()

  useEffect(() => {
    void track('landing_page_view', '/')
  }, [])

  return (
    <Layout>
      {/* ── Hero ── */}
      <section className="-mt-3 pb-2 mb-6">
        {/* Hero image */}
        <div className="mb-3 -mx-2">
          <HeroSlideshow
            images={LANDING_HERO_IMAGES}
            aspectClassName="aspect-[372/485]"
            imagePositionClassName="object-[center_15%]"
            frameClassName="rounded-xl border border-amber-200/60 dark:border-stone-700 bg-parchment-50 dark:bg-stone-900 shadow-sm"
          />
        </div>

        {/* CTAs */}
        <div className="space-y-3">
          <Link
            to="/start"
            className="flex items-center justify-center gap-2 w-full
                       bg-amber-600 hover:bg-amber-700 active:bg-amber-800
                       text-white font-semibold text-lg py-3.5 rounded-xl
                       transition-colors shadow-md shadow-amber-600/20"
          >
            {t('landing.cta.startFree')}
          </Link>
          <Link
            to="/navigate"
            className="flex items-center justify-center gap-2 w-full
                       bg-parchment-50 dark:bg-stone-800
                       hover:bg-white dark:hover:bg-stone-700
                       border border-amber-600 dark:border-amber-500
                       text-amber-700 dark:text-amber-400
                       font-medium text-base py-3 rounded-xl
                       transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
            {t('landing.cta.getDirections')}
          </Link>
        </div>
      </section>

      {/* ── Free vs Go deeper cards ── */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Link
          to="/start"
          className="rounded-2xl border border-amber-300/60 dark:border-amber-900/50
                     bg-parchment-50 dark:bg-amber-950/20 p-4
                     hover:border-amber-400 dark:hover:border-amber-800 transition-colors"
        >
          <span className="block mb-2 text-amber-700 dark:text-amber-400" aria-hidden="true">
            <TempleLineIcon />
          </span>
          <p className="font-semibold text-sm text-amber-700 dark:text-amber-300 mb-1">
            {t('landing.cards.free.title')}
          </p>
          <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
            {t('landing.cards.free.body')}
          </p>
        </Link>
        <Link
          to="/premium"
          className="rounded-2xl border border-navy-800
                     bg-navy-950 p-4
                     hover:bg-navy-900 hover:border-navy-700 transition-colors"
        >
          <span className="block mb-2 text-stone-300" aria-hidden="true">
            <HeadphonesLineIcon />
          </span>
          <p className="font-semibold text-sm text-stone-100 mb-1">
            {t('landing.cards.deeper.title')}
          </p>
          <p className="text-xs text-stone-300 leading-relaxed">
            {t('landing.cards.deeper.body')}
          </p>
        </Link>
      </div>

      {/* ── Trust badges ── */}
      <div className="grid grid-cols-2 gap-2 mb-8">
        {[
          { icon: <GiftLineIcon />, text: t('landing.badges.free') },
          { icon: <PhoneLineIcon />, text: t('landing.badges.audio') },
        ].map(({ icon, text }) => (
          <div key={text} className="flex flex-col items-center gap-1.5 text-center px-1">
            <span className="text-stone-600 dark:text-stone-400" aria-hidden="true">{icon}</span>
            <span className="text-xs text-stone-500 dark:text-stone-400 leading-tight">{text}</span>
          </div>
        ))}
      </div>

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

function TempleLineIcon() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3l8 4.5H4L12 3zM5.5 7.5v9m4.3-9v9m4.4-9v9m4.3-9v9M3.5 20.5h17M4.5 17.5h15" />
    </svg>
  )
}

function HeadphonesLineIcon() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 14v-2a8 8 0 0116 0v2" />
      <rect x="3" y="14" width="4" height="6" rx="1.5" />
      <rect x="17" y="14" width="4" height="6" rx="1.5" />
    </svg>
  )
}

function GiftLineIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="9" width="16" height="4" />
      <path d="M5.5 13v7h13v-7M12 9v11M12 9c-2 0-4.5-.7-4.5-3A2 2 0 0110 4c1.8 0 2 2.8 2 5zm0 0c2 0 4.5-.7 4.5-3A2 2 0 0014 4c-1.8 0-2 2.8-2 5z" />
    </svg>
  )
}

function PhoneLineIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
      <path d="M11 18.5h2" />
    </svg>
  )
}
