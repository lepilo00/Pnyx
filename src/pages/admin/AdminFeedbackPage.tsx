import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { localized, type FeedbackSurvey, type SurveyQuestion } from '@/lib/feedback'

type Answer = { question_key: string; value: unknown }
type Submission = { id: string; survey_id: string; survey_version: number; submitted_at: string; source: string; reviewed: boolean; resolved: boolean; hidden: boolean; category?: string; priority?: string; internal_note?: string; feedback_answers: Answer[] }
const answer = (submission: Submission, key: string) => submission.feedback_answers.find((item) => item.question_key === key)?.value

export default function AdminFeedbackPage() {
  const [surveys, setSurveys] = useState<FeedbackSurvey[]>([])
  const [rows, setRows] = useState<Submission[]>([])
  const [surveyId, setSurveyId] = useState('all')
  const [source, setSource] = useState('all')
  const [error, setError] = useState('')
  const load = async () => {
    const [surveyResult, submissionResult] = await Promise.all([
      supabase.from('feedback_surveys').select('*,feedback_questions(*)').order('version', { ascending: false }),
      supabase.from('feedback_submissions').select('*,feedback_answers(question_key,value)').order('submitted_at', { ascending: false }),
    ])
    if (surveyResult.error || submissionResult.error) setError(surveyResult.error?.message || submissionResult.error?.message || 'Load failed')
    const loadedSurveys = (surveyResult.data ?? []).map((item) => ({ ...item, questions: item.feedback_questions })) as FeedbackSurvey[]
    setSurveys(loadedSurveys)
    setRows((submissionResult.data ?? []) as Submission[])
    if (surveyId === 'all' && loadedSurveys[0]) setSurveyId(loadedSurveys[0].id)
  }
  useEffect(() => {
    // Initial admin data synchronization intentionally starts from this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(() => rows.filter((row) => (surveyId === 'all' || row.survey_id === surveyId) && (source === 'all' || row.source === source)), [rows, source, surveyId])
  const visible = filtered.filter((row) => !row.hidden)
  const selectedSurvey = surveys.find((item) => item.id === surveyId)
  const questions = selectedSurvey?.questions?.filter((question) => question.enabled).sort((a, b) => a.display_order - b.display_order) ?? []

  const update = async (id: string, patch: Partial<Submission>) => { const { error: updateError } = await supabase.from('feedback_submissions').update(patch).eq('id', id); if (updateError) setError(updateError.message); else void load() }
  const exportCsv = () => {
    const configuredKeys = surveys
      .filter((survey) => surveyId === 'all' || survey.id === surveyId)
      .sort((a, b) => a.version - b.version)
      .flatMap((survey) => [...(survey.questions ?? [])].sort((a, b) => a.display_order - b.display_order).map((question) => question.question_key))
    const answerKeys = filtered.flatMap((row) => row.feedback_answers.map((item) => item.question_key)).sort()
    const keys = [...new Set([...configuredKeys, ...answerKeys])]
    const escape = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`
    const csv = [['submitted_at', 'source', 'survey_version', ...keys].map(escape).join(','), ...filtered.map((row) => [row.submitted_at, row.source, row.survey_version, ...keys.map((key) => answer(row, key) ?? '')].map(escape).join(','))].join('\n')
    const anchor = document.createElement('a'); anchor.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); anchor.download = 'pnyx-feedback.csv'; anchor.click(); URL.revokeObjectURL(anchor.href)
  }

  return <div className="min-h-screen bg-stone-100"><nav className="flex items-center gap-4 bg-stone-900 px-6 py-4 text-white"><Link to="/admin" className="text-stone-400">← Dashboard</Link><strong>Feedback</strong><Link to="/admin/feedback/settings" className="ml-auto text-sm text-amber-400">Survey settings & invitations</Link></nav><main className="mx-auto max-w-6xl space-y-6 p-6">{error && <p role="alert" className="bg-red-50 p-3 text-red-700">{error}</p>}<div className="flex flex-wrap gap-3"><select value={surveyId} onChange={(event) => setSurveyId(event.target.value)} className="rounded border p-2"><option value="all">All survey versions</option>{surveys.map((survey) => <option key={survey.id} value={survey.id}>Version {survey.version} · {survey.status}</option>)}</select><select value={source} onChange={(event) => setSource(event.target.value)} className="rounded border p-2"><option value="all">All user types</option><option value="invited_tester">Invited testers</option><option value="authenticated">Authenticated</option><option value="anonymous">Anonymous</option></select><button onClick={exportCsv} className="bg-stone-800 px-4 py-2 text-white">Export filtered CSV</button></div><Stat label="Submissions" value={visible.length} />
    {questions.length > 0 && <section className="grid gap-4 md:grid-cols-2">{questions.map((question) => <QuestionSummary key={question.id} question={question} rows={visible} />)}</section>}
    <section className="space-y-3">{filtered.map((row) => <details key={row.id} className={`border bg-white p-4 ${row.hidden ? 'opacity-50' : ''}`}><summary className="cursor-pointer"><strong>Survey V{row.survey_version}</strong> · {row.source.replace('_', ' ')} · {new Date(row.submitted_at).toLocaleString()} {row.reviewed ? '· Reviewed' : ''}</summary><dl className="mt-5 grid gap-3 sm:grid-cols-2">{row.feedback_answers.map((item) => { const question = questionFor(surveys, row.survey_id, item.question_key); return <div key={item.question_key}><dt className="text-xs font-bold uppercase text-stone-500">{question ? localized(question.label, 'en') : item.question_key.replaceAll('_', ' ')}</dt><dd className="whitespace-pre-wrap">{formatAnswer(question, item.value)}</dd></div> })}</dl><div className="mt-5 flex flex-wrap gap-2"><button onClick={() => update(row.id, { reviewed: !row.reviewed })} className="border px-3 py-2">{row.reviewed ? 'Mark unreviewed' : 'Mark reviewed'}</button><button onClick={() => update(row.id, { resolved: !row.resolved })} className="border px-3 py-2">{row.resolved ? 'Reopen' : 'Resolve'}</button><button onClick={() => update(row.id, { hidden: !row.hidden })} className="border px-3 py-2">{row.hidden ? 'Show in summaries' : 'Hide from summaries'}</button><select value={row.category || ''} onChange={(event) => update(row.id, { category: event.target.value || undefined })} className="border px-2"><option value="">Category</option>{['UX','Audio','Content','Bug','Performance','Translation','Accessibility','Other'].map((item) => <option key={item}>{item}</option>)}</select><select value={row.priority || ''} onChange={(event) => update(row.id, { priority: event.target.value || undefined })} className="border px-2"><option value="">Priority</option>{['Low','Medium','High','Critical'].map((item) => <option key={item}>{item}</option>)}</select></div><textarea defaultValue={row.internal_note || ''} onBlur={(event) => void update(row.id, { internal_note: event.target.value })} placeholder="Internal note" className="mt-3 w-full border p-3" /></details>)}</section></main></div>
}

function QuestionSummary({ question, rows }: { question: SurveyQuestion; rows: Submission[] }) {
  const values = rows.map((row) => answer(row, question.question_key)).filter((value) => value !== undefined)
  if (question.question_type === 'rating' || question.question_type === 'nps') {
    const numbers = values.map(Number).filter(Number.isFinite)
    const average = numbers.length ? (numbers.reduce((sum, value) => sum + value, 0) / numbers.length).toFixed(1) : '—'
    return <div className="border bg-white p-4"><p className="text-sm font-semibold">{localized(question.label, 'en')}</p><p className="mt-2 text-3xl font-bold">{average}<small className="ml-1 text-sm font-normal text-stone-400">({numbers.length})</small></p></div>
  }
  if (question.question_type === 'single_choice') return <div className="border bg-white p-4"><p className="text-sm font-semibold">{localized(question.label, 'en')}</p><div className="mt-3 space-y-2">{question.options.map((item) => { const count = values.filter((value) => value === item.value).length; const percent = values.length ? Math.round(count / values.length * 100) : 0; return <div key={item.value}><div className="flex justify-between text-xs"><span>{localized(item.label, 'en')}</span><span>{count} · {percent}%</span></div><div className="mt-1 h-1.5 bg-stone-100"><div className="h-full bg-amber-600" style={{ width: `${percent}%` }} /></div></div> })}</div></div>
  return <div className="border bg-white p-4"><p className="text-sm font-semibold">{localized(question.label, 'en')}</p><p className="mt-2 text-2xl font-bold">{values.length}<small className="ml-1 text-sm font-normal text-stone-400">responses</small></p></div>
}
function questionFor(surveys: FeedbackSurvey[], surveyId: string, key: string) { return surveys.find((survey) => survey.id === surveyId)?.questions?.find((question) => question.question_key === key) }
function formatAnswer(question: SurveyQuestion | undefined, value: unknown) { const item = question?.options.find((option) => option.value === String(value)); return item ? localized(item.label, 'en') : String(value) }
function Stat({ label, value }: { label: string; value: string | number }) { return <div className="max-w-xs border bg-white p-4"><p className="text-xs uppercase text-stone-500">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p></div> }
