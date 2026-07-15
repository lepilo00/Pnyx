import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import type { EmailSignup } from '@/lib/types'

const PAGE_SIZE = 25

export default function AdminSignupsPage() {
  const [signups, setSignups] = useState<EmailSignup[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setIsLoading(true)
      setError(null)
      const { data, count, error: loadError } = await supabase
        .from('email_signups')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

      if (loadError) setError(loadError.message)
      setSignups((data as EmailSignup[]) ?? [])
      setTotal(count ?? 0)
      setIsLoading(false)
    }
    void load()
  }, [page])

  const csvCell = (value: string) => {
    const formulaSafe = /^[=+@-]/.test(value) ? `'${value}` : value
    return `"${formulaSafe.replace(/"/g, '""')}"`
  }

  const exportCsv = async () => {
    setIsExporting(true)
    setError(null)
    const allSignups: EmailSignup[] = []
    const batchSize = 1000
    for (let from = 0; ; from += batchSize) {
      const { data, error: exportError } = await supabase
        .from('email_signups')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, from + batchSize - 1)
      if (exportError) {
        setError(exportError.message)
        setIsExporting(false)
        return
      }
      const batch = (data as EmailSignup[]) ?? []
      allSignups.push(...batch)
      if (batch.length < batchSize) break
    }
    const header = 'email,source,consent,created_at'
    const rows = allSignups.map((s) =>
      [s.email, s.source, s.consent ? 'yes' : 'no', s.created_at].map(csvCell).join(',')
    )
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'signups.csv'
    a.click()
    URL.revokeObjectURL(url)
    setIsExporting(false)
  }

  return (
    <div className="min-h-screen bg-stone-100">
      <nav className="bg-stone-900 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/admin" className="text-stone-400 hover:text-white text-sm transition-colors">← Dashboard</Link>
          <span className="font-bold text-lg">Email Signups</span>
        </div>
        <button
          onClick={exportCsv}
          disabled={isExporting}
          className="text-sm bg-stone-700 hover:bg-stone-600 px-3 py-1.5 rounded-lg text-white transition-colors"
        >
          {isExporting ? 'Exporting…' : 'Export CSV'}
        </button>
      </nav>

      <main className="max-w-4xl mx-auto p-6">
        {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-stone-500">{total} total signups</p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="text-sm px-3 py-1.5 rounded-lg bg-white border border-stone-200 disabled:opacity-40 hover:bg-stone-50"
            >
              ← Prev
            </button>
            <span className="text-sm px-3 py-1.5 text-stone-500">
              Page {page + 1} of {Math.ceil(total / PAGE_SIZE) || 1}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={(page + 1) * PAGE_SIZE >= total}
              className="text-sm px-3 py-1.5 rounded-lg bg-white border border-stone-200 disabled:opacity-40 hover:bg-stone-50"
            >
              Next →
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-stone-400">Loading…</div>
        ) : signups.length === 0 ? (
          <div className="text-center py-12 text-stone-400">No signups yet.</div>
        ) : (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50">
                    <th className="text-left px-4 py-3 font-semibold text-stone-600">Email</th>
                    <th className="text-left px-4 py-3 font-semibold text-stone-600">Source</th>
                    <th className="text-left px-4 py-3 font-semibold text-stone-600">Consent</th>
                    <th className="text-left px-4 py-3 font-semibold text-stone-600">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {signups.map((s, i) => (
                    <tr key={s.id} className={`border-b border-stone-100 ${i % 2 === 0 ? '' : 'bg-stone-50/50'}`}>
                      <td className="px-4 py-3 text-stone-800">{s.email}</td>
                      <td className="px-4 py-3 text-stone-500">{s.source}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          s.consent ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                        }`}>
                          {s.consent ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-stone-400 text-xs">
                        {new Date(s.created_at).toLocaleDateString('en-GB', {
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
