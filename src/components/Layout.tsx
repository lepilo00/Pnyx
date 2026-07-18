import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import ProgressBar from './ProgressBar'
import MenuDrawer from './MenuDrawer'
import LanguageSwitcher from './LanguageSwitcher'
import { LANGUAGES } from '@/data/languages'
import FlagIcon from './FlagIcon'

interface LayoutProps {
  children: React.ReactNode
  showProgress?: boolean
  currentStop?: number
  totalStops?: number
  showBack?: boolean
}

// Whole-app look: cream/parchment background with white cards and amber
// accents (navy is reserved for the "go deeper" upsell and unlock cards).
export default function Layout({ children, showProgress, currentStop, totalStops, showBack }: LayoutProps) {
  const { t, i18n } = useTranslation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false)
  const languageMenuRef = useRef<HTMLDivElement>(null)
  const currentLanguage = LANGUAGES.find((language) => language.code === i18n.language) ?? LANGUAGES[0]

  useEffect(() => {
    if (!languageMenuOpen) return
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!languageMenuRef.current?.contains(event.target as Node)) setLanguageMenuOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLanguageMenuOpen(false)
    }
    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [languageMenuOpen])

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-200 bg-parchment-100 dark:bg-stone-950">
      <header className="backdrop-blur-sm px-4 py-3 sticky top-0 z-10 bg-parchment-100/90 dark:bg-stone-900/90 border-b border-parchment-200 dark:border-stone-800">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-1.5">
            {showBack && (
              <Link
                to="/"
                aria-label={t('common.backToHome')}
                className="w-9 h-9 flex items-center justify-center rounded-xl
                           hover:bg-stone-100 dark:hover:bg-stone-800
                           text-stone-400 dark:text-stone-500
                           hover:text-stone-700 dark:hover:text-stone-200
                           transition-colors"
              >
                <BackIcon />
              </Link>
            )}
            <Link to="/" className="flex items-baseline gap-1.5 group">
              <span className="font-serif text-xl font-bold text-amber-700 dark:text-amber-500 tracking-wide group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                {t('common.brand.title')}
              </span>
              <span className="text-sm text-stone-500 dark:text-stone-400">
                {t('common.brand.subtitle')}
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-1.5">
            <div ref={languageMenuRef} className="relative">
              <button
                onClick={() => setLanguageMenuOpen((open) => !open)}
                aria-label={t('common.languageSwitcher.label')}
                aria-haspopup="menu"
                aria-expanded={languageMenuOpen}
                className={`h-9 px-2 flex items-center gap-1 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition-colors ${languageMenuOpen ? 'bg-stone-100 dark:bg-stone-800' : ''}`}
              >
                <FlagIcon code={currentLanguage.flag} className="h-4 w-6" />
                <ChevronIcon open={languageMenuOpen} />
              </button>
              {languageMenuOpen && (
                <div className="absolute right-0 top-11 z-30 w-48 max-h-[min(70vh,28rem)] overflow-y-auto rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 p-1.5 shadow-xl shadow-stone-900/10">
                  <div className="flex items-center gap-2 border-b border-stone-100 dark:border-stone-800 px-2.5 py-2 text-[11px] font-medium text-stone-500 dark:text-stone-400">
                    <GlobeIcon />
                    <span>{t('common.languageSwitcher.label')}</span>
                  </div>
                  <LanguageSwitcher onSelect={() => setLanguageMenuOpen(false)} />
                </div>
              )}
            </div>
            <button
              onClick={() => { setLanguageMenuOpen(false); setMenuOpen(true) }}
              aria-label={t('menu.openAria')}
              aria-haspopup="dialog"
              className="w-9 h-9 flex items-center justify-center rounded-xl
                         hover:bg-stone-100 dark:hover:bg-stone-800
                         text-stone-600 dark:text-stone-300
                         transition-colors"
            >
              <BurgerIcon />
            </button>
          </div>
        </div>
        {showProgress && currentStop !== undefined && totalStops !== undefined && (
          <div className="mt-2 max-w-lg mx-auto">
            <ProgressBar current={currentStop} total={totalStops} />
          </div>
        )}
      </header>

      <MenuDrawer isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">
        {children}
      </main>

    </div>
  )
}

function BackIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  )
}

function BurgerIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}

function GlobeIcon() {
  return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 010 18M12 3a15 15 0 000 18" /></svg>
}

function ChevronIcon({ open }: { open: boolean }) {
  return <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M5 7.5l5 5 5-5" /></svg>
}
