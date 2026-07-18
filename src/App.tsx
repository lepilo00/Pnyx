import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'
import { ThemeProvider } from '@/lib/ThemeContext'
import ScrollToTop from '@/components/ScrollToTop'

const LandingPage = lazy(() => import('@/pages/LandingPage'))
const StartPage = lazy(() => import('@/pages/StartPage'))
const StopPage = lazy(() => import('@/pages/StopPage'))
const FinishPage = lazy(() => import('@/pages/FinishPage'))
const PrivacyPage = lazy(() => import('@/pages/PrivacyPage'))
const TermsPage = lazy(() => import('@/pages/TermsPage'))
const CookiesPage = lazy(() => import('@/pages/CookiesPage'))
const NavigatePage = lazy(() => import('@/pages/NavigatePage'))
const AboutPage = lazy(() => import('@/pages/AboutPage'))
const SupportPage = lazy(() => import('@/pages/SupportPage'))
const PremiumPage = lazy(() => import('@/pages/PremiumPage'))
const HowItWorksPage = lazy(() => import('@/pages/HowItWorksPage'))
const StoryPage = lazy(() => import('@/pages/StoryPage'))
const ContactPage = lazy(() => import('@/pages/ContactPage'))
const AdminLoginPage = lazy(() => import('@/pages/admin/AdminLoginPage'))
const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage'))
const AdminStopsPage = lazy(() => import('@/pages/admin/AdminStopsPage'))
const AdminSignupsPage = lazy(() => import('@/pages/admin/AdminSignupsPage'))
const AdminFeedbackPage = lazy(() => import('@/pages/admin/AdminFeedbackPage'))
const AdminGuidesPage = lazy(() => import('@/pages/admin/AdminGuidesPage'))
const FeedbackPage = lazy(() => import('@/pages/FeedbackPage'))
const BetaInvitationPage = lazy(() => import('@/pages/BetaInvitationPage'))
const AdminFeedbackSettingsPage = lazy(() => import('@/pages/admin/AdminFeedbackSettingsPage'))

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-stone-100 dark:bg-stone-900">
      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined)

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  if (session === undefined) {
    return <PageLoader />
  }

  if (!session) return <Navigate to="/admin/login" replace />
  if (session.user.app_metadata.role !== 'admin') {
    return <Navigate to="/admin/login" replace state={{ unauthorized: true }} />
  }
  return <>{children}</>
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/start" element={<StartPage />} />
          <Route path="/stop/:id" element={<StopPage />} />
          <Route path="/finish" element={<FinishPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/cookies" element={<CookiesPage />} />
          <Route path="/navigate" element={<NavigatePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/premium" element={<PremiumPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/story" element={<StoryPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/feedback/:guideId" element={<FeedbackPage />} />
          <Route path="/beta/:token" element={<BetaInvitationPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<ProtectedRoute><AdminDashboardPage /></ProtectedRoute>} />
          <Route path="/admin/stops" element={<ProtectedRoute><AdminStopsPage /></ProtectedRoute>} />
          <Route path="/admin/signups" element={<ProtectedRoute><AdminSignupsPage /></ProtectedRoute>} />
          <Route path="/admin/feedback" element={<ProtectedRoute><AdminFeedbackPage /></ProtectedRoute>} />
          <Route path="/admin/feedback/settings" element={<ProtectedRoute><AdminFeedbackSettingsPage /></ProtectedRoute>} />
          <Route path="/admin/guides" element={<ProtectedRoute><AdminGuidesPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </BrowserRouter>
    </ThemeProvider>
  )
}
