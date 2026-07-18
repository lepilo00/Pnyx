import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from '@/components/Layout'
import { supabase } from '@/lib/supabaseClient'
import { anonymousSessionId, conditionMet, loadSurvey, localized, localizedOption, localizedQuestion, localizedSection, type FeedbackSurvey, type SurveyQuestion } from '@/lib/feedback'
import { track } from '@/lib/analytics'

type AnswerMap = Record<string, string | number>
const detectDevice = () => /iPhone/i.test(navigator.userAgent) ? 'iphone' : /Android/i.test(navigator.userAgent) ? 'android_phone' : /iPad|Tablet/i.test(navigator.userAgent) ? 'tablet' : /Mobi/i.test(navigator.userAgent) ? 'other' : 'desktop_or_laptop'

export default function FeedbackPage() {
  const { guideId } = useParams()
  const [params] = useSearchParams()
  const token = params.get('invite') || undefined
  const { i18n } = useTranslation()
  const navigate = useNavigate()
  const [survey, setSurvey] = useState<FeedbackSurvey | null>()
  const [answers, setAnswers] = useState<AnswerMap>({})
  const [step, setStep] = useState(0)
  const [error, setError] = useState('')
  const [errorDetail, setErrorDetail] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const sl = i18n.language.split('-')[0] === 'sl'
  const tx = sl ? {
    loading: 'Nalaganje…', unavailable: 'Anketa ni na voljo', unavailableBody: 'Ta anketa je zaprta ali pa nimate dostopa do nje.', thanks: 'Hvala', completion: 'Vaše povratne informacije bodo pomagale izboljšati ta vodič.', returnGuide: 'Nazaj k vodiču', step: 'Korak', of: 'od', approximately: 'Približno', minutes: 'minute', email: 'E-pošta', optional: 'neobvezno', required: 'je obvezno.', sendError: 'Povratnih informacij ni bilo mogoče poslati. Vaši odgovori so shranjeni; poskusite znova.', privacyStart: 'Vaše povratne informacije', privacyTech: ' in osnovni neobčutljivi tehnični podatki', privacyEnd: ' bodo uporabljeni za izboljšanje tega vodiča.', privacy: 'Pravilnik o zasebnosti', back: 'Nazaj', sending: 'Pošiljanje…', submit: 'Pošlji povratne informacije', next: 'Naprej', defaultTitle: 'Pomagajte nam izboljšati ta vodič', defaultIntro: 'Vaše povratne informacije bodo neposredno vplivale na prihodnje različice.',
  } : {
    loading: 'Loading…', unavailable: 'Feedback unavailable', unavailableBody: 'This survey is closed or you are not eligible to access it.', thanks: 'Thank you', completion: 'Your feedback will shape the future of this guide.', returnGuide: 'Return to the guide', step: 'Step', of: 'of', approximately: 'Approximately', minutes: 'minutes', email: 'Email', optional: 'optional', required: 'is required.', sendError: 'Your feedback could not be sent. Your answers are saved; please retry.', privacyStart: 'Your feedback', privacyTech: ' and basic non-sensitive technical information', privacyEnd: ' will be used to improve this guide.', privacy: 'Privacy policy', back: 'Back', sending: 'Sending…', submit: 'Submit feedback', next: 'Continue', defaultTitle: 'Help us improve this guide', defaultIntro: 'Your feedback will directly shape future versions.',
  }
  const draftKey = survey ? `pnyx-feedback-${survey.id}-${survey.version}` : ''

  useEffect(() => {
    if (!guideId) return
    void loadSurvey(guideId, token).then((loaded) => {
      setSurvey(loaded)
      if (!loaded) return
      if (!loaded.allow_multiple_submissions && localStorage.getItem(`pnyx-feedback-submitted-${loaded.id}`) === '1') {
        setDone(true)
        return
      }
      const saved = localStorage.getItem(`pnyx-feedback-${loaded.id}-${loaded.version}`)
      if (saved) try { setAnswers(JSON.parse(saved)) } catch { /* ignore corrupt draft */ }
      void track('feedback_started', location.pathname)
    }).catch(() => setSurvey(null))
  }, [guideId, token])
  useEffect(() => { if (draftKey) localStorage.setItem(draftKey, JSON.stringify(answers)) }, [answers, draftKey])

  const sections = useMemo(() => [...new Set((survey?.questions ?? []).filter((q) => q.enabled && conditionMet(q, answers)).map((q) => q.section))], [survey, answers])
  const questions = (survey?.questions ?? []).filter((q) => q.enabled && q.section === sections[step] && conditionMet(q, answers))
  const set = (key: string, value: string | number) => setAnswers((current) => ({ ...current, [key]: value }))
  const validate = () => {
    const missing = questions.find((q) => q.required && (answers[q.question_key] === undefined || answers[q.question_key] === ''))
    if (missing) { setError(`${localizedQuestion(missing, i18n.language)} ${tx.required}`); setErrorDetail(''); return false }
    setError(''); setErrorDetail(''); return true
  }
  const next = () => {
    if (!validate()) return
    if (step < sections.length - 1) { void track('feedback_step_completed', location.pathname, { metadata: { step: step + 1 } }); setStep((current) => current + 1); scrollTo(0, 0) }
    else void submit()
  }
  const submit = async () => {
    if (!survey || busy) return
    setBusy(true); setError(''); setErrorDetail('')
    const progress = JSON.parse(localStorage.getItem('pnyx-listening-progress') || '{}')
    const technical = survey.collect_technical_context ? { app_version: import.meta.env.VITE_APP_VERSION || null, device: detectDevice(), browser: navigator.userAgent.slice(0, 180), screen: `${screen.width}x${screen.height}`, locale: i18n.language, entry_point: params.get('source') || 'direct' } : {}
    const { error: submitError } = await supabase.rpc('submit_feedback', { p_survey_id: survey.id, p_invitation_token: token ?? null, p_anonymous_session_id: anonymousSessionId(), p_email: (answers.email as string) || null, p_answers: answers, p_context: technical, p_progress: progress })
    if (submitError) {
      if (submitError.message.includes('Feedback already submitted')) {
        localStorage.removeItem(draftKey)
        localStorage.setItem(`pnyx-feedback-submitted-${survey.id}`, '1')
        setDone(true)
        setBusy(false)
        return
      }
      const knownSl = submitError.message.includes('Required answer missing') ? 'Manjka obvezen odgovor. Vrnite se nazaj in preverite odgovore.'
        : submitError.message.includes('Survey unavailable') ? 'Anketa trenutno ni na voljo.'
        : submitError.message.includes('Sign in required') ? 'Za oddajo se morate prijaviti.'
        : submitError.message.includes('Invalid or expired invitation') ? 'Vabilo ni veljavno ali je poteklo.'
        : submitError.message.includes('Please wait') ? 'Pred ponovnim poskusom počakajte nekaj trenutkov.'
        : tx.sendError
      setError(sl ? knownSl : submitError.message || tx.sendError)
      setErrorDetail(`${submitError.code || 'SUPABASE'}: ${submitError.message}`)
      setBusy(false)
      void track('feedback_submission_failed', location.pathname)
      return
    }
    localStorage.removeItem(draftKey); localStorage.setItem(`pnyx-feedback-submitted-${survey.id}`, '1'); setDone(true); void track('feedback_submitted', location.pathname)
  }

  if (survey === undefined) return <Layout><p className="py-20 text-center text-stone-500">{tx.loading}</p></Layout>
  if (!survey) return <Layout showBack><div className="py-20 text-center"><h1 className="font-serif text-3xl text-navy-900">{tx.unavailable}</h1><p className="mt-3 text-stone-500">{tx.unavailableBody}</p></div></Layout>
  if (done) return <Layout><section className="mx-auto max-w-md py-20 text-center"><p className="text-[10px] font-bold uppercase tracking-[.28em] text-amber-700">{tx.thanks}</p><h1 className="mt-4 font-serif text-4xl text-navy-900">{sl ? survey.completion_message.sl || tx.completion : localized(survey.completion_message, i18n.language, tx.completion)}</h1><button onClick={() => navigate(-1)} className="mt-10 min-h-12 border border-amber-700 px-8 text-amber-800">{tx.returnGuide}</button></section></Layout>
  return <Layout showBack><main className="mx-auto max-w-xl pb-28 pt-8">
    <p className="text-[10px] font-bold uppercase tracking-[.24em] text-amber-700">{tx.step} {step + 1} {tx.of} {sections.length}</p>
    <div className="mt-3 h-px bg-stone-200"><div className="h-px bg-amber-700 transition-all" style={{ width: `${((step + 1) / sections.length) * 100}%` }} /></div>
    {step === 0 && <><h1 className="mt-8 font-serif text-4xl leading-tight text-navy-900">{sl ? survey.title.sl || tx.defaultTitle : localized(survey.title, i18n.language, tx.defaultTitle)}</h1><p className="mt-4 leading-7 text-stone-600">{sl ? survey.introduction.sl || tx.defaultIntro : localized(survey.introduction, i18n.language, tx.defaultIntro)}</p><p className="mt-2 text-xs text-stone-500">{tx.approximately} {survey.estimated_minutes} {tx.minutes}</p></>}
    <h2 className="mt-10 font-serif text-2xl text-navy-900">{localizedSection(sections[step], i18n.language)}</h2>
    <div className="mt-8 space-y-10">{questions.map((q) => <Question key={q.id} q={q} value={answers[q.question_key]} onChange={(value) => set(q.question_key, value)} locale={i18n.language} survey={survey} />)}</div>
    {survey.ask_for_email && step === sections.length - 1 && <label className="mt-10 block text-sm font-semibold">{tx.email} {survey.require_email ? '' : `(${tx.optional})`}<input type="email" required={survey.require_email} value={answers.email || ''} onChange={(event) => set('email', event.target.value)} className="input mt-2" autoComplete="email" /></label>}
    {error && <div role="alert" className="mt-7 border-l-2 border-red-600 pl-3 text-sm text-red-700"><p>{error}</p>{errorDetail && <details className="mt-2 text-xs text-stone-500"><summary className="cursor-pointer">{sl ? 'Tehnične podrobnosti' : 'Technical details'}</summary><code className="mt-1 block break-all">{errorDetail}</code></details>}</div>}
    <p className="mt-8 text-xs leading-5 text-stone-500">{tx.privacyStart}{survey.collect_technical_context ? tx.privacyTech : ''}{tx.privacyEnd} <Link className="underline" to="/privacy">{tx.privacy}</Link>.</p>
    <div className="fixed inset-x-0 bottom-0 border-t border-amber-200 bg-[#fffdf7]/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur"><div className="mx-auto flex max-w-xl gap-3">{step > 0 && <button onClick={() => setStep((current) => current - 1)} className="min-h-12 flex-1 border border-stone-300">{tx.back}</button>}<button disabled={busy} onClick={next} className="min-h-12 flex-[2] bg-amber-700 px-5 font-semibold text-white disabled:opacity-50">{busy ? tx.sending : step === sections.length - 1 ? tx.submit : tx.next}</button></div></div>
  </main></Layout>
}

