import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import type { Feedback } from '@/lib/types'
import { useUnlockPrice } from '@/lib/useAppSettings'

export default function AdminFeedbackPage() {
  const unlockPrice = useUnlockPrice()
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data, error: loadError } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false })
      if (loadError) setError(loadError.message)
      setFeedback((data as Feedback[]) ?? [])
      setIsLoading(false)
    }
    void load()
  }, [])

  const withRatings = feedback.filter((f) => f.rating !== undefined && f.rating !== null)
  const avgRating =
    withRatings.length > 0
      ? withRatings.reduce((sum, f) => sum + (f.rating ?? 0), 0) / withRatings.length
      : null

  const wouldPayCounts = feedback.reduce(
    (acc, f) => {
      if (f.would_pay) acc[f.would_pay] = (acc[f.would_pay] ?? 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  return (
    <div className="min-h-screen bg-stone-100">
      <nav className="bg-stone-900 text-white px-6 py-4 flex items-center gap-3">
        <Link to="/admin" className="text-stone-400 hover:text-white text-sm transition-colors">← Dashboard</Link>
        <span className="font-bold text-lg">Feedback</span>
      </nav>

      <main className="max-w-4xl mx-auto p-6 space-y-6">
        {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        {/* Summary stats */}
        {!isLoading && feedback.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm">
              <p className="text-sm text-stone-500 mb-1">Average rating</p>
              <p className="text-3xl font-bold text-stone-900">
                {avgRating !== null ? `${Math.round(avgRating * 10) / 10} ★` : '—'}
              </p>
              <p className="text-xs text-stone-400 mt-1">{withRatings.length} ratings</p>
            </div>
            <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm">
              <p className="text-sm text-stone-500 mb-2">Would pay €{unlockPrice.toFixed(2)}?</p>
              <div className="space-y-1">
                {(['yes', 'maybe', 'no'] as const).map((opt) => (
                  <div key={opt} className="flex items-center justify-between text-sm">
                    <span className="capitalize text-stone-600">{opt}</span>
                    <span className="font-semibold text-stone-800">{wouldPayCounts[opt] ?? 0}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Feedback list */}
        {isLoading ? (
          <div className="text-center py-12 text-stone-400">Loading…</div>
        ) : feedback.length === 0 ? (
          <div className="text-center py-12 text-stone-400">No feedback yet.</div>
        ) : (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50">
                    <th className="text-left px-4 py-3 font-semibold text-stone-600">Rating</th>
                    <th className="text-left px-4 py-3 font-semibold text-stone-600">Would pay</th>
                    <th className="text-left px-4 py-3 font-semibold text-stone-600">Comment</th>
                    <th className="text-left px-4 py-3 font-semibold text-stone-600">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {feedback.map((f, i) => (
                    <tr key={f.id} className={`border-b border-stone-100 ${i % 2 === 0 ? '' : 'bg-stone-50/50'}`}>
                      <td className="px-4 py-3">
                        {f.rating !== undefined && f.rating !== null ? (
                          <span className="text-amber-500">
                            {'★'.repeat(f.rating)}
                            <span className="text-stone-200">{'★'.repeat(5 - f.rating)}</span>
                          </span>
                        ) : (
                          <span className="text-stone-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {f.would_pay ? (
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${
                            f.would_pay === 'yes'
                              ? 'bg-green-100 text-green-700'
                              : f.would_pay === 'maybe'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-red-100 text-red-600'
                          }`}>
                            {f.would_pay}
                          </span>
                        ) : (
                          <span className="text-stone-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-stone-600 max-w-xs">
                        <span className="line-clamp-2">{f.message ?? <span className="text-stone-300">—</span>}</span>
                      </td>
                      <td className="px-4 py-3 text-stone-400 text-xs whitespace-nowrap">
                        {new Date(f.created_at).toLocaleDateString('en-GB', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
