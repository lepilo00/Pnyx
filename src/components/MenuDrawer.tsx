import { useEffect, useId, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from './LanguageSwitcher'
import FlagIcon from './FlagIcon'
import { LANGUAGES } from '@/data/languages'
import { GOOGLE_MAPS_DIRECTIONS_URL } from '@/lib/constants'
import { useTheme } from '@/lib/theme'
import './MenuDrawer.css'

interface MenuDrawerProps {
  isOpen: boolean
  onClose: () => void
  returnFocusRef?: React.RefObject<HTMLButtonElement | null>
}

type IconName = 'pin' | 'headphones' | 'temple' | 'steps' | 'people' | 'heart' | 'mail'

interface MenuEntry {
  to: string
  labelKey: string
  descriptionKey: string
  icon: IconName
  external?: boolean
}

const PRIMARY_LINKS: MenuEntry[] = [
  { to: GOOGLE_MAPS_DIRECTIONS_URL, labelKey: 'menu.getDirections', descriptionKey: 'menu.descriptions.directions', icon: 'pin', external: true },
  { to: '/premium', labelKey: 'menu.goDeeper', descriptionKey: 'menu.descriptions.premium', icon: 'headphones' },
  { to: '/about', labelKey: 'menu.aboutPnyx', descriptionKey: 'menu.descriptions.about', icon: 'temple' },
  { to: '/how-it-works', labelKey: 'menu.howItWorks', descriptionKey: 'menu.descriptions.how', icon: 'steps' },
]

const SECONDARY_LINKS: MenuEntry[] = [
  { to: '/story', labelKey: 'menu.ourStory', descriptionKey: 'menu.descriptions.story', icon: 'people' },
  { to: '/support', labelKey: 'menu.support', descriptionKey: 'menu.descriptions.support', icon: 'heart' },
  { to: '/contact', labelKey: 'menu.contact', descriptionKey: 'menu.descriptions.contact', icon: 'mail' },
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
    const timeout = window.setTimeout(() => setRendered(isOpen), isOpen ? 0 : 280)
    return () => window.clearTimeout(timeout)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const returnFocusElement = returnFocusRef?.current
    previousOverflowRef.current = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab' || !panelRef.current) return
      const focusable = [...panelRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')]
        .filter((element) => !element.hasAttribute('hidden') && element.getClientRects().length > 0)
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
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
          <div className="menu-header-actions">
            <div className="menu-language-wrap">
              <button className="menu-language-button" onClick={() => setLanguageOpen((value) => !value)} aria-expanded={languageOpen} aria-controls={languageId} aria-haspopup="menu">
                <FlagIcon code={currentLanguage.flag} className="menu-language-flag" />
                <span>{currentLanguage.label}</span><Chevron open={languageOpen} />
              </button>
              {languageOpen && <div id={languageId} className="menu-language-popover"><LanguageSwitcher onSelect={() => setLanguageOpen(false)} /></div>}
            </div>
            <button ref={closeButtonRef} className="menu-close" onClick={close} aria-label={t('menu.closeAria')}><CloseIcon /></button>
          </div>
          <h2 id="menu-title" className="sr-only">{t('menu.title')}</h2>
        </header>

        <nav className="menu-scroll" aria-label={t('menu.title')}>
          <button className="menu-primary-cta" onClick={() => openRoute('/start')}><PlayIcon />{t('menu.startFree')}</button>
          <div className="menu-group">
            {PRIMARY_LINKS.map((entry) => <MenuItem key={entry.to} entry={entry} active={!entry.external && location.pathname === entry.to} t={t} close={close} openRoute={openRoute} />)}
          </div>
          <div className="menu-group menu-group-separated">
            {SECONDARY_LINKS.map((entry) => <MenuItem key={entry.to} entry={entry} active={location.pathname === entry.to} t={t} close={close} openRoute={openRoute} />)}
            <button className="menu-item" onClick={() => void share()}>
              <IconCircle><ShareIcon /></IconCircle><span className="menu-item-copy"><strong>{t('menu.share')}</strong><small>{t('menu.descriptions.share')}</small></span><ArrowIcon />
            </button>
            <p className="menu-share-status" role="status" aria-live="polite">{shareStatus}</p>
          </div>

          <div className="menu-settings">
            <button className="menu-setting-row" onClick={toggle} role="switch" aria-checked={isDark}>
              <MoonIcon /><span>{t('menu.darkMode')}</span><span className={`menu-switch ${isDark ? 'is-on' : ''}`} aria-hidden="true"><i /></span>
            </button>
            <button className="menu-setting-row" onClick={() => setLegalOpen((value) => !value)} aria-expanded={legalOpen} aria-controls={legalId}>
              <ShieldIcon /><span>{t('menu.legalPrivacy')}</span><Chevron open={legalOpen} />
            </button>
            <div id={legalId} className={`menu-legal ${legalOpen ? 'is-open' : ''}`}>
              <div>{LEGAL_LINKS.map(({ to, key }) => <Link key={to} to={to} onClick={close} aria-current={location.pathname === to ? 'page' : undefined}><i aria-hidden="true" />{t(key)}<ArrowIcon /></Link>)}</div>
            </div>
          </div>
        </nav>
      </div>
    </div>
  )
}

function MenuItem({ entry, active, t, close, openRoute }: { entry: MenuEntry; active: boolean; t: (key: string) => string; close: () => void; openRoute: (to: string) => void }) {
  const content = <><IconCircle><MenuIcon name={entry.icon} /></IconCircle><span className="menu-item-copy"><strong>{t(entry.labelKey)}</strong><small>{t(entry.descriptionKey)}</small></span><ArrowIcon /></>
  if (entry.external) return <a className="menu-item" href={entry.to} target="_blank" rel="noreferrer" onClick={close}>{content}</a>
  return <button className={`menu-item ${active ? 'is-active' : ''}`} onClick={() => active ? close() : openRoute(entry.to)} aria-current={active ? 'page' : undefined}>{content}</button>
}

const IconCircle = ({ children }: { children: React.ReactNode }) => <span className="menu-icon-circle">{children}</span>
const Svg = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
function MenuIcon({ name }: { name: IconName }) { const paths: Record<IconName, React.ReactNode> = { pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>, headphones: <><path d="M4 14v-2a8 8 0 0 1 16 0v2"/><path d="M4 14h3v6H5a1 1 0 0 1-1-1v-5Zm16 0h-3v6h2a1 1 0 0 0 1-1v-5Z"/></>, temple: <><path d="m3 9 9-5 9 5M5 20h14M7 9v8m5-8v8m5-8v8"/></>, steps: <path d="M5 20h4v-5h4v-5h4V5h3"/>, people: <><circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2m1-14a3 3 0 0 1 0 6m1 2a5 5 0 0 1 4 5"/></>, heart: <path d="M20.8 5.6a5.5 5.5 0 0 0-7.8 0L12 6.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 22l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>, mail: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></> }; return <Svg>{paths[name]}</Svg> }
function Chevron({ open }: { open: boolean }) { return <Svg className={`menu-chevron ${open ? 'is-open' : ''}`}><path d="m8 10 4 4 4-4"/></Svg> }
function ArrowIcon() { return <Svg className="menu-arrow"><path d="m9 6 6 6-6 6"/></Svg> }
function CloseIcon() { return <Svg><path d="M6 6l12 12M18 6 6 18"/></Svg> }
function PlayIcon() { return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m8 5 11 7-11 7V5Z"/></svg> }
function ShareIcon() { return <Svg><circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.3 10.8 7.4-4.5m-7.4 6.9 7.4 4.5"/></Svg> }
function MoonIcon() { return <Svg><path d="M20 15.5A9 9 0 0 1 8.5 4 9 9 0 1 0 20 15.5Z"/><path d="m17 3 .5 1.5L19 5l-1.5.5L17 7l-.5-1.5L15 5l1.5-.5L17 3Z"/></Svg> }
function ShieldIcon() { return <Svg><path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/></Svg> }
