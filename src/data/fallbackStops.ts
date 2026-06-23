import { useTranslation } from 'react-i18next'
import type { Stop } from '@/lib/types'

const STOP_META = [
  {
    id: 'stop-1',
    order_index: 1,
    audio_url: 'https://mnyapsdxybkpmxkucjbb.supabase.co/storage/v1/object/public/audio_stop1/pnyx_audio_stop1.mp3',
  },
  { id: 'stop-2', order_index: 2, audio_url: undefined },
  { id: 'stop-3', order_index: 3, audio_url: undefined },
  { id: 'stop-4', order_index: 4, audio_url: undefined },
] as const

export function useFallbackStops(): Stop[] {
  const { t } = useTranslation()
  return STOP_META.map((meta) => ({
    id: meta.id,
    walk_id: 'walk-pnyx',
    order_index: meta.order_index,
    title: t(`stops.stop${meta.order_index}.title`),
    description: t(`stops.stop${meta.order_index}.description`),
    audio_url: meta.audio_url,
    is_published: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }))
}
