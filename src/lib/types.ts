export interface Walk {
  id: string
  title: string
  slug: string
  description: string
  location_name: string
  duration_minutes: number
  is_published: boolean
  created_at: string
  updated_at: string
}

export interface Stop {
  id: string
  walk_id: string
  order_index: number
  title: string
  description: string
  audio_url?: string
  image_url?: string
  latitude?: number
  longitude?: number
  is_published: boolean
  created_at: string
  updated_at: string
}

export interface EmailSignup {
  id: string
  email: string
  source: string
  consent: boolean
  created_at: string
}

export interface Feedback {
  id: string
  rating?: number
  message?: string
  would_pay?: 'yes' | 'maybe' | 'no'
  created_at: string
}

export interface AnalyticsEvent {
  id: string
  event_name: string
  page_path: string
  stop_id?: string
  metadata?: Record<string, unknown>
  created_at: string
}

export type AnalyticsEventName =
  | 'landing_page_view'
  | 'start_walk_clicked'
  | 'stop_opened'
  | 'stop_audio_started'
  | 'stop_completed'
  | 'walk_completed'
  | 'email_signup_submitted'
  | 'feedback_submitted'
  | 'would_pay_answered'
  | 'destination_arrived'
  | 'donation_prompt_shown'
  | 'donation_amount_selected'
