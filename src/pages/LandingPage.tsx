import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Trans, useTranslation } from 'react-i18next'
import Layout from '@/components/Layout'
import { track } from '@/lib/analytics'
import './LandingPage.css'

export default function LandingPage() {
  const { t } = useTranslation()
  const heroTitle = t('landing.hero.subtitle')
  const configuredTitleLines = t('landing.hero.titleLines', { returnObjects: true })
  const heroTitleLines = Array.isArray(configuredTitleLines) ? configuredTitleLines.map(String) : [heroTitle]

  useEffect(() => {
    void track('landing_page_view', '/')
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
            <p className="home-hero-eyebrow">{t('landing.hero.eyebrow')}</p>
            <h1 aria-label={heroTitle}>
              {heroTitleLines.map((line) => <span key={line} aria-hidden="true">{line}</span>)}
            </h1>
            <p className="home-hero-support">
              <Trans i18nKey="landing.hero.support" components={{ strong: <strong /> }} />
            </p>
          </div>
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

      <section className="home-why-visit" aria-labelledby="home-why-visit-title">
        <div className="home-why-visit-inner">
          <div className="home-why-visit-lead">
            <div className="home-why-visit-eyebrow-lockup">
              <span aria-hidden="true" />
              <p>{t('landing.whyVisit.eyebrow')}</p>
            </div>
            <h2 id="home-why-visit-title">{t('landing.whyVisit.heading')}</h2>
          </div>
          <div className="home-why-visit-support">
            <p>{t('landing.whyVisit.body')}</p>
          </div>
        </div>
      </section>

      <div className="home-content home-content-after-why">
      <section className="home-journey" aria-labelledby="home-journey-title">
        <div className="home-journey-body">
          <div className="home-journey-heading">
            <span aria-hidden="true" />
            <h2 id="home-journey-title">{t('landing.how.heading')}</h2>
          </div>
          <ol className="home-journey-steps">
            {[1, 2, 3].map((step) => (
              <li key={step}>
                <span className="home-journey-marker" aria-hidden="true">{step}</span>
                <div className="home-journey-step-copy">
                  <h3>{t(`landing.how.step${step}.title`)}</h3>
                  <p>{t(`landing.how.step${step}.body`)}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div className="home-journey-footer"><PrimaryCta /></div>
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
  return <Link to="/listen" className="home-primary-cta"><PlayIcon />{t('landing.cta.startFree')}</Link>
}

function Dot() { return <span className="text-amber-500" aria-hidden="true">·</span> }
function PinIcon() { return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" /></svg> }
function WalkIcon() { return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M13 5a2 2 0 10-4 0 2 2 0 004 0zM10 8l-2 5 3 2-1 6m1-9 3 2 3-1m-6 2 4 6" strokeLinecap="round" strokeLinejoin="round" /></svg> }
function TempleIcon() { return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M12 3l9 5H3l9-5zM5 8v9m4.5-9v9m5-9v9M19 8v9M3 20h18" strokeLinecap="round" strokeLinejoin="round" /></svg> }
function NoAppIcon() { return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="7" y="2" width="10" height="20" rx="2"/><path d="M9 18h6M4 4l16 16"/></svg> }
function CheckIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/></svg> }
function PlayIcon() { return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m8 5 11 7-11 7V5Z"/></svg> }
