import { Link } from 'react-router-dom'
import ProgressBar from './ProgressBar'

interface LayoutProps {
  children: React.ReactNode
  showProgress?: boolean
  currentStop?: number
  totalStops?: number
}

export default function Layout({ children, showProgress, currentStop, totalStops }: LayoutProps) {
  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <header className="bg-white border-b border-stone-200 px-4 py-3 sticky top-0 z-10">
        <Link to="/" className="block text-center">
          <h1 className="font-serif text-lg font-bold text-stone-800">Democracy Walk</h1>
          <p className="text-xs text-stone-400">Pnyx · Athens</p>
        </Link>
        {showProgress && currentStop !== undefined && totalStops !== undefined && (
          <div className="mt-2">
            <ProgressBar current={currentStop} total={totalStops} />
          </div>
        )}
      </header>

      <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">
        {children}
      </main>

      <footer className="bg-white border-t border-stone-200 px-4 py-4">
        <nav className="flex justify-center gap-5 text-xs text-stone-400" aria-label="Legal">
          <Link to="/privacy" className="hover:text-stone-600 transition-colors">Privacy</Link>
          <Link to="/terms" className="hover:text-stone-600 transition-colors">Terms</Link>
          <Link to="/cookies" className="hover:text-stone-600 transition-colors">Cookies</Link>
        </nav>
        <p className="text-xs text-stone-300 text-center mt-2">
          Democracy Walk is an independent educational project.
        </p>
      </footer>
    </div>
  )
}
