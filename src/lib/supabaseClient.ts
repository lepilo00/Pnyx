import { createClient } from '@supabase/supabase-js'

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || ''
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || ''

// Newer supabase-js versions throw when the URL is empty, so demo mode
// (no env configured) uses an unreachable placeholder instead — queries
// fail gracefully and the app renders with fallback data.
export const supabase = createClient(
  supabaseUrl || 'https://demo-mode.invalid',
  supabaseAnonKey || 'demo-mode'
)
