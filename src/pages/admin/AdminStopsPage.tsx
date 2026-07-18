import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { SUPPORTED_LOCALES } from '@/i18n'
import type { Stop } from '@/lib/types'

// English audio lives in audio_url; every other locale gets its own entry in audio_urls
const AUDIO_LOCALES = SUPPORTED_LOCALES.filter((code) => code !== 'en')
const WALK_SLUG = 'democracy-walk-pnyx'

interface StopFormData {
  title: string
  subtitle: string
  description: string
  transcript: string
  duration_seconds: string
  story_type: 'introduction' | 'main' | 'bonus'
  audio_url: string
  audio_urls: Record<string, string>
  image_url: string
  is_published: boolean
  is_paid: boolean
}

const EMPTY_FORM: StopFormData = {
  title: '',
  subtitle: '',
  description: '',
  transcript: '',
  duration_seconds: '',
  story_type: 'main',
  audio_url: '',
  audio_urls: {},
  image_url: '',
  is_published: false,
  is_paid: false,
}

// Drop empty inputs so the stored jsonb only contains languages that have a recording
function cleanAudioUrls(urls: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(urls)
      .map(([code, url]) => [code, url.trim()])
      .filter(([, url]) => url !== '')
  )
}

function AudioUrlsFields({
  value,
  onChange,
}: {
  value: Record<string, string>
  onChange: (value: Record<string, string>) => void
}) {
  return (
    <div className="space-y-2 border border-stone-200 rounded-xl p-3">
      <p className="text-xs font-semibold text-stone-500">
        Audio per language — optional; visitors fall back to the default (English) audio
      </p>
      {AUDIO_LOCALES.map((code) => (
        <div key={code} className="flex items-center gap-2">
          <span className="w-7 text-xs font-bold text-stone-400 uppercase flex-shrink-0">{code}</span>
          <input
            value={value[code] ?? ''}
            onChange={(e) => onChange({ ...value, [code]: e.target.value })}
            placeholder={`Audio URL (${code})`}
            className="flex-1 border border-stone-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
      ))}
    </div>
  )
}

