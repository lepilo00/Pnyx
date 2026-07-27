import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from '@/components/Layout'
import { track } from '@/lib/analytics'
import { supabase } from '@/lib/supabaseClient'
import { withTimeout } from '@/lib/withTimeout'
import './LandingPage.css'

export default function LandingPage() {
  const { t } = useTranslation()
  const [languageCount, setLanguageCount] = useState<number | null>(null)
  const heroTitle = t('landing.hero.subtitle')
  const configuredTitleLines = t('landing.hero.titleLines', { returnObjects: true })
  const heroTitleLines = Array.isArray(configuredTitleLines) ? configuredTitleLines.map(String) : [heroTitle]

  useEffect(() => {
    void track('landing_page_view', '/')
  }, [])

  useEffect(() => {
    async function loadLanguageCount() {
      const result = await withTimeout(
        supabase
          .from('walks')
          .select('available_languages, default_language')
          .eq('slug', 'democracy-walk-pnyx')
          .eq('is_published', true)
          .maybeSingle(),
        3000,
      )
      if (result?.error || !result?.data) return
      const { available_languages: available = [], default_language: defaultLanguage } = result.data
      const languages = new Set((available as string[]).map((code) => code.trim()).filter(Boolean))
      if (typeof defaultLanguage === 'string' && defaultLanguage.trim()) languages.add(defaultLanguage.trim())
      setLanguageCount(languages.size)
    }
    void loadLanguageCount()
  }, [])

  return (
    <Layout contentWidth="wide" headerVariant="heroOverlay">
      <section className="home-hero">
        <div className="home-hero-visual">
          <img
            src="/ChatGPT%20Image%2021.%20jul.%202026,%2015_43_34.png"
            alt={t('landing.heroSlideshow.alt')}
            width="942"
            height="1664"
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
          <div className="home-hero-shade" aria-hidden="true" />
          <div className="home-hero-copy">
            <h1 aria-label={heroTitle}>
              {heroTitleLines.map((line) => <span key={line} aria-hidden="true">{line}</span>)}
            </h1>
            <p className="home-hero-support">{t('landing.hero.support')}</p>
          </div>
          <p className="home-hero-meta">
            <HeadphonesIcon />{t('landing.trust.freeVisit')}
            {languageCount !== null && <><span aria-hidden="true">·</span>{t('landing.trust.languages', { count: languageCount })}</>}
          </p>
        </div>

        <div className="home-hero-actions">
          <PrimaryCta />
          <Link to="/navigate" className="home-directions-cta">
            <PinIcon />
            <span><strong>{t('landing.cta.getDirections')}</strong><small>{t('landing.whyVisit.facts.distance')}</small></span>
          </Link>
          <div className="home-benefits">
            {[
              [<WalkIcon />, t('landing.whyVisit.facts.distance')],
              [<TempleIcon />, t('landing.whyVisit.facts.free')],
              [<NoAppIcon />, t('landing.trust.noApp')],
            ].map(([icon, label]) => (
              <div key={String(label)}><span aria-hidden="true">{icon}</span><p>{label}</p></div>
            ))}
          </div>
          <p className="home-free-note"><CheckIcon />{t('landing.whyVisit.facts.audio')}</p>
        </div>
      </section>

      <div className="home-content">

      <section className="mb-12">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-500 mb-2">
          {t('landing.whyVisit.eyebrow')}
        </p>
        <h2 className="font-serif text-3xl leading-tight text-stone-900 dark:text-stone-100 mb-4">
          {t('landing.whyVisit.heading')}
        </h2>
        <p className="whitespace-pre-line text-base leading-relaxed text-stone-600 dark:text-stone-300">
          {t('landing.whyVisit.body')}
        </p>
      </section>

      <section className="rounded-2xl border border-stone-200/70 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 min-[380px]:p-6 shadow-sm mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-500 mb-2">
          {t('landing.how.heading')}
        </p>
        <div className="mt-5 space-y-5">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex gap-4">
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-600 text-sm font-bold text-white">{step}</span>
              <div>
                <h3 className="font-semibold text-stone-800 dark:text-stone-100">{t(`landing.how.step${step}.title`)}</h3>
                <p className="mt-1 text-sm leading-relaxed text-stone-500 dark:text-stone-400">{t(`landing.how.step${step}.body`)}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6"><PrimaryCta /></div>
      </section>

      <footer className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 pb-2 text-xs text-stone-400 dark:text-stone-500">
        <Link to="/about" className="hover:text-amber-700 dark:hover:text-amber-400">{t('common.footer.about')}</Link><Dot />
        <Link to="/how-it-works" className="hover:text-amber-700 dark:hover:text-amber-400">{t('menu.howItWorks')}</Link><Dot />
        <Link to="/contact" className="hover:text-amber-700 dark:hover:text-amber-400">{t('menu.contact')}</Link><Dot />
        <Link to="/privacy" className="hover:text-amber-700 dark:hover:text-amber-400">{t('common.footer.privacy')}</Link>
      </footer>
      </div>
    </Layout>
  )
}

function PrimaryCta() {
  const { t } = useTranslation()
  return <Link to="/start" className="home-primary-cta"><PlayIcon />{t('landing.cta.startFree')}</Link>
}

function Dot() { return <span className="text-amber-500" aria-hidden="true">·</span> }
function PinIcon() { return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" /></svg> }
function WalkIcon() { return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M13 5a2 2 0 10-4 0 2 2 0 004 0zM10 8l-2 5 3 2-1 6m1-9 3 2 3-1m-6 2 4 6" strokeLinecap="round" strokeLinejoin="round" /></svg> }
function TempleIcon() { return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M12 3l9 5H3l9-5zM5 8v9m4.5-9v9m5-9v9M19 8v9M3 20h18" strokeLinecap="round" strokeLinejoin="round" /></svg> }
function HeadphonesIcon() { return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M4 14v-2a8 8 0 0116 0v2" /><rect x="3" y="14" width="4" height="6" rx="1.5" /><rect x="17" y="14" width="4" height="6" rx="1.5" /></svg> }
function NoAppIcon() { return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="7" y="2" width="10" height="20" rx="2"/><path d="M9 18h6M4 4l16 16"/></svg> }
function CheckIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/></svg> }
function PlayIcon() { return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m8 5 11 7-11 7V5Z"/></svg> }
