import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import ProgressBar from './ProgressBar'
import MenuDrawer from './MenuDrawer'
import LanguageSwitcher from './LanguageSwitcher'
import { LANGUAGES } from '@/data/languages'
import FlagIcon from './FlagIcon'
import './Layout.css'

interface LayoutProps {
  children: React.ReactNode
  showProgress?: boolean
  currentStop?: number
  totalStops?: number
  showBack?: boolean
  contentWidth?: 'default' | 'wide'
  headerVariant?: 'default' | 'premium' | 'heroOverlay' | 'listen'
}

// Whole-app look: cream/parchment background with white cards and amber
// accents used across navigation and listening surfaces.
export default function Layout({ children, showProgress, currentStop, totalStops, showBack, contentWidth = 'default', headerVariant = 'default' }: LayoutProps) {
  const { t, i18n } = useTranslation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false)
  const languageMenuRef = useRef<HTMLDivElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
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
    <div className={`layout-shell min-h-screen flex flex-col transition-colors duration-200 bg-parchment-100 dark:bg-stone-950 ${headerVariant === 'heroOverlay' ? 'layout-shell--hero-overlay' : ''}`}>
      <header className={`site-header ${headerVariant === 'heroOverlay' ? 'site-header--hero-overlay' : ''} ${headerVariant === 'listen' ? 'site-header--listen' : ''}`}>
        <div className={`flex items-center justify-between mx-auto ${contentWidth === 'wide' ? 'max-w-6xl' : 'max-w-lg'}`}>
          <div className="site-header-brand-wrap">
            {showBack && (
              <Link
                to="/"
                aria-label={t('common.backToHome')}
                className="site-header-icon"
              >
                <BackIcon large />
              </Link>
            )}
            <Link to="/" className="site-header-brand group">
              <span className="site-header-title">
                {t('common.brand.title')}
              </span>
              <span className="site-header-subtitle">
                {t('common.brand.subtitle')}
              </span>
            </Link>
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            <div ref={languageMenuRef} className="relative">
              <button
                onClick={() => setLanguageMenuOpen((open) => !open)}
                aria-label={t('common.languageSwitcher.label')}
                aria-haspopup="menu"
                aria-expanded={languageMenuOpen}
                className={`site-header-language ${languageMenuOpen ? 'is-open' : ''}`}
              >
                <FlagIcon code={currentLanguage.flag} className="h-[18px] w-[27px]" />
                <span className="text-sm font-semibold uppercase tracking-wide">{currentLanguage.code}</span>
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
              ref={menuButtonRef}
              onClick={() => { setLanguageMenuOpen(false); setMenuOpen(true) }}
              aria-label={t('menu.openAria')}
              aria-haspopup="dialog"
              className="site-header-icon"
            >
              <BurgerIcon large />
            </button>
          </div>
        </div>
        {showProgress && currentStop !== undefined && totalStops !== undefined && (
          <div className={`mt-2 mx-auto ${contentWidth === 'wide' ? 'max-w-6xl' : 'max-w-lg'}`}>
            <ProgressBar current={currentStop} total={totalStops} />
          </div>
        )}
      </header>

      <MenuDrawer isOpen={menuOpen} onClose={() => setMenuOpen(false)} returnFocusRef={menuButtonRef} />

      <main className={`flex-1 mx-auto w-full ${contentWidth === 'wide' ? `max-w-6xl px-0 py-0 ${headerVariant === 'heroOverlay' ? '' : 'sm:px-5 sm:py-6'}` : 'max-w-lg px-4 py-6'}`}>
        {children}
      </main>

    </div>
  )
}

function BackIcon({ large = false }: { large?: boolean }) {
  return (
    <svg className={large ? 'h-[22px] w-[22px]' : 'h-4 w-4'} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={large ? 2.2 : 2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  )
}

function BurgerIcon({ large = false }: { large?: boolean }) {
  return (
    <svg className={large ? 'h-6 w-6' : 'h-5 w-5'} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={large ? 2.15 : 2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}

function GlobeIcon() {
  return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 010 18M12 3a15 15 0 000 18" /></svg>
}

function ChevronIcon({ open }: { open: boolean }) {
  return <svg className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M5 7.5l5 5 5-5" /></svg>
}
