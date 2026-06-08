import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string ?? ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string ?? ''

// Safe to call with empty strings — queries will fail gracefully,
// allowing the app to render with fallback data in demo mode.
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
