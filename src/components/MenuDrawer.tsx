import { useEffect, useId, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from './LanguageSwitcher'
import { LANGUAGES } from '@/data/languages'
import { GOOGLE_MAPS_DIRECTIONS_URL } from '@/lib/constants'
import { useTheme } from '@/lib/theme'
import './MenuDrawer.css'

interface MenuDrawerProps {
  isOpen: boolean
  onClose: () => void
  returnFocusRef?: React.RefObject<HTMLButtonElement | null>
}

interface MenuLink {
  to: string
  labelKey: string
}

const MAIN_LINKS: MenuLink[] = [
  { to: '/support', labelKey: 'menu.support' },
  { to: '/about', labelKey: 'menu.ourStory' },
  { to: '/contact', labelKey: 'menu.contact' },
]

const EXPERIENCE_LINKS: MenuLink[] = [
  { to: '/listen', labelKey: 'menu.aboutPnyx' },
  { to: '/how-it-works', labelKey: 'menu.howItWorks' },
]

const LEGAL_LINKS = [
  { to: '/privacy', key: 'common.footer.privacy' },
  { to: '/terms', key: 'common.footer.terms' },
  { to: '/cookies', key: 'common.footer.cookies' },
]

export default function MenuDrawer({ isOpen, onClose, returnFocusRef }: MenuDrawerProps) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { isDark, toggle } = useTheme()
  const panelRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const previousOverflowRef = useRef('')
  const [legalOpen, setLegalOpen] = useState(false)
  const [languageOpen, setLanguageOpen] = useState(false)
  const [shareStatus, setShareStatus] = useState('')
  const [rendered, setRendered] = useState(isOpen)
  const legalId = useId()
  const languageId = useId()
  const currentLanguage = LANGUAGES.find(({ code }) => code === i18n.language) ?? LANGUAGES[0]

  useEffect(() => {
    const timeout = window.setTimeout(() => setRendered(isOpen), isOpen ? 0 : 270)
    return () => window.clearTimeout(timeout)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const returnFocusElement = returnFocusRef?.current
    previousOverflowRef.current = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); return }
      if (event.key !== 'Tab' || !panelRef.current) return
      const focusable = [...panelRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')]
        .filter((element) => !element.hasAttribute('hidden') && element.getClientRects().length > 0)
      const first = focusable[0]
      const last = focusable.at(-1)
      if (!first || !last) return
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflowRef.current
      returnFocusElement?.focus()
    }
  }, [isOpen, onClose, returnFocusRef])

  if (!rendered) return null

  const close = () => {
    setLegalOpen(false)
    setLanguageOpen(false)
    setShareStatus('')
    onClose()
  }

  const openRoute = (to: string) => {
    close()
    navigate(to)
  }

  const share = async () => {
    const data = { title: t('menu.shareTitle'), text: t('menu.shareText'), url: window.location.origin }
    try {
      if (navigator.share) await navigator.share(data)
      else {
        await navigator.clipboard.writeText(data.url)
        setShareStatus(t('menu.shareCopied'))
        window.setTimeout(() => setShareStatus(''), 3000)
      }
    } catch (error) {
      if ((error as DOMException).name !== 'AbortError') setShareStatus(t('menu.shareFailed'))
    }
  }

  return (
    <div className={`menu-backdrop ${isOpen ? '' : 'is-closing'}`} onPointerDown={(event) => { if (event.target === event.currentTarget) close() }}>
      <div ref={panelRef} className={`menu-panel ${isOpen ? '' : 'is-closing'}`} role="dialog" aria-modal="true" aria-labelledby="menu-title">
        <header className="menu-header">
          <Link to="/" onClick={close} className="menu-brand">
            <span>{t('common.brand.title')}</span><small>{t('common.brand.subtitle')}</small>
          </Link>
          <button ref={closeButtonRef} className="menu-close" onClick={close} aria-label={t('menu.closeAria')}><CloseIcon /></button>
          <h2 id="menu-title" className="sr-only">{t('menu.title')}</h2>
        </header>

        <nav className="menu-scroll" aria-label={t('menu.title')}>
          <div className="menu-actions">
            <button className="menu-primary-cta" onClick={() => openRoute('/listen')}><PlayIcon />{t('menu.startFree')}</button>
            <a className="menu-directions-cta" href={GOOGLE_MAPS_DIRECTIONS_URL} target="_blank" rel="noreferrer" onClick={close}><PinIcon />{t('menu.getDirections')}</a>
          </div>

          <div className="menu-text-group">
            <MenuRoute entry={MAIN_LINKS[0]} currentPath={location.pathname} close={close} openRoute={openRoute} t={t} />
            <button className="menu-text-row" onClick={() => void share()}><span>{t('menu.share')}</span><ShareIcon /></button>
            <p className="menu-share-status" role="status" aria-live="polite">{shareStatus}</p>
            {MAIN_LINKS.slice(1).map((entry) => <MenuRoute key={entry.to} entry={entry} currentPath={location.pathname} close={close} openRoute={openRoute} t={t} />)}
          </div>

          <section className="menu-section" aria-labelledby="menu-experience-title">
            <h3 id="menu-experience-title">
              <button
                className={`menu-section-title ${location.pathname === '/listen' ? 'is-active' : ''}`}
                onClick={() => location.pathname === '/listen' ? close() : openRoute('/listen')}
                aria-current={location.pathname === '/listen' ? 'page' : undefined}
              >
                <span>{t('menu.exploreExperience')}</span>
              </button>
            </h3>
            {EXPERIENCE_LINKS.map((entry) => <MenuRoute key={entry.to} entry={entry} currentPath={location.pathname} close={close} openRoute={openRoute} t={t} />)}
          </section>

          <section className="menu-settings" aria-label={t('menu.languages')}>
            <button className="menu-setting-row" onClick={() => setLanguageOpen((value) => !value)} aria-expanded={languageOpen} aria-controls={languageId}>
              <span>{t('menu.languages')}</span><span className="menu-setting-value">{currentLanguage.code3}</span><Chevron open={languageOpen} />
            </button>
            <div id={languageId} className={`menu-language ${languageOpen ? 'is-open' : ''}`}><div><LanguageSwitcher onSelect={() => setLanguageOpen(false)} /></div></div>
            <button className="menu-setting-row" onClick={toggle} role="switch" aria-checked={isDark}>
              <span>{t('menu.darkMode')}</span><span className={`menu-switch ${isDark ? 'is-on' : ''}`} aria-hidden="true"><i /></span>
            </button>
          </section>

          <section className="menu-bottom">
            <button className="menu-legal-trigger" onClick={() => setLegalOpen((value) => !value)} aria-expanded={legalOpen} aria-controls={legalId}>
              <span>{t('menu.legalPrivacy')}</span><Chevron open={legalOpen} />
            </button>
            <div id={legalId} className={`menu-legal ${legalOpen ? 'is-open' : ''}`}><div>{LEGAL_LINKS.map(({ to, key }) => <Link key={to} to={to} onClick={close} aria-current={location.pathname === to ? 'page' : undefined}>{t(key)}<ArrowIcon /></Link>)}</div></div>
          </section>
        </nav>
      </div>
    </div>
  )
}

function MenuRoute({ entry, currentPath, close, openRoute, t }: { entry: MenuLink; currentPath: string; close: () => void; openRoute: (to: string) => void; t: (key: string) => string }) {
  const active = currentPath === entry.to
  return <button className={`menu-text-row ${active ? 'is-active' : ''}`} onClick={() => active ? close() : openRoute(entry.to)} aria-current={active ? 'page' : undefined}><span>{t(entry.labelKey)}</span></button>
}

const Svg = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
function Chevron({ open }: { open: boolean }) { return <Svg className={`menu-chevron ${open ? 'is-open' : ''}`}><path d="m8 10 4 4 4-4"/></Svg> }
function ArrowIcon() { return <Svg className="menu-arrow"><path d="m9 6 6 6-6 6"/></Svg> }
function CloseIcon() { return <Svg><path d="M6 6l12 12M18 6 6 18"/></Svg> }
function PlayIcon() { return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m8 5 11 7-11 7V5Z"/></svg> }
function PinIcon() { return <Svg><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></Svg> }
function ShareIcon() { return <Svg><path d="M14 4h6v6M20 4l-9 9"/><path d="M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6"/></Svg> }
