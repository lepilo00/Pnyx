import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import type { Stop } from '@/lib/types'

interface StopFormData {
  title: string
  description: string
  audio_url: string
  image_url: string
  is_published: boolean
}

const EMPTY_FORM: StopFormData = {
  title: '',
  description: '',
  audio_url: '',
  image_url: '',
  is_published: false,
}

export default function AdminStopsPage() {
  const [stops, setStops] = useState<Stop[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<StopFormData>(EMPTY_FORM)
  const [newForm, setNewForm] = useState<StopFormData>(EMPTY_FORM)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadStops = async () => {
    const { data } = await supabase
      .from('stops')
      .select('*')
      .order('order_index', { ascending: true })
    setStops((data as Stop[]) ?? [])
    setIsLoading(false)
  }

  useEffect(() => { void loadStops() }, [])

  const togglePublished = async (stop: Stop) => {
    await supabase.from('stops').update({ is_published: !stop.is_published }).eq('id', stop.id)
    void loadStops()
  }

  const startEdit = (stop: Stop) => {
    setEditingId(stop.id)
    setEditForm({
      title: stop.title,
      description: stop.description,
      audio_url: stop.audio_url ?? '',
      image_url: stop.image_url ?? '',
      is_published: stop.is_published,
    })
  }

  const saveEdit = async () => {
    if (!editingId) return
    setIsSaving(true)
    setError(null)
    const { error: err } = await supabase.from('stops').update({
      title: editForm.title,
      description: editForm.description,
      audio_url: editForm.audio_url || null,
      image_url: editForm.image_url || null,
      is_published: editForm.is_published,
    }).eq('id', editingId)
    if (err) setError(err.message)
    setIsSaving(false)
    setEditingId(null)
    void loadStops()
  }

  const deleteStop = async (id: string) => {
    await supabase.from('stops').delete().eq('id', id)
    setDeleteConfirmId(null)
    void loadStops()
  }

  const moveStop = async (index: number, direction: 'up' | 'down') => {
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= stops.length) return

    const a = stops[index]
    const b = stops[swapIndex]
    await Promise.all([
      supabase.from('stops').update({ order_index: b.order_index }).eq('id', a.id),
      supabase.from('stops').update({ order_index: a.order_index }).eq('id', b.id),
    ])
    void loadStops()
  }

  const addStop = async () => {
    setIsSaving(true)
    setError(null)
    const maxOrder = stops.reduce((m, s) => Math.max(m, s.order_index), 0)

    // Need a walk_id — fetch the first walk or use a placeholder
    const { data: walks } = await supabase.from('walks').select('id').limit(1)
    const walkId = walks?.[0]?.id ?? null

    const { error: err } = await supabase.from('stops').insert({
      walk_id: walkId,
      order_index: maxOrder + 1,
      title: newForm.title,
      description: newForm.description,
      audio_url: newForm.audio_url || null,
      image_url: newForm.image_url || null,
      is_published: newForm.is_published,
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
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      placeholder="Description"
                      rows={3}
                      className="w-full border border-stone-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                    />
                    <input
                      value={editForm.audio_url}
                      onChange={(e) => setEditForm({ ...editForm, audio_url: e.target.value })}
                      placeholder="Audio URL (optional)"
                      className="w-full border border-stone-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                    <input
                      value={editForm.image_url}
                      onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
                      placeholder="Image URL (optional)"
                      className="w-full border border-stone-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                    <label className="flex items-center gap-2 text-sm text-stone-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editForm.is_published}
                        onChange={(e) => setEditForm({ ...editForm, is_published: e.target.checked })}
                        className="accent-amber-600"
                      />
                      Published
                    </label>
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
                    </div>

                    {/* Published badge */}
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                      stop.is_published ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-500'
                    }`}>
                      {stop.is_published ? 'Published' : 'Draft'}
                    </span>

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
                <textarea
                  value={newForm.description}
                  onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
                  placeholder="Description"
                  rows={3}
                  className="w-full border border-stone-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                />
                <input
                  value={newForm.audio_url}
                  onChange={(e) => setNewForm({ ...newForm, audio_url: e.target.value })}
                  placeholder="Audio URL (optional)"
                  className="w-full border border-stone-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <input
                  value={newForm.image_url}
                  onChange={(e) => setNewForm({ ...newForm, image_url: e.target.value })}
                  placeholder="Image URL (optional)"
                  className="w-full border border-stone-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <label className="flex items-center gap-2 text-sm text-stone-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newForm.is_published}
                    onChange={(e) => setNewForm({ ...newForm, is_published: e.target.checked })}
                    className="accent-amber-600"
                  />
                  Published
                </label>
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
