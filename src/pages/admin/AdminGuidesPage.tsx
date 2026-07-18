import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import type { Walk } from '@/lib/types'

type GuideForm = Pick<Walk, 'title' | 'slug' | 'subtitle' | 'description' | 'location_name' | 'duration_minutes' | 'cover_image_url' | 'default_language' | 'stripe_product_id' | 'price' | 'completion_message' | 'bonus_section_title' | 'bonus_section_description' | 'is_published' | 'localized_content'> & { available_languages: string }
const empty: GuideForm = { title: '', slug: '', subtitle: '', description: '', location_name: '', duration_minutes: 20, cover_image_url: '', default_language: 'en', available_languages: 'en', stripe_product_id: '', price: 0, completion_message: '', bonus_section_title: 'Bonus Stories', bonus_section_description: '', localized_content: {}, is_published: false }

export default function AdminGuidesPage() {
  const [guides, setGuides] = useState<Walk[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<GuideForm>(empty)
  const [error, setError] = useState<string | null>(null)
  const load = async () => { const { data, error } = await supabase.from('walks').select('*').order('title'); if (error) setError(error.message); else setGuides(data as Walk[]) }
  useEffect(() => {
    // Initial admin data synchronization intentionally starts from this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [])
  const edit = (guide?: Walk) => { setEditingId(guide?.id ?? 'new'); setForm(guide ? { ...empty, ...guide, available_languages: (guide.available_languages ?? ['en']).join(', ') } : empty) }
  const save = async () => {
    if (!form.title.trim() || !form.slug.trim() || !(form.completion_message ?? '').trim()) { setError('Title, slug and completion message are required.'); return }
    if (form.is_published && editingId === 'new') { setError('Create the guide as a draft, add at least one Main Story, then publish it.'); return }
    if (form.is_published && editingId) {
      const { count } = await supabase.from('stops').select('*', { count: 'exact', head: true }).eq('walk_id', editingId).eq('story_type', 'main')
      if (!count) { setError('A guide cannot be published without at least one Main Story.'); return }
    }
    const payload = { ...form, available_languages: form.available_languages.split(',').map((item) => item.trim()).filter(Boolean), subtitle: form.subtitle || null, cover_image_url: form.cover_image_url || null, stripe_product_id: form.stripe_product_id || null, price: form.price || null }
    const result = editingId === 'new' ? await supabase.from('walks').insert(payload) : await supabase.from('walks').update(payload).eq('id', editingId)
    if (result.error) setError(result.error.message); else { setEditingId(null); setError(null); void load() }
  }
  const field = (key: keyof GuideForm, label: string, required = false) => <label className="block text-xs font-semibold text-stone-600">{label}<input required={required} value={String(form[key] ?? '')} onChange={(event) => setForm({ ...form, [key]: key === 'duration_minutes' || key === 'price' ? Number(event.target.value) : event.target.value })} className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" /></label>
  const languages = form.available_languages.split(',').map((item) => item.trim()).filter((code) => code && code !== form.default_language)
  const localizedField = (code: string, key: 'title' | 'completion_message' | 'bonus_section_title' | 'bonus_section_description', label: string) => <label className="block text-xs font-semibold text-stone-600">{label}<input value={form.localized_content?.[code]?.[key] ?? ''} onChange={(event) => setForm({ ...form, localized_content: { ...form.localized_content, [code]: { ...form.localized_content?.[code], [key]: event.target.value } } })} className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" /></label>
  return <div className="min-h-screen bg-stone-100"><nav className="bg-stone-900 px-6 py-4 text-white"><Link to="/admin" className="text-sm text-stone-400">← Dashboard</Link><span className="ml-3 font-bold">Manage Guides</span></nav><main className="mx-auto max-w-4xl space-y-4 p-6">{error && <p className="bg-red-50 p-3 text-sm text-red-700">{error}</p>}<button onClick={() => edit()} className="bg-amber-600 px-4 py-2 text-sm font-bold text-white">Create guide</button>{editingId && <section className="grid gap-3 rounded-xl bg-white p-5 sm:grid-cols-2">{field('title', 'Walk title', true)}{field('slug', 'Slug', true)}{field('subtitle', 'Subtitle')}{field('location_name', 'Location')}{field('description', 'Description')}{field('cover_image_url', 'Cover image URL')}{field('duration_minutes', 'Estimated minutes')}{field('available_languages', 'Languages (comma separated)')}{field('default_language', 'Default language')}{field('stripe_product_id', 'Stripe product')}{field('price', 'Price')}{field('completion_message', 'Completion message', true)}{field('bonus_section_title', 'Bonus section title')}{field('bonus_section_description', 'Bonus section description')}{languages.map((code) => <fieldset key={code} className="col-span-full grid gap-3 border-t border-stone-200 pt-3 sm:grid-cols-2"><legend className="font-bold uppercase text-amber-700">{code} translation</legend>{localizedField(code, 'title', 'Walk title')}{localizedField(code, 'completion_message', 'Completion message')}{localizedField(code, 'bonus_section_title', 'Bonus section title')}{localizedField(code, 'bonus_section_description', 'Bonus section description')}</fieldset>)}<label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_published} onChange={(event) => setForm({ ...form, is_published: event.target.checked })} /> Published</label><div className="flex gap-2"><button onClick={save} className="bg-amber-600 px-4 py-2 font-bold text-white">Save</button><button onClick={() => setEditingId(null)} className="bg-stone-200 px-4 py-2">Cancel</button></div></section>}<div className="space-y-2">{guides.map((guide) => <div key={guide.id} className="flex items-center justify-between rounded-xl border border-stone-200 bg-white p-4"><button onClick={() => edit(guide)} className="text-left"><strong>{guide.title}</strong><small className="ml-2 text-stone-400">/{guide.slug}</small></button><div className="flex items-center gap-3"><span className="text-xs">{guide.is_published ? 'Published' : 'Draft'}</span><Link to={`/admin/stops?walk=${guide.id}`} className="text-sm font-bold text-amber-700">Stories →</Link></div></div>)}</div></main></div>
}
