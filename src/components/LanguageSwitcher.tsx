import { useState, useRef, useEffect } from 'react'
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
  /**
   * default — icon-sized dropdown trigger (legacy header style)
   * compact — "EN ▾" pill trigger for the new header
   * inline — plain expanded list, for use inside the menu drawer
   */
  variant?: 'default' | 'compact' | 'inline'
  /** Called after a language is picked (e.g. to close the drawer). */
  onSelect?: () => void
}

export default function LanguageSwitcher({ variant = 'default', onSelect }: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const current = LANGUAGES.find((l) => l.code === i18n.language) ?? LANGUAGES[0]

  useEffect(() => {
    if (!isOpen || variant === 'inline') return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('mousedown', onClickOutside)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('mousedown', onClickOutside)
    }
  }, [isOpen, variant])

  const pickLanguage = (code: Locale) => {
    void changeLocale(code)
    setIsOpen(false)
    onSelect?.()
  }

  if (variant === 'inline') {
    return (
      <ul aria-label={t('common.languageSwitcher.label')} className="space-y-0.5">
        {LANGUAGES.map((lang) => (
          <li key={lang.code}>
            <button
              onClick={() => pickLanguage(lang.code)}
              aria-current={lang.code === current.code}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors
                hover:bg-stone-100 dark:hover:bg-stone-800
                ${
                  lang.code === current.code
                    ? 'text-amber-600 dark:text-amber-400 font-semibold'
                    : 'text-stone-700 dark:text-stone-300'
                }`}
            >
              {lang.label}
            </button>
          </li>
        ))}
      </ul>
    )
  }

  const triggerClass =
    variant === 'compact'
      ? `h-8 px-2 flex items-center gap-1 rounded-lg
         border border-stone-200 dark:border-stone-700
         text-stone-600 dark:text-stone-300
         hover:bg-stone-100 dark:hover:bg-stone-800
         text-xs font-bold uppercase transition-colors`
      : `w-9 h-9 flex items-center justify-center rounded-xl
         hover:bg-stone-100 dark:hover:bg-stone-800
         text-stone-400 dark:text-stone-500
         hover:text-stone-700 dark:hover:text-stone-200
         text-xs font-bold uppercase transition-colors`

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={t('common.languageSwitcher.label')}
        className={triggerClass}
      >
        {current.code}
        {variant === 'compact' && (
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>
      {isOpen && (
        <ul
          role="listbox"
          aria-label={t('common.languageSwitcher.label')}
          className={`absolute top-11 z-20 w-40 rounded-xl border border-stone-200 dark:border-stone-700
                     bg-white dark:bg-stone-900 shadow-lg py-1
                     ${variant === 'compact' ? 'right-0' : 'left-0'}`}
        >
          {LANGUAGES.map((lang) => (
            <li key={lang.code} role="option" aria-selected={lang.code === current.code}>
              <button
                onClick={() => pickLanguage(lang.code)}
                className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-stone-50 dark:hover:bg-stone-800
                  ${
                    lang.code === current.code
                      ? 'text-amber-600 dark:text-amber-400 font-semibold'
                      : 'text-stone-700 dark:text-stone-300'
                  }`}
              >
                {lang.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
