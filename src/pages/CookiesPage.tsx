import { useTranslation } from 'react-i18next'
import Layout from '@/components/Layout'
import LegalSections, { type LegalSection } from '@/components/LegalSections'

export default function CookiesPage() {
  const { t } = useTranslation()
  const sectionsBeforeTable = t('legal.cookies.sectionsBeforeTable', { returnObjects: true }) as LegalSection[]
  const sectionsAfterTable = t('legal.cookies.sectionsAfterTable', { returnObjects: true }) as LegalSection[]

  return (
    <Layout>
      <div className="space-y-6 text-stone-700 dark:text-stone-300">
        <div>
          <h1 className="font-serif text-3xl font-bold text-stone-900 dark:text-stone-100 mb-1">
            {t('legal.cookies.title')}
          </h1>
          <p className="text-sm text-stone-400 dark:text-stone-500">{t('legal.cookies.lastUpdated')}</p>
        </div>

        <LegalSections sections={sectionsBeforeTable} />

        <section className="space-y-2">
          <h2 className="font-semibold text-stone-800 dark:text-stone-200 text-lg">
            {t('legal.cookies.table.heading')}
          </h2>
          <div className="rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden text-sm">
            <div className="grid grid-cols-3 gap-2 bg-stone-100 dark:bg-stone-800 px-4 py-2 font-semibold text-stone-600 dark:text-stone-300">
              <span>{t('legal.cookies.table.cookieHeader')}</span>
              <span>{t('legal.cookies.table.purposeHeader')}</span>
              <span>{t('legal.cookies.table.durationHeader')}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 px-4 py-3 border-t border-stone-100 dark:border-stone-700">
              <span className="font-mono text-xs text-stone-700 dark:text-stone-300">sb-auth-token</span>
              <span className="text-stone-600 dark:text-stone-400">{t('legal.cookies.table.authTokenPurpose')}</span>
              <span className="text-stone-500 dark:text-stone-500">{t('legal.cookies.table.authTokenDuration')}</span>
            </div>
          </div>
        </section>

        <LegalSections sections={sectionsAfterTable} />
      </div>
    </Layout>
  )
}
