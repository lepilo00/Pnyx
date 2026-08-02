import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'

interface Stats { signups: number; feedback: number; completions: number; avgStartEase: number | null; contributionViews: number; contributionOpens: number; selfReportedContributions: number }
const initialStats: Stats = { signups: 0, feedback: 0, completions: 0, avgStartEase: null, contributionViews: 0, contributionOpens: 0, selfReportedContributions: 0 }

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(initialStats)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadStats() {
      const countEvent = (eventName: string) => supabase.from('analytics_events').select('*', { count: 'exact', head: true }).eq('event_name', eventName)
      const [signups, feedback, completions, ease, contributionViews, contributionOpens, contributions] = await Promise.all([
        supabase.from('email_signups').select('*', { count: 'exact', head: true }),
        supabase.from('feedback_submissions').select('*', { count: 'exact', head: true }),
        countEvent('walk_completed'),
        supabase.from('feedback_answers').select('value').eq('question_key', 'start_ease'),
        countEvent('donation_prompt_shown'),
        countEvent('donation_panel_opened'),
        countEvent('donation_self_reported'),
      ])
      const firstError = [signups, feedback, completions, ease, contributionViews, contributionOpens, contributions].find((result) => result.error)?.error
      if (firstError) setError(firstError.message)
      const ratings = (ease.data ?? []).map((row) => Number(row.value)).filter(Number.isFinite)
      setStats({
        signups: signups.count ?? 0,
        feedback: feedback.count ?? 0,
        completions: completions.count ?? 0,
        avgStartEase: ratings.length ? Math.round(ratings.reduce((sum, value) => sum + value, 0) / ratings.length * 10) / 10 : null,
        contributionViews: contributionViews.count ?? 0,
        contributionOpens: contributionOpens.count ?? 0,
        selfReportedContributions: contributions.count ?? 0,
      })
      setIsLoading(false)
    }
    void loadStats()
  }, [])

  const handleSignOut = async () => { await supabase.auth.signOut(); navigate('/admin/login', { replace: true }) }
  const statCards = [
    ['Email signups', stats.signups], ['Feedback responses', stats.feedback], ['Walk completions', stats.completions],
    ['Avg. start ease', stats.avgStartEase ?? '—'], ['Contribution prompt views', stats.contributionViews], ['Contribution panel opens', stats.contributionOpens], ['Self-reported contributions', stats.selfReportedContributions],
  ]
  return <div className="min-h-screen bg-stone-100"><nav className="flex items-center justify-between bg-stone-900 px-6 py-4 text-white"><div><span className="text-lg font-bold">Pnyx Admin</span><span className="ml-3 text-sm text-stone-400">PNYX Athens</span></div><button onClick={handleSignOut} className="text-sm text-stone-300">Sign out</button></nav><main className="mx-auto max-w-4xl space-y-6 p-6"><h1 className="text-2xl font-bold text-stone-800">Dashboard</h1>{error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}{isLoading ? <div className="grid grid-cols-2 gap-4">{[1,2,3,4].map((i)=><div key={i} className="h-24 animate-pulse rounded-2xl bg-white" />)}</div> : <div className="grid grid-cols-2 gap-4">{statCards.map(([label,value])=><div key={String(label)} className="rounded-2xl border border-stone-200 bg-white p-5"><p className="text-sm text-stone-500">{label}</p><p className="mt-1 text-3xl font-bold text-stone-900">{value}</p></div>)}</div>}<div className="grid gap-3">{[
    ['/admin/guides','Manage guides','Create guides and configure content'], ['/admin/stops','Manage stops','Add, edit, reorder and publish audio stories'], ['/admin/signups','Email signups','View and export visitor email signups'], ['/admin/feedback','Feedback','Review survey results and qualitative responses'],
  ].map(([to,label,description])=><Link key={to} to={to} className="flex items-center justify-between rounded-2xl border border-stone-200 bg-white p-4"><span><strong className="block">{label}</strong><small className="text-stone-500">{description}</small></span><span aria-hidden="true">→</span></Link>)}</div><div className="text-center"><a href="/" target="_blank" rel="noopener noreferrer" className="text-sm text-stone-400">View public site ↗</a></div></main></div>
}
