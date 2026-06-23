import { useTranslation } from 'react-i18next'
import Layout from '@/components/Layout'
import LegalSections, { type LegalSection } from '@/components/LegalSections'

export default function PrivacyPage() {
  const { t } = useTranslation()
  const sections = t('legal.privacy.sections', { returnObjects: true }) as LegalSection[]

  return (
    <Layout>
      <div className="space-y-6 text-stone-700 dark:text-stone-300">
        <div>
          <h1 className="font-serif text-3xl font-bold text-stone-900 dark:text-stone-100 mb-1">
            {t('legal.privacy.title')}
          </h1>
          <p className="text-sm text-stone-400 dark:text-stone-500">{t('legal.privacy.lastUpdated')}</p>
        </div>
        <LegalSections sections={sections} />
      </div>
    </Layout>
  )
}
