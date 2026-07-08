import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from './supabaseClient'
import { withTimeout } from './withTimeout'

interface IntroAudioRow {
  intro_audio_url: string | null
  intro_audio_urls: Record<string, string> | null
}

// Landing-page intro audio for the current UI language, with the
// English/default track as fallback. Returns '' while loading or when
// no intro audio is configured (callers hide the player then).
export function useIntroAudio(): string {
  const { i18n } = useTranslation()
  const [row, setRow] = useState<IntroAudioRow | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const result = await withTimeout(
        supabase
          .from('walks')
          .select('intro_audio_url,intro_audio_urls')
          .limit(1)
          .maybeSingle(),
        3000
      )
      if (!cancelled && result && !result.error && result.data) {
        setRow(result.data as IntroAudioRow)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  if (!row) return ''
  const localized = i18n.language !== 'en' ? row.intro_audio_urls?.[i18n.language] : undefined
  return localized || row.intro_audio_url || ''
}
