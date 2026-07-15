import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import fr from './locales/fr.json'
import es from './locales/es.json'
import de from './locales/de.json'
import zh from './locales/zh.json'
import el from './locales/el.json'
import sl from './locales/sl.json'
import it from './locales/it.json'
import hr from './locales/hr.json'
import sr from './locales/sr.json'

export const SUPPORTED_LOCALES = ['en', 'fr', 'es', 'de', 'zh', 'el', 'sl', 'it', 'hr', 'sr'] as const
export type Locale = (typeof SUPPORTED_LOCALES)[number]

const DEFAULT_LOCALE: Locale = 'en'
const STORAGE_KEY = 'dw-locale'

function getInitialLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && (SUPPORTED_LOCALES as readonly string[]).includes(stored)) {
      return stored as Locale
    }
  } catch {
    // ignore
  }
  // Never browser-detected — English is always the default unless the
  // visitor has explicitly picked a language before.
  return DEFAULT_LOCALE
}

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    fr: { translation: fr },
    es: { translation: es },
    de: { translation: de },
    zh: { translation: zh },
    el: { translation: el },
    sl: { translation: sl },
    it: { translation: it },
    hr: { translation: hr },
    sr: { translation: sr },
  },
  lng: getInitialLocale(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

document.documentElement.lang = getInitialLocale()

i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng
  try {
    localStorage.setItem(STORAGE_KEY, lng)
  } catch {
    // ignore
  }
})

export default i18n
