import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import ProgressBar from './ProgressBar'
import LanguageSwitcher from './LanguageSwitcher'
import MenuDrawer from './MenuDrawer'

interface LayoutProps {
  children: React.ReactNode
  showProgress?: boolean
  currentStop?: number
  totalStops?: number
  showBack?: boolean
}

// Whole-app look: cream/parchment background with white cards and amber
// accents (navy is reserved for the premium screen, which has its own shell).
export default function Layout({ children, showProgress, currentStop, totalStops, showBack }: LayoutProps) {
  const { t } = useTranslation()
  const [menuOpen, setMenuOpen] = useState(false)

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
            <LanguageSwitcher variant="compact" />
            <button
              onClick={() => setMenuOpen(true)}
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
