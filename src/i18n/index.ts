import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'

export const SUPPORTED_LOCALES = ['en', 'fr', 'es', 'de', 'zh', 'el', 'sl', 'it', 'hr', 'sr'] as const
export type Locale = (typeof SUPPORTED_LOCALES)[number]

const DEFAULT_LOCALE: Locale = 'en'
const STORAGE_KEY = 'dw-locale'
const localeLoaders: Record<Exclude<Locale, 'en'>, () => Promise<{ default: typeof en }>> = {
  fr: () => import('./locales/fr.json'),
  es: () => import('./locales/es.json'),
  de: () => import('./locales/de.json'),
  zh: () => import('./locales/zh.json'),
  el: () => import('./locales/el.json'),
  sl: () => import('./locales/sl.json'),
  it: () => import('./locales/it.json'),
  hr: () => import('./locales/hr.json'),
  sr: () => import('./locales/sr.json'),
}

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

const initialLocale = getInitialLocale()

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export async function changeLocale(locale: Locale): Promise<void> {
  if (locale !== 'en' && !i18n.hasResourceBundle(locale, 'translation')) {
    const bundle = await localeLoaders[locale]()
    i18n.addResourceBundle(locale, 'translation', bundle.default, true, true)
  }
  await i18n.changeLanguage(locale)
}

document.documentElement.lang = initialLocale
if (initialLocale !== 'en') void changeLocale(initialLocale)

i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng
  try {
    localStorage.setItem(STORAGE_KEY, lng)
  } catch {
    // ignore
  }
})

export default i18n