export default function AdminStopsPage() {
  const [stops, setStops] = useState<Stop[]>([])
  const [walkId, setWalkId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<StopFormData>(EMPTY_FORM)
  const [newForm, setNewForm] = useState<StopFormData>(EMPTY_FORM)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [unlockPrice, setUnlockPrice] = useState('')
  const [isSavingPrice, setIsSavingPrice] = useState(false)
  const [priceSaved, setPriceSaved] = useState(false)

  const loadStops = async () => {
    const { data: walk, error: walkError } = await supabase
      .from('walks')
      .select('id')
      .eq('slug', WALK_SLUG)
      .maybeSingle()
    if (walkError || !walk) {
      setError(walkError?.message ?? `Walk "${WALK_SLUG}" was not found.`)
      setIsLoading(false)
      return
    }
    setWalkId(walk.id)
    const { data, error: loadError } = await supabase
      .from('stops')
      .select('*')
      .eq('walk_id', walk.id)
      .order('order_index', { ascending: true })
    if (loadError) setError(loadError.message)
    setStops((data as Stop[]) ?? [])
    setIsLoading(false)
  }

  const loadUnlockPrice = async () => {
    const { data } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'unlock_price_eur')
      .maybeSingle()
    const value = Number(data?.value)
    if (Number.isFinite(value) && value > 0) setUnlockPrice(String(value))
  }

  useEffect(() => {
    // Initial data synchronization intentionally starts from this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadStops()
    void loadUnlockPrice()
  }, [])

  const saveUnlockPrice = async () => {
    const value = Number.parseFloat(unlockPrice.replace(',', '.'))
    if (!Number.isFinite(value) || value <= 0) {
      setError('Unlock price must be a positive number.')
      return
    }
    setIsSavingPrice(true)
    setPriceSaved(false)
    setError(null)
    const { error: err } = await supabase
      .from('app_settings')
      .upsert({ key: 'unlock_price_eur', value, updated_at: new Date().toISOString() })
    if (err) setError(err.message)
    else setPriceSaved(true)
    setIsSavingPrice(false)
  }

  const togglePublished = async (stop: Stop) => {
    setError(null)
    const { error: err } = await supabase.from('stops').update({ is_published: !stop.is_published }).eq('id', stop.id)
    if (err) {
      setError(err.message)
      return
    }
    void loadStops()
  }

  const startEdit = (stop: Stop) => {
    setEditingId(stop.id)
    setEditForm({
      title: stop.title,
      subtitle: stop.subtitle ?? '',
      description: stop.description,
      transcript: stop.transcript ?? '',
      duration_seconds: stop.duration_seconds ? String(stop.duration_seconds) : '',
      story_type: stop.story_type ?? (stop.is_bonus ? 'bonus' : stop.order_index === 1 ? 'introduction' : 'main'),
      audio_url: stop.audio_url ?? '',
      audio_urls: { ...(stop.audio_urls ?? {}) },
      image_url: stop.image_url ?? '',
      is_published: stop.is_published,
      is_paid: !!stop.is_paid,
    })
  }

  const saveEdit = async () => {
    if (!editingId) return
    setIsSaving(true)
    setError(null)
    const { error: err } = await supabase.from('stops').update({
      title: editForm.title,
      subtitle: editForm.subtitle || null,
      description: editForm.description,
      transcript: editForm.transcript || null,
      duration_seconds: editForm.duration_seconds ? Number(editForm.duration_seconds) : null,
      story_type: editForm.story_type,
      audio_url: editForm.audio_url || null,
      audio_urls: cleanAudioUrls(editForm.audio_urls),
      image_url: editForm.image_url || null,
      is_published: editForm.is_published,
      is_paid: editForm.is_paid,
      is_bonus: editForm.story_type === 'bonus',
    }).eq('id', editingId)
    if (err) {
      setError(err.message)
      setIsSaving(false)
      return
    }
    setIsSaving(false)
    setEditingId(null)
    void loadStops()
  }

  const deleteStop = async (id: string) => {
    setError(null)
    const { error: err } = await supabase.from('stops').delete().eq('id', id)
    if (err) {
      setError(err.message)
      return
    }
    setDeleteConfirmId(null)
    void loadStops()
  }

  const moveStop = async (index: number, direction: 'up' | 'down') => {
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= stops.length) return

    const a = stops[index]
    const b = stops[swapIndex]
    setError(null)
    const { error: err } = await supabase.rpc('swap_stop_order', {
      first_stop_id: a.id,
      second_stop_id: b.id,
    })
    if (err) {
      setError(err.message)
      return
    }
    void loadStops()
  }

  const addStop = async () => {
    setIsSaving(true)
    setError(null)
    const maxOrder = stops.reduce((m, s) => Math.max(m, s.order_index), 0)

    // Need a walk_id — fetch the first walk or use a placeholder
    if (!walkId) {
      setError(`Walk "${WALK_SLUG}" is not available.`)
      setIsSaving(false)
      return
    }

    const { error: err } = await supabase.from('stops').insert({
      walk_id: walkId,
      order_index: maxOrder + 1,
      title: newForm.title,
      subtitle: newForm.subtitle || null,
      description: newForm.description,
      transcript: newForm.transcript || null,
      duration_seconds: newForm.duration_seconds ? Number(newForm.duration_seconds) : null,
      story_type: newForm.story_type,
      audio_url: newForm.audio_url || null,
      audio_urls: cleanAudioUrls(newForm.audio_urls),
      image_url: newForm.image_url || null,
      is_published: newForm.is_published,
      is_paid: newForm.is_paid,
      is_bonus: newForm.story_type === 'bonus',
    })
    if (err) { setError(err.message); setIsSaving(false); return }
    setNewForm(EMPTY_FORM)
    setIsAddingNew(false)
    setIsSaving(false)
    void loadStops()
  }

  return (
    <div className="min-h-screen bg-stone-100">
      <nav className="bg-stone-900 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/admin" className="text-stone-400 hover:text-white text-sm transition-colors">← Dashboard</Link>
          <span className="font-bold text-lg">Manage Stops</span>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-6 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Monetization settings */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 space-y-3">
          <div>
            <h3 className="font-semibold text-stone-800">Monetization settings</h3>
            <p className="text-xs text-stone-400 mt-0.5">
              Mark chapters below as “Paid chapter” to lock them behind the one-time unlock.
              If no chapter is marked Paid, the whole experience is free.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label htmlFor="unlock-price" className="text-sm text-stone-600 flex-shrink-0">
              Unlock price (€)
            </label>
            <input
              id="unlock-price"
              type="number"
              inputMode="decimal"
              min={0.5}
              step="0.1"
              value={unlockPrice}
              onChange={(e) => {
                setUnlockPrice(e.target.value)
                setPriceSaved(false)
              }}
              placeholder="5.90"
              className="w-28 border border-stone-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <button
              onClick={saveUnlockPrice}
              disabled={isSavingPrice}
              className="bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-50"
            >
              {isSavingPrice ? 'Saving…' : 'Save price'}
            </button>
            {priceSaved && <span className="text-xs text-green-600 font-semibold">Saved ✓</span>}
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-stone-400">Loading stops…</div>
        ) : (
          <>
            {stops.map((stop, index) => (
              <div key={stop.id} className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                {editingId === stop.id ? (
                  /* Edit form */
                  <div className="p-5 space-y-3">
                    <input
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      placeholder="Title"
                      className="w-full border border-stone-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                    <input
                      value={editForm.subtitle}
                      onChange={(e) => setEditForm({ ...editForm, subtitle: e.target.value })}
                      placeholder="Subtitle (optional)"
                      className="w-full border border-stone-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      placeholder="Description"
                      rows={3}
                      className="w-full border border-stone-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                    />
                    <textarea
                      value={editForm.transcript}
                      onChange={(e) => setEditForm({ ...editForm, transcript: e.target.value })}
                      placeholder="Transcript (optional)"
                      rows={8}
                      className="w-full border border-stone-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <select value={editForm.story_type} onChange={(e) => setEditForm({ ...editForm, story_type: e.target.value as StopFormData['story_type'] })} className="border border-stone-300 rounded-xl px-3 py-2 text-sm">
                        <option value="introduction">Introduction</option><option value="main">Main story</option><option value="bonus">Bonus story</option>
                      </select>
                      <input type="number" min="0" value={editForm.duration_seconds} onChange={(e) => setEditForm({ ...editForm, duration_seconds: e.target.value })} placeholder="Duration (seconds)" className="border border-stone-300 rounded-xl px-3 py-2 text-sm" />
                    </div>
                    <input
                      value={editForm.audio_url}
                      onChange={(e) => setEditForm({ ...editForm, audio_url: e.target.value })}
                      placeholder="Audio URL — default / English (optional)"
                      className="w-full border border-stone-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                    <AudioUrlsFields
                      value={editForm.audio_urls}
                      onChange={(audio_urls) => setEditForm({ ...editForm, audio_urls })}
                    />
                    <input
                      value={editForm.image_url}
                      onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
                      placeholder="Image URL (optional)"
                      className="w-full border border-stone-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                    <div className="flex flex-wrap gap-x-5 gap-y-2">
                      <label className="flex items-center gap-2 text-sm text-stone-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editForm.is_published}
                          onChange={(e) => setEditForm({ ...editForm, is_published: e.target.checked })}
                          className="accent-amber-600"
                        />
                        Published
                      </label>
                      <label className="flex items-center gap-2 text-sm text-stone-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editForm.is_paid}
                          onChange={(e) => setEditForm({ ...editForm, is_paid: e.target.checked })}
                          className="accent-amber-600"
                        />
                        Paid chapter
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={saveEdit}
                        disabled={isSaving}
                        className="bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-50"
                      >
                        {isSaving ? 'Saving…' : 'Save'}
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-semibold px-4 py-2 rounded-lg"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Display row */
                  <div className="p-4 flex items-center gap-3">
                    {/* Reorder */}
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => moveStop(index, 'up')}
                        disabled={index === 0}
                        className="text-stone-400 hover:text-stone-700 disabled:opacity-20 text-xs leading-none px-1"
                        aria-label="Move up"
                      >▲</button>
                      <button
                        onClick={() => moveStop(index, 'down')}
                        disabled={index === stops.length - 1}
                        className="text-stone-400 hover:text-stone-700 disabled:opacity-20 text-xs leading-none px-1"
                        aria-label="Move down"
                      >▼</button>
                    </div>

                    {/* Order badge */}
                    <span className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-sm font-bold text-stone-600 flex-shrink-0">
                      {stop.order_index}
                    </span>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-stone-800 text-sm truncate">{stop.title}</p>
                      <p className="text-xs text-stone-400 mt-0.5 truncate">{stop.description.slice(0, 60)}…</p>
                      <p className="text-[11px] text-stone-400 mt-0.5 uppercase">
                        Audio: {[stop.audio_url ? 'en' : null, ...Object.keys(stop.audio_urls ?? {})]
                          .filter(Boolean)
                          .join(' · ') || 'none'}
                      </p>
                    </div>

                    {/* Status badges */}
                    <div className="flex gap-1 flex-shrink-0">
                      {stop.is_paid && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                          PAID
                        </span>
                      )}
                      {stop.is_bonus && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                          BONUS
                        </span>
                      )}
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        stop.is_published ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-500'
                      }`}>
                        {stop.is_published ? 'Published' : 'Draft'}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => togglePublished(stop)}
                        className="text-xs text-stone-500 hover:text-stone-800 px-2 py-1 rounded-lg hover:bg-stone-100"
                      >
                        {stop.is_published ? 'Unpublish' : 'Publish'}
                      </button>
                      <button
                        onClick={() => startEdit(stop)}
                        className="text-xs text-amber-600 hover:text-amber-800 px-2 py-1 rounded-lg hover:bg-amber-50"
                      >
                        Edit
                      </button>
                      {deleteConfirmId === stop.id ? (
                        <>
                          <button
                            onClick={() => deleteStop(stop.id)}
                            className="text-xs text-red-600 hover:text-red-800 px-2 py-1 rounded-lg hover:bg-red-50 font-semibold"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="text-xs text-stone-500 px-2 py-1 rounded-lg hover:bg-stone-100"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(stop.id)}
                          className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Add new stop */}
            {isAddingNew ? (
              <div className="bg-white rounded-2xl border border-amber-300 shadow-sm p-5 space-y-3">
                <h3 className="font-semibold text-stone-800">New stop</h3>
                <input
                  value={newForm.title}
                  onChange={(e) => setNewForm({ ...newForm, title: e.target.value })}
                  placeholder="Title"
                  className="w-full border border-stone-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <input
                  value={newForm.subtitle}
                  onChange={(e) => setNewForm({ ...newForm, subtitle: e.target.value })}
                  placeholder="Subtitle (optional)"
                  className="w-full border border-stone-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <textarea
                  value={newForm.description}
                  onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
                  placeholder="Description"
                  rows={3}
                  className="w-full border border-stone-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                />
                <textarea
                  value={newForm.transcript}
                  onChange={(e) => setNewForm({ ...newForm, transcript: e.target.value })}
                  placeholder="Transcript (optional)"
                  rows={8}
                  className="w-full border border-stone-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <div className="grid grid-cols-2 gap-3">
                  <select value={newForm.story_type} onChange={(e) => setNewForm({ ...newForm, story_type: e.target.value as StopFormData['story_type'] })} className="border border-stone-300 rounded-xl px-3 py-2 text-sm">
                    <option value="introduction">Introduction</option><option value="main">Main story</option><option value="bonus">Bonus story</option>
                  </select>
                  <input type="number" min="0" value={newForm.duration_seconds} onChange={(e) => setNewForm({ ...newForm, duration_seconds: e.target.value })} placeholder="Duration (seconds)" className="border border-stone-300 rounded-xl px-3 py-2 text-sm" />
                </div>
                <input
                  value={newForm.audio_url}
                  onChange={(e) => setNewForm({ ...newForm, audio_url: e.target.value })}
                  placeholder="Audio URL — default / English (optional)"
                  className="w-full border border-stone-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <AudioUrlsFields
                  value={newForm.audio_urls}
                  onChange={(audio_urls) => setNewForm({ ...newForm, audio_urls })}
                />
                <input
                  value={newForm.image_url}
                  onChange={(e) => setNewForm({ ...newForm, image_url: e.target.value })}
                  placeholder="Image URL (optional)"
                  className="w-full border border-stone-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <div className="flex flex-wrap gap-x-5 gap-y-2">
                  <label className="flex items-center gap-2 text-sm text-stone-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newForm.is_published}
                      onChange={(e) => setNewForm({ ...newForm, is_published: e.target.checked })}
                      className="accent-amber-600"
                    />
                    Published
                  </label>
                  <label className="flex items-center gap-2 text-sm text-stone-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newForm.is_paid}
                      onChange={(e) => setNewForm({ ...newForm, is_paid: e.target.checked })}
                      className="accent-amber-600"
                    />
                    Paid chapter
                  </label>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={addStop}
                    disabled={isSaving || !newForm.title}
                    className="bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-50"
                  >
                    {isSaving ? 'Adding…' : 'Add stop'}
                  </button>
                  <button
                    onClick={() => setIsAddingNew(false)}
                    className="bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-semibold px-4 py-2 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsAddingNew(true)}
                className="w-full py-4 border-2 border-dashed border-stone-300 rounded-2xl text-stone-500
                           hover:border-amber-400 hover:text-amber-600 transition-colors font-medium text-sm"
              >
                + Add new stop
              </button>
            )}
          </>
        )}
      </main>
    </div>
  )
}
