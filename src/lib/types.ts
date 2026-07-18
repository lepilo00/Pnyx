export interface Walk {
  id: string
  title: string
  slug: string
  description: string
  subtitle?: string
  cover_image_url?: string
  available_languages?: string[]
  default_language?: string
  stripe_product_id?: string
  price?: number
  completion_message?: string
  bonus_section_title?: string
  bonus_section_description?: string
  localized_content?: Record<string, Partial<Pick<Walk, 'title' | 'subtitle' | 'description' | 'completion_message' | 'bonus_section_title' | 'bonus_section_description'>>>
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
  subtitle?: string
  transcript?: string
  duration_seconds?: number
  story_type?: 'introduction' | 'main' | 'bonus'
  audio_url?: string
  /** Per-language audio URLs keyed by locale code (e.g. { sl: "https://…" }); audio_url is the English/default track */
  audio_urls?: Record<string, string> | null
  image_url?: string
  latitude?: number
  longitude?: number
  is_published: boolean
  /** Paid chapter: locked until the visitor unlocks (donation or one-time payment). Missing/false = free. */
  is_paid?: boolean
  /** Bonus story: not part of the numbered walk, shown only in the premium/unlocked section. */
  is_bonus?: boolean
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
  | 'support_screen_shown'
  | 'donation_unlock'
  | 'paywall_shown'
  | 'unlock_confirmed'
