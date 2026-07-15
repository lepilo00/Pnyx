import { useTranslation } from 'react-i18next'
import Layout from '@/components/Layout'
import { CONTACT_EMAIL } from '@/lib/constants'

export default function ContactPage() {
  const { t } = useTranslation()

  return (
    <Layout showBack>
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-3xl font-bold text-amber-700 dark:text-amber-500 mb-3">
            {t('pages.contact.title')}
          </h1>
          <p className="text-stone-600 dark:text-stone-400 text-sm leading-relaxed">
            {t('pages.contact.body')}
          </p>
        </div>

        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="flex items-center justify-center gap-2 w-full
                     bg-amber-600 hover:bg-amber-700 active:bg-amber-800
                     text-white font-semibold text-base py-4 rounded-2xl
                     transition-colors shadow-md shadow-amber-200 dark:shadow-amber-900/20"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          {t('pages.contact.emailButton')}
        </a>
        <p className="text-xs text-stone-400 dark:text-stone-500 text-center font-mono">
          {CONTACT_EMAIL}
        </p>
      </div>
    </Layout>
  )
}
