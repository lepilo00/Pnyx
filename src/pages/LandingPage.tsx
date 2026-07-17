import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from '@/components/Layout'
import { track } from '@/lib/analytics'

export default function LandingPage() {
  const { t } = useTranslation()

  useEffect(() => {
    void track('landing_page_view', '/')
  }, [])

  return (
    <Layout>
      <section className="-mt-3 pb-2 mb-10">
        <div className="mb-3 -mx-2">
          <div className="h-[min(55svh,30.5rem)] sm:h-auto sm:aspect-[372/485] rounded-xl overflow-hidden
                          border border-amber-200/60 bg-[#faf6eb] shadow-sm flex flex-col text-center">
            <div className="flex-shrink-0 px-6 pt-6">
              <h1 className="font-serif text-[clamp(3.5rem,17vw,5.5rem)] leading-none font-normal tracking-wide text-amber-800">
                {t('landing.hero.title')}
              </h1>
              <p className="font-serif text-[clamp(1.55rem,6.5vw,2.2rem)] leading-tight text-stone-900 mt-3 max-w-sm mx-auto">
                {t('landing.hero.subtitle')}
              </p>
              <p className="text-[clamp(0.9rem,3.7vw,1.05rem)] leading-snug text-stone-800 mt-4 max-w-sm mx-auto">
                {t('landing.hero.support')}
              </p>
            </div>
            <div className="flex-1 min-h-0 mt-1 overflow-hidden relative">
              <img src="/pnyx-uvodna-zadnja.png" alt="" className="w-full h-full object-cover object-top" />
              <div className="absolute inset-x-0 top-0 h-10 pointer-events-none bg-gradient-to-b from-[#faf6eb]/90 via-[#faf6eb]/35 to-transparent" aria-hidden="true" />
            </div>
          </div>
        </div>

        <div className="space-y-3 -mx-2">
          <PrimaryCta />
          <Link to="/navigate" className="flex items-center justify-center gap-2 w-full bg-parchment-50 dark:bg-stone-800 hover:bg-white dark:hover:bg-stone-700 border border-amber-600 dark:border-amber-500 text-amber-700 dark:text-amber-400 font-medium text-base py-3 rounded-xl transition-colors">
            <PinIcon />
            {t('landing.cta.getDirections')}
          </Link>
          <p className="flex w-full items-center justify-center gap-1.5 min-[380px]:gap-2 whitespace-nowrap rounded-xl border border-amber-200/80 bg-amber-50/80 px-3 min-[380px]:px-4 py-3 text-[11px] min-[380px]:text-xs font-medium tracking-[0.01em] text-stone-600 shadow-sm shadow-amber-900/[0.03] dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-stone-300">
            <span>{t('landing.trust.freeVisit')}</span><Dot />
            <span>{t('landing.trust.languages')}</span><Dot />
            <span>{t('landing.trust.noApp')}</span>
          </p>
        </div>
      </section>

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
        <div className="grid grid-cols-3 gap-2 mt-6">
          {[
            [<WalkIcon />, t('landing.whyVisit.facts.distance')],
            [<TempleIcon />, t('landing.whyVisit.facts.free')],
            [<HeadphonesIcon />, t('landing.whyVisit.facts.audio')],
          ].map(([icon, label]) => (
            <div key={String(label)} className="rounded-xl border border-stone-200/80 dark:border-stone-800 bg-white/70 dark:bg-stone-900/70 px-2 py-4 text-center shadow-sm">
              <span className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400" aria-hidden="true">{icon}</span>
              <p className="text-[11px] min-[380px]:text-xs font-medium leading-snug text-stone-600 dark:text-stone-300">{label}</p>
            </div>
          ))}
        </div>
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
    </Layout>
  )
}

function PrimaryCta() {
  const { t } = useTranslation()
  return <Link to="/start" className="flex items-center justify-center w-full bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-semibold text-lg py-3.5 rounded-xl transition-colors shadow-md shadow-amber-600/20">{t('landing.cta.startFree')}</Link>
}

function Dot() { return <span className="text-amber-500" aria-hidden="true">·</span> }
function PinIcon() { return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" /></svg> }
function WalkIcon() { return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M13 5a2 2 0 10-4 0 2 2 0 004 0zM10 8l-2 5 3 2-1 6m1-9 3 2 3-1m-6 2 4 6" strokeLinecap="round" strokeLinejoin="round" /></svg> }
function TempleIcon() { return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M12 3l9 5H3l9-5zM5 8v9m4.5-9v9m5-9v9M19 8v9M3 20h18" strokeLinecap="round" strokeLinejoin="round" /></svg> }
function HeadphonesIcon() { return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M4 14v-2a8 8 0 0116 0v2" /><rect x="3" y="14" width="4" height="6" rx="1.5" /><rect x="17" y="14" width="4" height="6" rx="1.5" /></svg> }
