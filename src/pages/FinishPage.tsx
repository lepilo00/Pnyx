import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from '@/components/Layout'
import FeedbackForm from '@/components/FeedbackForm'
import EmailSignupForm from '@/components/EmailSignupForm'
import { track } from '@/lib/analytics'

export default function FinishPage() {
  const { t } = useTranslation()

  useEffect(() => {
    void track('walk_completed', '/finish')
  }, [])

  return (
    <Layout>
      <div className="space-y-8">
        {/* Completion header */}
        <section className="-mx-4 px-6 pt-8 pb-8
                             bg-gradient-to-b from-amber-50 to-stone-50
                             dark:from-stone-900 dark:to-stone-950
                             border-b border-stone-100 dark:border-stone-800 text-center">
          <div className="text-5xl mb-4">🏛</div>
          <h1 className="font-serif text-3xl font-bold text-stone-900 dark:text-stone-100 mb-2">
            {t('finish.heading')}
          </h1>
          <p className="text-stone-600 dark:text-stone-400 leading-relaxed max-w-xs mx-auto">
            {t('finish.subhead')}
          </p>
        </section>

        {/* Feedback */}
        <section>
          <h2 className="font-serif text-xl font-bold text-stone-800 dark:text-stone-100 mb-1">
            {t('finish.feedbackHeading')}
          </h2>
          <p className="text-stone-500 dark:text-stone-400 text-sm mb-4">
            {t('finish.feedbackSubhead')}
          </p>
          <FeedbackForm />
        </section>

        <div className="border-t border-stone-100 dark:border-stone-800" />

        {/* Email signup */}
        <section>
          <h2 className="font-serif text-xl font-bold text-stone-800 dark:text-stone-100 mb-1">
            {t('finish.signupHeading')}
          </h2>
          <p className="text-stone-500 dark:text-stone-400 text-sm mb-4">
            {t('finish.signupSubhead')}
          </p>
          <EmailSignupForm source="finish" />
        </section>

        <div className="border-t border-stone-100 dark:border-stone-800" />

        <div className="text-center pb-4">
          <Link
            to="/"
            className="text-amber-600 dark:text-amber-400 font-semibold hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
          >
            {t('finish.backToStart')}
          </Link>
        </div>
      </div>
    </Layout>
  )
}
