import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'es', label: 'Español' },
  { code: 'de', label: 'Deutsch' },
  { code: 'zh', label: '中文' },
  { code: 'el', label: 'Ελληνικά' },
  { code: 'sl', label: 'Slovenščina' },
  { code: 'it', label: 'Italiano' },
] as const

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const current = LANGUAGES.find((l) => l.code === i18n.language) ?? LANGUAGES[0]

  useEffect(() => {
    if (!isOpen) return
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
  }, [isOpen])

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={t('common.languageSwitcher.label')}
        className="w-9 h-9 flex items-center justify-center rounded-xl
                   hover:bg-stone-100 dark:hover:bg-stone-800
                   text-stone-400 dark:text-stone-500
                   hover:text-stone-700 dark:hover:text-stone-200
                   text-xs font-bold uppercase transition-colors"
      >
        {current.code}
      </button>
      {isOpen && (
        <ul
          role="listbox"
          aria-label={t('common.languageSwitcher.label')}
          className="absolute left-0 top-11 z-20 w-40 rounded-xl border border-stone-200 dark:border-stone-700
                     bg-white dark:bg-stone-900 shadow-lg py-1"
        >
          {LANGUAGES.map((lang) => (
            <li key={lang.code} role="option" aria-selected={lang.code === current.code}>
              <button
                onClick={() => {
                  void i18n.changeLanguage(lang.code)
                  setIsOpen(false)
                }}
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
