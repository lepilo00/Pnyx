import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import DisclaimerBox from './DisclaimerBox'
import { useTheme } from '@/lib/theme'

interface MenuDrawerProps {
  isOpen: boolean
  onClose: () => void
}

interface DrawerLink {
  to: string
  labelKey: string
  icon: React.ReactNode
}

const DRAWER_LINKS: DrawerLink[] = [
  { to: '/navigate', labelKey: 'menu.getDirections', icon: <PinIcon /> },
  { to: '/about', labelKey: 'menu.aboutPnyx', icon: <TempleIcon /> },
  { to: '/how-it-works', labelKey: 'menu.howItWorks', icon: <GearIcon /> },
  { to: '/premium', labelKey: 'menu.goDeeper', icon: <BookIcon /> },
  { to: '/support', labelKey: 'menu.support', icon: <LeafIcon /> },
]

const DRAWER_LINKS_AFTER_LANGUAGES: DrawerLink[] = [
  { to: '/story', labelKey: 'menu.ourStory', icon: <PersonIcon /> },
  { to: '/contact', labelKey: 'menu.contact', icon: <MailIcon /> },
]

export default function MenuDrawer({ isOpen, onClose }: MenuDrawerProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { isDark, toggle } = useTheme()
  const [legalOpen, setLegalOpen] = useState(false)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!isOpen) return
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null
    closeButtonRef.current?.focus()
    document.body.style.overflow = 'hidden'
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
      previouslyFocusedRef.current?.focus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  if (!isOpen) return null

  const closeDrawer = () => {
    setLegalOpen(false)
    onClose()
  }

  const go = (to: string) => {
    closeDrawer()
    navigate(to)
  }

  const itemClass = `w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-medium
    text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors`

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={closeDrawer}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('menu.title')}
        onClick={(e) => e.stopPropagation()}
        className="w-72 max-w-[85vw] h-full bg-white dark:bg-stone-900 shadow-2xl
                   flex flex-col animate-[drawer-in_0.2s_ease-out]"
      >
        {/* Drawer header */}
        <div className="flex items-start justify-between px-4 pt-4 pb-2 flex-shrink-0">
          <div>
            <p className="font-serif text-lg font-bold text-stone-800 dark:text-stone-100 leading-tight">
              {t('common.brand.title')}
            </p>
            <p className="text-xs text-stone-400 dark:text-stone-500">{t('common.brand.subtitle')}</p>
          </div>
          <button
            ref={closeButtonRef}
            onClick={closeDrawer}
            aria-label={t('menu.closeAria')}
            className="w-9 h-9 flex items-center justify-center rounded-full
                       text-stone-500 dark:text-stone-400
                       hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <button
            onClick={() => go('/start')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-semibold
                       bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition-colors"
          >
            <PlayIcon />
            {t('menu.startFree')}
          </button>

          {DRAWER_LINKS.map(({ to, labelKey, icon }) => (
            <button key={to} onClick={() => go(to)} className={itemClass}>
              <span className="text-stone-400 dark:text-stone-500">{icon}</span>
              {t(labelKey)}
            </button>
          ))}

          {DRAWER_LINKS_AFTER_LANGUAGES.map(({ to, labelKey, icon }) => (
            <button key={to} onClick={() => go(to)} className={itemClass}>
              <span className="text-stone-400 dark:text-stone-500">{icon}</span>
              {t(labelKey)}
            </button>
          ))}

          <button onClick={() => setLegalOpen((value) => !value)} aria-expanded={legalOpen} className={itemClass}>
            <span className="text-stone-400 dark:text-stone-500"><InfoIcon /></span>
            <span className="flex-1">{t('disclaimer.legalLabel')}</span>
            <svg className={`w-3.5 h-3.5 text-stone-400 transition-transform ${legalOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {legalOpen && <div className="px-1 pb-1"><DisclaimerBox variant="legal" /></div>}

          <button onClick={toggle} className={itemClass}>
            <span className="text-stone-400 dark:text-stone-500">
              {isDark ? <SunIcon /> : <MoonIcon />}
            </span>
            {isDark ? t('theme.switchToLight') : t('theme.switchToDark')}
          </button>
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-stone-100 dark:border-stone-800 flex-shrink-0">
          <div className="flex justify-center gap-4 text-xs text-stone-400 dark:text-stone-500">
            <Link to="/privacy" onClick={onClose} className="hover:text-stone-600 dark:hover:text-stone-300 transition-colors">
              {t('common.footer.privacy')}
            </Link>
            <span aria-hidden="true">|</span>
            <Link to="/terms" onClick={onClose} className="hover:text-stone-600 dark:hover:text-stone-300 transition-colors">
              {t('common.footer.terms')}
            </Link>
            <span aria-hidden="true">|</span>
            <Link to="/cookies" onClick={onClose} className="hover:text-stone-600 dark:hover:text-stone-300 transition-colors">
              {t('common.footer.cookies')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function PlayIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

function PinIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function TempleIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l9 5H3l9-5zM5 8v9m4.5-9v9m5-9v9M19 8v9M3 20h18" />
    </svg>
  )
}

function GearIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function BookIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  )
}

function LeafIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 20c4-9 9-13 16-16-1 7-5 12-14 16m-2 0c.5-1.5 1.2-2.8 2-4" />
    </svg>
  )
}

function PersonIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  )
}

function InfoIcon() {
  return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><circle cx="12" cy="12" r="9" /><path strokeLinecap="round" d="M12 11v6M12 7h.01" /></svg>
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
