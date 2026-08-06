import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { ThemeProvider } from '@/lib/ThemeContext'
import ScrollToTop from '@/components/ScrollToTop'
import { useTranslation } from 'react-i18next'

const LandingPage = lazy(() => import('@/pages/LandingPage'))
const ListenPage = lazy(() => import('@/pages/ListenPage'))
const StopPage = lazy(() => import('@/pages/StopPage'))
const FinishPage = lazy(() => import('@/pages/FinishPage'))
const PrivacyPage = lazy(() => import('@/pages/PrivacyPage'))
const TermsPage = lazy(() => import('@/pages/TermsPage'))
const CookiesPage = lazy(() => import('@/pages/CookiesPage'))
const NavigatePage = lazy(() => import('@/pages/NavigatePage'))
const AboutPage = lazy(() => import('@/pages/AboutPage'))
const SupportPage = lazy(() => import('@/pages/SupportPage'))
const HowItWorksPage = lazy(() => import('@/pages/HowItWorksPage'))
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
const ProtectedAdminRoute = lazy(() => import('@/pages/admin/ProtectedAdminRoute'))

function PageLoader() {
  const { t } = useTranslation()
  return (
    <div className="flex items-center justify-center min-h-screen bg-stone-100 dark:bg-stone-900" role="status" aria-label={t('common.loading')}>
      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" aria-hidden="true" />
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/listen" element={<ListenPage />} />
          <Route path="/start" element={<Navigate to="/listen" replace />} />
          <Route path="/stop/:id" element={<StopPage />} />
          <Route path="/finish" element={<FinishPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/cookies" element={<CookiesPage />} />
          <Route path="/navigate" element={<NavigatePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/premium" element={<Navigate to="/listen" replace />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/story" element={<Navigate to="/about" replace />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/feedback/:guideId" element={<FeedbackPage />} />
          <Route path="/beta/:token" element={<BetaInvitationPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<ProtectedAdminRoute><AdminDashboardPage /></ProtectedAdminRoute>} />
          <Route path="/admin/stops" element={<ProtectedAdminRoute><AdminStopsPage /></ProtectedAdminRoute>} />
          <Route path="/admin/signups" element={<ProtectedAdminRoute><AdminSignupsPage /></ProtectedAdminRoute>} />
          <Route path="/admin/feedback" element={<ProtectedAdminRoute><AdminFeedbackPage /></ProtectedAdminRoute>} />
          <Route path="/admin/feedback/settings" element={<ProtectedAdminRoute><AdminFeedbackSettingsPage /></ProtectedAdminRoute>} />
          <Route path="/admin/guides" element={<ProtectedAdminRoute><AdminGuidesPage /></ProtectedAdminRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </BrowserRouter>
    </ThemeProvider>
  )
}
