import { useTranslation } from 'react-i18next'
import type { Stop } from '@/lib/types'

// Chapter title/description are stored single-language (English) in Supabase;
// for every other UI language the i18n `stops.*` translations are the display
// source. Audio comes from the row's audio_urls[lang] when a recording exists
// for the current language, otherwise the English/default audio_url. Images,
// ids and ordering always come from the Stop rows.
export function useLocalizedStops(stops: Stop[]): Stop[] {
  const { t, i18n } = useTranslation()
  if (i18n.language === 'en') return stops
  return stops.map((stop) => ({
    ...stop,
    title: t(`stops.stop${stop.order_index}.title`, { defaultValue: stop.title }),
    description: t(`stops.stop${stop.order_index}.description`, {
      defaultValue: stop.description,
    }),
    subtitle: t(`stops.stop${stop.order_index}.subtitle`, { defaultValue: stop.subtitle ?? '' }),
    transcript: t(`stops.stop${stop.order_index}.transcript`, { defaultValue: stop.transcript ?? '' }),
    audio_url: stop.audio_urls?.[i18n.language] || stop.audio_url,
  }))
}
