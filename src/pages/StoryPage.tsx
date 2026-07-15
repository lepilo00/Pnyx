import { useTranslation } from 'react-i18next'
import Layout from '@/components/Layout'

export default function StoryPage() {
  const { t } = useTranslation()

  return (
    <Layout showBack>
      <div className="space-y-5">
        <h1 className="font-serif text-3xl font-bold text-amber-700 dark:text-amber-500">
          {t('pages.story.title')}
        </h1>
        {(['p1', 'p2', 'p3'] as const).map((key) => (
          <p key={key} className="text-stone-600 dark:text-stone-400 text-sm leading-relaxed">
            {t(`pages.story.${key}`)}
          </p>
        ))}
      </div>
    </Layout>
  )
}
