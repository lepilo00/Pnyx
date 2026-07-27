import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from '@/components/Layout'
import FreeChapterCard from '@/components/FreeChapterCard'
import { supabase } from '@/lib/supabaseClient'
import { withTimeout } from '@/lib/withTimeout'
import { useFallbackStops } from '@/data/fallbackStops'
import { useLocalizedStops } from '@/lib/useLocalizedStops'
import { markStopAsListened, useListenedStopIds } from '@/lib/audioProgress'
import { GOOGLE_MAPS_DIRECTIONS_URL } from '@/lib/constants'
import { useUnlockPrice } from '@/lib/useAppSettings'
import { LANGUAGES } from '@/data/languages'
import { track } from '@/lib/analytics'
import type { Stop } from '@/lib/types'
import './StartPage.css'

export default function StartPage() {
  const { t, i18n } = useTranslation()
  const fallbackStops = useFallbackStops()
  const listenedIds = useListenedStopIds()
  const price = useUnlockPrice()
  const [stops, setStops] = useState<Stop[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const result = await withTimeout(supabase.from('stops').select('*').eq('is_published', true).order('order_index'), 3000)
      setStops(result?.error || !result?.data?.length ? fallbackStops : result.data as Stop[])
      setLoading(false)
    }
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language])

  const freeStops = useLocalizedStops(stops).filter((stop) => stop.story_type !== 'bonus' && !stop.is_paid)
  const priceLabel = `€${price.toFixed(2)}`

  return (
    <Layout showBack headerVariant="premium">
      <div className="start-page">
        <section aria-labelledby="start-heading">
          <p className="start-eyebrow">{t('start.eyebrow')}</p>
          <h1 id="start-heading">{t('start.heading')}</h1>
          <p className="start-subtitle">{t('start.subhead')}</p>
          <p className="start-location">
            <PinIcon />
            <a href={GOOGLE_MAPS_DIRECTIONS_URL} target="_blank" rel="noreferrer">{t('start.navigateButton')}</a>
            <span aria-hidden="true">•</span><span>{t('freeExperience.walkInfo')}</span>
          </p>
        </section>

        <section className="start-intro" aria-label={t('landing.about.heading')}>
          {t('landing.about.body')}
        </section>

        <section className="start-stories" aria-label={t('freeExperience.heading')}>
          {loading ? [0, 1, 2].map((item) => <div className="start-skeleton" key={item} />) : freeStops.map((stop, index) => (
            <FreeChapterCard key={stop.id} index={index} title={stop.title} src={stop.audio_url ?? ''}
              transcript={stop.description} isListened={listenedIds.includes(stop.id)} isExpanded={expandedId === stop.id}
              onToggleExpanded={() => setExpandedId((id) => id === stop.id ? null : stop.id)}
              onPlay={() => void track('stop_audio_started', '/start', { stop_id: stop.id })}
              onEnded={() => { markStopAsListened(stop.id); setExpandedId(null) }} />
          ))}
        </section>

        <p className="start-explainer">{t('premium.intro')}</p>
        <Link className="start-cta" to="/premium">{t('freeExperience.goDeeper.cta')}<ArrowIcon /></Link>

        <Link to="/premium" className="experience-card" aria-label={t('premium.unlock.heading')}>
          <p className="experience-eyebrow">{t('premium.eyebrow')}</p>
          <h2>{t('premium.title')}</h2>
          <p className="experience-copy">{t('freeExperience.goDeeper.body')}</p>
          <div className="experience-features">
            <Feature icon={<SpeakerIcon />} value={t('freeExperience.meta.duration')} label={t('freeExperience.goDeeper.features.onSite')} />
            <Feature icon={<BookIcon />} value={t('premium.meta.audio')} label={t('premium.discover.heading')} />
            <Feature icon={<StarIcon />} value={t('premium.meta.bonus')} label={t('premium.features.bonus')} />
            <Feature icon={<GlobeIcon />} value={String(LANGUAGES.length)} label={t('premium.meta.languages')} />
          </div>
          <div className="experience-price"><strong>{priceLabel}</strong><span><b>{t('premium.unlock.heading')}</b><small>{t('premium.unlock.conditions')}</small></span></div>
        </Link>
      </div>
    </Layout>
  )
}

function Feature({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return <div className="experience-feature"><span>{icon}</span><strong>{value}</strong><small>{label}</small></div>
}
const Svg = ({ children }: { children: React.ReactNode }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
function PinIcon() { return <Svg><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></Svg> }
function ArrowIcon() { return <Svg><path d="M5 12h14m-5-5 5 5-5 5"/></Svg> }
function SpeakerIcon() { return <Svg><path d="M5 9H2v6h3l5 4V5L5 9Zm9-1a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/></Svg> }
function BookIcon() { return <Svg><path d="M3 5c4-1 7 0 9 2v13c-2-2-5-3-9-2V5Zm18 0c-4-1-7 0-9 2v13c2-2 5-3 9-2V5Z"/></Svg> }
function StarIcon() { return <Svg><path d="m12 2 3 6 7 .9-5 4.8 1.4 7-6.4-3.3-6.4 3.3 1.4-7-5-4.8L9 8l3-6Z"/></Svg> }
function GlobeIcon() { return <Svg><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c4 4 4 14 0 18M12 3c-4 4-4 14 0 18"/></Svg> }
