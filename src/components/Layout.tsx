import { Link } from 'react-router-dom'
import ProgressBar from './ProgressBar'
import { useTheme } from '@/lib/ThemeContext'

interface LayoutProps {
  children: React.ReactNode
  showProgress?: boolean
  currentStop?: number
  totalStops?: number
}

export default function Layout({ children, showProgress, currentStop, totalStops }: LayoutProps) {
  const { isDark, toggle } = useTheme()

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col transition-colors duration-200">
      <header className="bg-white/90 dark:bg-stone-900/90 backdrop-blur-sm border-b border-stone-200 dark:border-stone-800 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="w-9" />
          <Link to="/" className="text-center group">
            <h1 className="font-serif text-lg font-bold text-stone-800 dark:text-stone-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
              Democracy Walk
            </h1>
            <p className="text-xs text-stone-400 dark:text-stone-500">Pnyx · Athens</p>
          </Link>
          <button
            onClick={toggle}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="w-9 h-9 flex items-center justify-center rounded-xl
                       hover:bg-stone-100 dark:hover:bg-stone-800
                       text-stone-400 dark:text-stone-500
                       hover:text-stone-700 dark:hover:text-stone-200
                       transition-colors"
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
        {showProgress && currentStop !== undefined && totalStops !== undefined && (
          <div className="mt-2 max-w-lg mx-auto">
            <ProgressBar current={currentStop} total={totalStops} />
          </div>
        )}
      </header>

      <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">
        {children}
      </main>

      <footer className="bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 px-4 py-5">
        <nav className="flex justify-center gap-5 mb-2" aria-label="Legal">
          {[
            { to: '/privacy', label: 'Privacy' },
            { to: '/terms', label: 'Terms' },
            { to: '/cookies', label: 'Cookies' },
          ].map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="text-xs text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>
        <p className="text-xs text-stone-300 dark:text-stone-700 text-center">
          Democracy Walk · Independent educational project
        </p>
      </footer>
    </div>
  )
}

function MoonIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )
}
