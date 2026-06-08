import { supabase } from './supabaseClient'
import type { AnalyticsEventName } from './types'

interface TrackExtras {
  stop_id?: string
  metadata?: Record<string, unknown>
}

// Fire-and-forget — analytics must never break the app
export async function track(
  eventName: AnalyticsEventName,
  pagePath: string,
  extras?: TrackExtras
): Promise<void> {
  try {
    await supabase.from('analytics_events').insert({
      event_name: eventName,
      page_path: pagePath,
      stop_id: extras?.stop_id ?? null,
      metadata: extras?.metadata ?? null,
    })
  } catch {
    // Intentionally swallowed
  }
}
