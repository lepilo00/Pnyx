import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'

// Kept inside the lazy admin boundary so public visitors neither initialize
// admin authentication nor download its route guard.
export default function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined)

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  if (session === undefined) return <AdminAuthLoader />
  if (!session || session.user.app_metadata.role !== 'admin') {
    return <Navigate to="/admin/login" replace state={session ? { unauthorized: true } : undefined} />
  }

  return <>{children}</>
}

function AdminAuthLoader() {
  const { t } = useTranslation()
  return (
    <div className="flex min-h-screen items-center justify-center bg-parchment-100 dark:bg-stone-950" role="status">
      <span className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" aria-hidden="true" />
      <span className="sr-only">{t('common.loading')}</span>
    </div>
  )
}
