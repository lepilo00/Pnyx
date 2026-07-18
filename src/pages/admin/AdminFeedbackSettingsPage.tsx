import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { DEFAULT_QUESTIONS, type FeedbackSurvey } from '@/lib/feedback'
import type { Walk } from '@/lib/types'

type SurveyForm = FeedbackSurvey & { name: string }

const newSurvey = (guideId = '', version = 1): SurveyForm => ({
  id: '',
  guide_id: guideId,
  name: 'Product feedback',
  version,
  status: 'draft',
  access_mode: 'disabled',
  display_timing: 'after_main_walk_completion',
  title: { en: 'Help us improve this guide', sl: 'Pomagajte nam izboljšati ta vodič' },
  introduction: { en: 'Your feedback will directly shape future versions.', sl: 'Vaše povratne informacije bodo neposredno vplivale na prihodnje različice.' },
  estimated_minutes: 3,
  completion_message: { en: 'Your feedback will shape the future of this guide.', sl: 'Vaše povratne informacije bodo pomagale izboljšati ta vodič.' },
  allow_anonymous: false,
  allow_multiple_submissions: false,
  ask_for_email: false,
  require_email: false,
  collect_technical_context: true,
  price_choices: ['€2.99', '€4.99', '€6.99', '€9.99', 'I would not pay'],
})

