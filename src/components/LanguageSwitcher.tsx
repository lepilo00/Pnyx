import { useTranslation } from 'react-i18next'
import { changeLocale, type Locale } from '@/i18n'
import { LANGUAGES } from '@/data/languages'
import FlagIcon from './FlagIcon'

interface LanguageSwitcherProps {
  /** Called after a language is picked so the menu drawer can close. */
  onSelect?: () => void
}

export default function LanguageSwitcher({ onSelect }: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation()
  const current = LANGUAGES.find((language) => language.code === i18n.language) ?? LANGUAGES[0]

  const pickLanguage = (code: Locale) => {
    void changeLocale(code)
    onSelect?.()
  }

  return (
    <ul aria-label={t('common.languageSwitcher.label')} className="space-y-0.5">
      {LANGUAGES.map((language) => (
        <li key={language.code}>
          <button
            onClick={() => pickLanguage(language.code)}
            aria-current={language.code === current.code ? 'true' : undefined}
            className={`w-full flex items-center gap-2.5 text-left px-3 py-2 rounded-lg text-sm transition-colors
                        hover:bg-stone-100 dark:hover:bg-stone-800 ${
                          language.code === current.code
                            ? 'text-amber-600 dark:text-amber-400 font-semibold'
                            : 'text-stone-700 dark:text-stone-300'
                        }`}
          >
            <FlagIcon code={language.flag} />
            <span className="flex-1">{language.label}</span>
            {language.code === current.code && (
              <svg className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M4 10l4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        </li>
      ))}
    </ul>
  )
}
