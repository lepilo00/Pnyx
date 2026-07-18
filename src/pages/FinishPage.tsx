import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from '@/components/Layout'
import EmailSignupForm from '@/components/EmailSignupForm'
import { track } from '@/lib/analytics'
import { supabase } from '@/lib/supabaseClient'
import { groupStories } from '@/lib/storyGroups'
import { useListeningProgress } from '@/lib/audioProgress'
import { isStopLocked, useEntitlements } from '@/lib/entitlements'
import type { Stop, Walk } from '@/lib/types'
import { loadSurvey, localized as localizedText, type FeedbackSurvey } from '@/lib/feedback'

export default function FinishPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { unlocked } = useEntitlements()
  const progress = useListeningProgress()
  const stops = useMemo(() => (location.state as { stops?: Stop[] } | null)?.stops ?? [], [location.state])
  const [walk, setWalk] = useState<Walk | null>(null)
  const [feedbackSurvey, setFeedbackSurvey] = useState<FeedbackSurvey | null>(null)
  const { mainStories, bonusStories } = groupStories(stops)

  useEffect(() => {
    void track('walk_completed', '/finish')
    const walkId = stops[0]?.walk_id
    if (walkId) {
      void supabase.from('walks').select('*').eq('id', walkId).maybeSingle().then(({ data }) => setWalk(data as Walk | null))
      const betaToken=sessionStorage.getItem('pnyx_beta_token')||undefined
      void loadSurvey(walkId,betaToken).then(setFeedbackSurvey).catch(()=>setFeedbackSurvey(null))
    }
  }, [stops])

  const localized = walk?.localized_content?.[i18n.language]
  const guideTitle = localized?.title || walk?.title || t('listening.guideTitle')
  const completionMessage = localized?.completion_message || walk?.completion_message || t('finish.subhead')
  const bonusTitle = localized?.bonus_section_title || walk?.bonus_section_title || t('listening.bonusStories')
  const bonusDescription = localized?.bonus_section_description || walk?.bonus_section_description || t('listening.continueExploring')
  const completedMain = mainStories.filter((story) => progress.stories[story.id]?.completed).length
  const completedBonus = bonusStories.filter((story) => progress.stories[story.id]?.completed).length
  const bonusComplete = bonusStories.length > 0 && completedBonus === bonusStories.length
  const totalMinutes = walk?.duration_minutes || Math.ceil(mainStories.reduce((sum, story) => sum + (story.duration_seconds ?? 0), 0) / 60)
  const completionPercent = mainStories.length ? Math.round((completedMain / mainStories.length) * 100) : 0
  const feedbackEligible = feedbackSurvey && feedbackSurvey.display_timing !== 'manually_triggered' && (feedbackSurvey.display_timing !== 'after_all_content_completion' || bonusStories.length === 0 || bonusComplete)

  const exploreBonus = () => {
    const first = bonusStories[0]
    if (!first) return
    if (isStopLocked(first, unlocked)) navigate('/premium', { state: { fromStopId: first.id, stops } })
    else navigate(`/stop/${first.id}`, { state: { stops } })
  }

  return (
    <Layout showBack>
      <div className="space-y-12 pb-8">
        <section className="relative -mx-4 overflow-hidden border-b border-amber-200 bg-[#fbf6e9] px-7 pb-12 pt-14 text-center dark:border-stone-800 dark:bg-stone-900">
          <div className="pointer-events-none absolute inset-0 opacity-[0.025] [background-image:radial-gradient(#1c1917_0.7px,transparent_0.7px)] [background-size:12px_12px]" aria-hidden="true" />
          <div className="completion-icon relative mx-auto mb-7 flex h-16 w-16 items-center justify-center rounded-full border border-amber-600 text-amber-700" aria-hidden="true">
            <svg className="h-8 w-8" viewBox="0 0 32 32" fill="none"><path className="completion-check" d="m9 16.5 4.5 4.5L23 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <div className="completion-title relative">
            <p className="text-[10px] font-bold uppercase tracking-[0.27em] text-amber-700">{t('listening.walkCompleted')}</p>
            <h1 className="mx-auto mt-4 max-w-md font-serif text-[2.45rem] font-bold leading-[1.08] tracking-[-0.025em] text-navy-900 dark:text-stone-100">{t('listening.completedGuide', { title: guideTitle })}</h1>
            <p className="mx-auto mt-6 max-w-sm text-[15px] leading-7 text-stone-600 dark:text-stone-400">{completionMessage}</p>
          </div>
        </section>

        <section className="completion-stats -mt-12 border-y border-amber-200/80 py-6" aria-label={t('listening.storiesCompleted')}>
          <dl className="grid grid-cols-3 divide-x divide-amber-200/80 text-center">
            <div className="px-2"><dt className="text-[9px] font-bold uppercase tracking-[0.15em] text-stone-500">{t('listening.stories')}</dt><dd className="mt-2 font-serif text-xl font-bold text-navy-900 dark:text-stone-100">{completedMain}/{mainStories.length}</dd></div>
            <div className="px-2"><dt className="text-[9px] font-bold uppercase tracking-[0.15em] text-stone-500">{t('listening.minutes')}</dt><dd className="mt-2 font-serif text-xl font-bold text-navy-900 dark:text-stone-100">{totalMinutes}</dd></div>
            <div className="px-2"><dt className="text-[9px] font-bold uppercase tracking-[0.15em] text-stone-500">{t('audioPlayer.progressLabel')}</dt><dd className="mt-2 font-serif text-xl font-bold text-navy-900 dark:text-stone-100">{completionPercent}%</dd></div>
          </dl>
        </section>

        {bonusStories.length > 0 && <section className="completion-bonus border-y border-amber-200/80 bg-[#fbf7ed]/60 px-5 py-8 dark:border-stone-700 dark:bg-stone-900/40">
          <div className="flex items-center justify-between gap-4"><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-700">{t('listening.bonusStories')}</p><span className="text-[10px] font-semibold tabular-nums text-stone-400">{completedBonus}/{bonusStories.length}</span></div>
          <h2 className="mt-3 font-serif text-[1.65rem] font-bold leading-tight text-navy-900 dark:text-stone-100">{bonusComplete ? t('listening.bonusCompleted') : bonusTitle}</h2>
          <p className="mt-3 text-sm leading-6 text-stone-600 dark:text-stone-400">{bonusComplete ? t('listening.bonusCompletedMessage') : bonusDescription}</p>
          <div className="mt-7 space-y-3">
            {!bonusComplete && <button onClick={exploreBonus} className="min-h-12 w-full bg-amber-600 px-4 font-semibold text-white transition-colors hover:bg-amber-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-700 focus-visible:ring-offset-2">{t('listening.exploreBonus')} →</button>}
            {mainStories[0] && <Link to={`/stop/${mainStories[0].id}`} state={{ stops }} className={`flex min-h-12 w-full items-center justify-center border px-4 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-700 ${bonusComplete ? 'border-amber-600 bg-amber-600 text-white hover:bg-amber-700' : 'border-amber-300 text-amber-800 hover:bg-amber-50 dark:text-amber-400'}`}>{t('listening.backToGuide')}</Link>}
          </div>
        </section>}

        {bonusStories.length === 0 && mainStories[0] && <Link to={`/stop/${mainStories[0].id}`} state={{ stops }} className="flex min-h-12 items-center justify-center border border-amber-300 text-sm font-semibold text-amber-800">{t('listening.backToGuide')}</Link>}

        {feedbackEligible && <section className="border-y border-amber-200/80 py-8 text-center"><p className="text-[10px] font-bold uppercase tracking-[.24em] text-amber-700">{t('feedback.invitationEyebrow','Help us improve Pnyx')}</p><h2 className="mt-3 font-serif text-2xl text-navy-900">{localizedText(feedbackSurvey.title,i18n.language)}</h2><p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-stone-600">{localizedText(feedbackSurvey.introduction,i18n.language)}</p><p className="mt-2 text-xs text-stone-400">{t('feedback.estimatedTime','Approximately {{count}} minutes',{count:feedbackSurvey.estimated_minutes})}</p><Link to={`/feedback/${feedbackSurvey.guide_id}${sessionStorage.getItem('pnyx_beta_token')?`?invite=${encodeURIComponent(sessionStorage.getItem('pnyx_beta_token')!)}`:''}`} className="mt-6 inline-flex min-h-12 items-center border border-amber-700 px-8 font-semibold text-amber-800">{t('feedback.giveFeedback','Give feedback')}</Link></section>}
        <div className="border-t border-amber-200/70" />
        <section><h2 className="mb-1 font-serif text-xl font-bold text-stone-800 dark:text-stone-100">{t('finish.signupHeading')}</h2><p className="mb-5 text-sm leading-6 text-stone-500">{t('finish.signupSubhead')}</p><EmailSignupForm source="finish" /></section>
      </div>
    </Layout>
  )
}