export default function AdminFeedbackSettingsPage() {
  const [guides, setGuides] = useState<Walk[]>([])
  const [surveys, setSurveys] = useState<FeedbackSurvey[]>([])
  const [form, setForm] = useState<SurveyForm>(newSurvey())
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const [guideResult, surveyResult] = await Promise.all([
      supabase.from('walks').select('*').order('title'),
      supabase.from('feedback_surveys').select('*').order('version', { ascending: false }),
    ])
    setGuides((guideResult.data as Walk[]) || [])
    setSurveys((surveyResult.data as FeedbackSurvey[]) || [])
  }

  useEffect(() => {
    // Initial admin data synchronization intentionally starts from this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [])

  const chooseGuide = (guideId: string) => {
    const existing = surveys.find((survey) => survey.guide_id === guideId)
    setForm(existing ? ({ ...existing, name: 'Product feedback' } as SurveyForm) : newSurvey(guideId))
    setError('')
    setNotice('')
    setToken('')
  }

  const createVersion = () => {
    const versions = surveys.filter((survey) => survey.guide_id === form.guide_id).map((survey) => survey.version)
    setForm(newSurvey(form.guide_id, Math.max(0, ...versions) + 1))
    setNotice('Creating a new draft survey version. Existing versions remain unchanged.')
  }

  const save = async () => {
    if (!form.guide_id || saving) return
    if (form.require_email && !form.ask_for_email) {
      setError('Enable “ask for email” before making email required.')
      return
    }
    setSaving(true)
    setError('')
    setNotice('')
    const { id, questions: _questions, ...payload } = form
    void _questions
    const result = id
      ? await supabase.from('feedback_surveys').update(payload).eq('id', id).select().single()
      : await supabase.from('feedback_surveys').insert(payload).select().single()

    if (result.error) {
      setError(result.error.message)
      setSaving(false)
      return
    }
    if (!id) {
      const questionResult = await supabase
        .from('feedback_questions')
        .insert(DEFAULT_QUESTIONS.map((question) => ({ ...question, survey_id: result.data.id })))
      if (questionResult.error) {
        setError(`Survey was created, but its questions could not be added: ${questionResult.error.message}`)
        setSaving(false)
        await load()
        return
      }
    }
    setForm({ ...(result.data as FeedbackSurvey), name: payload.name } as SurveyForm)
    setNotice('Settings saved. The user link below is available when status is published and access is enabled.')
    setSaving(false)
    await load()
  }

  const invite = async () => {
    if (!form.id) return
    const raw = crypto.randomUUID() + crypto.randomUUID()
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw))
    const hash = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
    const result = await supabase.from('feedback_invitations').insert({ survey_id: form.id, token_hash: hash, token_hint: raw.slice(-8) })
    if (result.error) setError(result.error.message)
    else setToken(`${location.origin}/beta/${raw}`)
  }

  const deleteSurvey = async () => {
    if (!form.id || saving) return
    const { count, error: countError } = await supabase
      .from('feedback_submissions')
      .select('id', { count: 'exact', head: true })
      .eq('survey_id', form.id)
    if (countError) {
      setError(countError.message)
      return
    }
    if ((count ?? 0) > 0) {
      setError(`Version ${form.version} contains ${count} submission${count === 1 ? '' : 's'} and cannot be deleted. Set its status to closed instead.`)
      return
    }
    if (!window.confirm(`Delete survey version ${form.version}? Its questions and invitation links will also be permanently deleted.`)) return
    setSaving(true)
    setError('')
    const guideId = form.guide_id
    const result = await supabase.from('feedback_surveys').delete().eq('id', form.id)
    if (result.error) {
      setError(result.error.message)
      setSaving(false)
      return
    }
    const remaining = surveys.filter((survey) => survey.id !== form.id)
    const next = remaining.find((survey) => survey.guide_id === guideId)
    setSurveys(remaining)
    setForm(next ? ({ ...next, name: 'Product feedback' } as SurveyForm) : newSurvey(guideId))
    setToken('')
    setNotice(`Survey version ${form.version} was deleted.`)
    setSaving(false)
    await load()
  }

  const publicReady = form.status === 'published' && form.access_mode === 'all_users' && form.allow_anonymous
  return (
    <div className="min-h-screen bg-stone-100">
      <nav className="bg-stone-900 p-4 text-white"><Link to="/admin/feedback">← Feedback</Link></nav>
      <main className="mx-auto max-w-4xl space-y-5 p-6">
        <h1 className="text-2xl font-bold">Survey settings</h1>
        {error && <p role="alert" className="bg-red-50 p-3 text-red-700">{error}</p>}
        {notice && <p role="status" className="border border-amber-200 bg-amber-50 p-3 text-stone-700">{notice}</p>}
        <select value={form.guide_id} onChange={(event) => chooseGuide(event.target.value)} className="w-full border p-3">
          <option value="">Choose a guide</option>
          {guides.map((guide) => <option key={guide.id} value={guide.id}>{guide.title}</option>)}
        </select>
        <div className="space-y-2">
          {surveys.filter((survey) => survey.guide_id === form.guide_id).map((survey) => (
            <button key={survey.id} onClick={() => setForm({ ...survey, name: 'Product feedback' } as SurveyForm)} className={`block w-full border p-3 text-left ${form.id === survey.id ? 'border-amber-700 bg-amber-50' : 'bg-white'}`}>
              Version {survey.version} · {survey.status} · {survey.access_mode}
            </button>
          ))}
        </div>
        {form.guide_id && <section className="grid gap-4 border bg-white p-5 sm:grid-cols-2">
          <Field label="Title" value={form.title.en || ''} onChange={(value) => setForm({ ...form, title: { ...form.title, en: value } })} />
          <Field label="Introduction" value={form.introduction.en || ''} onChange={(value) => setForm({ ...form, introduction: { ...form.introduction, en: value } })} />
          <Field label="Thank-you message" value={form.completion_message.en || ''} onChange={(value) => setForm({ ...form, completion_message: { ...form.completion_message, en: value } })} />
          <Field label="Estimated minutes" type="number" value={form.estimated_minutes} onChange={(value) => setForm({ ...form, estimated_minutes: Number(value) })} />
          <fieldset className="grid gap-4 border-t border-stone-200 pt-4 sm:col-span-2 sm:grid-cols-2">
            <legend className="px-2 font-bold text-amber-800">Slovenian translation</legend>
            <Field label="Naslov" value={form.title.sl || ''} onChange={(value) => setForm({ ...form, title: { ...form.title, sl: value } })} />
            <Field label="Uvod" value={form.introduction.sl || ''} onChange={(value) => setForm({ ...form, introduction: { ...form.introduction, sl: value } })} />
            <Field label="Zahvalno sporočilo" value={form.completion_message.sl || ''} onChange={(value) => setForm({ ...form, completion_message: { ...form.completion_message, sl: value } })} />
          </fieldset>
          <Select label="Access mode" value={form.access_mode} values={['disabled', 'invited_testers', 'authenticated_users', 'all_users']} onChange={(value) => setForm({ ...form, access_mode: value as FeedbackSurvey['access_mode'] })} />
          <Select label="Display timing" value={form.display_timing} values={['after_main_walk_completion', 'after_all_content_completion', 'always_available', 'manually_triggered']} onChange={(value) => setForm({ ...form, display_timing: value as FeedbackSurvey['display_timing'] })} />
          <Select label="Status" value={form.status} values={['draft', 'published', 'closed']} onChange={(value) => setForm({ ...form, status: value as FeedbackSurvey['status'] })} />
          {(['allow_anonymous', 'allow_multiple_submissions', 'ask_for_email', 'require_email', 'collect_technical_context'] as const).map((key) => <label key={key} className="flex gap-2"><input type="checkbox" checked={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.checked })} />{key.replaceAll('_', ' ')}</label>)}
          <label className="sm:col-span-2">Price choices (comma separated)<input value={form.price_choices.join(', ')} onChange={(event) => setForm({ ...form, price_choices: event.target.value.split(',').map((item) => item.trim()) })} className="mt-1 w-full border p-2" /></label>
          <button disabled={saving} onClick={save} className="bg-amber-700 p-3 font-bold text-white disabled:opacity-50">{saving ? 'Saving…' : form.id ? 'Save settings' : `Create survey version ${form.version}`}</button>
          {form.id && <button onClick={createVersion} className="border border-stone-300 p-3">Create new version</button>}
          {form.id && <button disabled={saving} onClick={deleteSurvey} className="border border-red-300 p-3 text-red-700 disabled:opacity-50">Delete version {form.version}</button>}
          {form.id && form.access_mode === 'invited_testers' && <button onClick={invite} className="border border-amber-700 p-3 text-amber-800">Create invitation link</button>}
          {form.id && <div className="sm:col-span-2 border-t pt-4">
            <p className="text-sm font-semibold">User access</p>
            {publicReady ? <a href={`/feedback/${form.guide_id}`} target="_blank" rel="noreferrer" className="mt-2 inline-block text-amber-800 underline">Open feedback form as a public user ↗</a> : <p className="mt-1 text-sm text-stone-500">For public anonymous feedback set Access mode to all_users, enable allow anonymous, set Status to published, and save.</p>}
          </div>}
          {token && <output className="sm:col-span-2 break-all bg-amber-50 p-3">{token}</output>}
        </section>}
      </main>
    </div>
  )
}

function Field({ label, type = 'text', value, onChange }: { label: string; type?: string; value: string | number; onChange: (value: string) => void }) {
  return <label>{label}<input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full border p-2" /></label>
}
function Select({ label, value, values, onChange }: { label: string; value: string; values: string[]; onChange: (value: string) => void }) {
  return <label>{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full border p-2">{values.map((item) => <option key={item}>{item}</option>)}</select></label>
}
