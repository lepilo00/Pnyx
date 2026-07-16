import { useTranslation } from 'react-i18next'
import { changeLocale, type Locale } from '@/i18n'

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'es', label: 'Español' },
  { code: 'de', label: 'Deutsch' },
  { code: 'zh', label: '中文' },
  { code: 'el', label: 'Ελληνικά' },
  { code: 'sl', label: 'Slovenščina' },
  { code: 'it', label: 'Italiano' },
  { code: 'hr', label: 'Hrvatski' },
  { code: 'sr', label: 'Srpski' },
] as const

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
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors
                        hover:bg-stone-100 dark:hover:bg-stone-800 ${
                          language.code === current.code
                            ? 'text-amber-600 dark:text-amber-400 font-semibold'
                            : 'text-stone-700 dark:text-stone-300'
                        }`}
          >
            {language.label}
          </button>
        </li>
      ))}
    </ul>
  )
}
