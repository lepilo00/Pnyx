import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from '@/components/Layout'

interface Person {
  name: string
  role: string
  bio: string
}

interface SourceEntry {
  author: string
  works: string
}

export default function AboutPage() {
  const { t } = useTranslation()
  const story = t('about.story', { returnObjects: true }) as string[]
  const people = t('about.people', { returnObjects: true }) as Person[]
  const ancientSources = t('about.sources.ancient', { returnObjects: true }) as SourceEntry[]
  const modernSources = t('about.sources.modern', { returnObjects: true }) as SourceEntry[]

  return (
    <Layout>
      <div className="space-y-6 text-stone-700 dark:text-stone-300">
        <h1 className="font-serif text-3xl font-bold text-stone-900 dark:text-stone-100">
          {t('about.title')}
        </h1>

        <div className="rounded-2xl overflow-hidden border border-stone-100 dark:border-stone-800 shadow-sm aspect-[5/4]">
          <img
            src="/team.jpg"
            alt={t('about.photoAlt')}
            className="w-full h-full object-cover object-[50%_30%]"
          />
        </div>

        <div className="space-y-4">
          {story.map((paragraph, i) => (
            <p key={i} className="leading-relaxed">{paragraph}</p>
          ))}
        </div>

        <div className="space-y-4">
          <h2 className="font-semibold text-stone-800 dark:text-stone-200 text-lg">
            {t('about.peopleHeading')}
          </h2>
          {people.map(({ name, role, bio }) => (
            <div key={name} className="card p-5">
              <h3 className="font-serif text-lg font-bold text-stone-800 dark:text-stone-100">
                {name}
              </h3>
              <p className="text-sm text-amber-700 dark:text-amber-400 mb-2">{role}</p>
              <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">{bio}</p>
            </div>
          ))}
          <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">{t('about.aiDisclosure')}</p>
        </div>

        <div className="space-y-4">
          <div>
            <h2 className="font-semibold text-stone-800 dark:text-stone-200 text-lg mb-2">
              {t('about.sources.heading')}
            </h2>
            <p className="text-sm leading-relaxed">{t('about.sources.intro')}</p>
          </div>

          <div className="card p-5 space-y-3">
            <p className="text-xs uppercase tracking-widest text-amber-600 dark:text-amber-500 font-semibold">
              {t('about.sources.ancientHeading')}
            </p>
            <ul className="space-y-2">
              {ancientSources.map(({ author, works }) => (
                <li key={author} className="text-sm leading-relaxed">
                  <span className="font-semibold text-stone-800 dark:text-stone-100">{author}</span>
                  {' — '}
                  <span className="text-stone-600 dark:text-stone-400">{works}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card p-5 space-y-3">
            <p className="text-xs uppercase tracking-widest text-amber-600 dark:text-amber-500 font-semibold">
              {t('about.sources.modernHeading')}
            </p>
            <ul className="space-y-2">
              {modernSources.map(({ author, works }) => (
                <li key={author} className="text-sm leading-relaxed">
                  <span className="font-semibold text-stone-800 dark:text-stone-100">{author}</span>
                  {' — '}
                  <span className="text-stone-600 dark:text-stone-400">{works}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="leading-relaxed">{t('about.outro')}</p>

        <Link
          to="/support"
          className="flex items-center justify-center gap-2 w-full
                     bg-white dark:bg-stone-800
                     hover:bg-stone-50 dark:hover:bg-stone-700
                     border border-stone-200 dark:border-stone-700
                     text-stone-700 dark:text-stone-200
                     font-medium text-base py-3.5 rounded-2xl
                     transition-colors"
        >
          <span aria-hidden="true" className="text-amber-600 dark:text-amber-400">♥</span>
          {t('about.donate')}
        </Link>

        <Link
          to="/listen"
          className="flex items-center justify-center gap-2 w-full
                     bg-amber-600 hover:bg-amber-700 active:bg-amber-800
                     text-white font-semibold text-lg py-4 rounded-2xl
                     transition-colors shadow-lg shadow-amber-200 dark:shadow-amber-900/30"
        >
          {t('about.cta')}
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      </div>
    </Layout>
  )
}