function Question({ q, value, onChange, locale, survey }: { q: SurveyQuestion; value?: string | number; onChange: (value: string | number) => void; locale: string; survey: FeedbackSurvey }) {
  const label = localizedQuestion(q, locale)
  if (q.question_type === 'rating' || q.question_type === 'nps') {
    const values = q.question_type === 'nps' ? [0,1,2,3,4,5,6,7,8,9,10] : [1,2,3,4,5]
    return <fieldset><legend className="text-base font-semibold leading-6">{label}{q.required && <span aria-hidden className="text-amber-700"> *</span>}</legend><div className={`mt-4 grid gap-2 ${q.question_type === 'nps' ? 'grid-cols-6' : 'grid-cols-5'}`}>{values.map((number) => <button type="button" aria-pressed={value === number} onClick={() => onChange(number)} key={number} className={`min-h-12 border text-sm ${value === number ? 'border-amber-700 bg-amber-700 text-white' : 'border-stone-300 bg-white'}`}>{number}</button>)}</div></fieldset>
  }
  if (q.question_type === 'text' || q.question_type === 'textarea') return <label className="block font-semibold leading-6">{label}{q.required && ' *'}{q.question_type === 'textarea' ? <textarea rows={5} value={value || ''} onChange={(event) => onChange(event.target.value)} className="input mt-3 resize-y" /> : <input value={value || ''} onChange={(event) => onChange(event.target.value)} className="input mt-3" />}</label>
  let options = q.options
  if (q.question_key === 'reasonable_price') options = survey.price_choices.map((price) => ({ value: price, label: { en: price, sl: price } }))
  return <fieldset><legend className="font-semibold leading-6">{label}{q.required && ' *'}</legend><div className="mt-3 space-y-2">{options.map((option) => <label key={option.value} className={`flex min-h-12 cursor-pointer items-center gap-3 border px-4 ${value === option.value ? 'border-amber-700 bg-amber-50' : 'border-stone-250 bg-white'}`}><input type="radio" name={q.question_key} value={option.value} checked={value === option.value} onChange={() => onChange(option.value)} /><span>{localizedOption(option, locale)}</span></label>)}</div></fieldset>
}
