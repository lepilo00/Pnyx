import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import Layout from '@/components/Layout'

const STEP_KEYS = ['step1', 'step2', 'step3', 'step4'] as const

export default function HowItWorksPage() {
  const { t } = useTranslation()

  return (
    <Layout showBack>
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-3xl font-bold text-amber-700 dark:text-amber-500 mb-3">
            {t('pages.howItWorks.title')}
          </h1>
          <p className="text-stone-600 dark:text-stone-400 text-sm leading-relaxed">
            {t('pages.howItWorks.intro')}
          </p>
        </div>

        <div className="space-y-3">
          {STEP_KEYS.map((key, i) => (
            <div key={key} className="card p-4 flex items-start gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900/30
                               text-amber-700 dark:text-amber-400 text-sm font-bold
                               flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <div>
                <p className="font-semibold text-sm text-stone-800 dark:text-stone-100 mb-1">
                  {t(`pages.howItWorks.${key}.title`)}
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                  {t(`pages.howItWorks.${key}.body`)}
                </p>
              </div>
            </div>
          ))}
        </div>

        <Link
          to="/start"
          className="flex items-center justify-center w-full
                     bg-amber-600 hover:bg-amber-700 active:bg-amber-800
                     text-white font-semibold text-base py-4 rounded-2xl
                     transition-colors shadow-md shadow-amber-200 dark:shadow-amber-900/20"
        >
          {t('menu.startFree')}
        </Link>
      </div>
    </Layout>
  )
}
