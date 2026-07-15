import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { withTimeout } from './withTimeout'
import { DEFAULT_UNLOCK_PRICE_EUR } from './constants'

// One-time unlock price from the app_settings table (key 'unlock_price_eur',
// jsonb number). Falls back to the built-in default while loading, on error,
// or when Supabase is not configured.
export function useUnlockPrice(): number {
  const [price, setPrice] = useState(DEFAULT_UNLOCK_PRICE_EUR)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const result = await withTimeout(
        supabase.from('app_settings').select('value').eq('key', 'unlock_price_eur').maybeSingle(),
        3000
      )
      const value = result && !result.error ? Number(result.data?.value) : NaN
      if (!cancelled && Number.isFinite(value) && value > 0) {
        setPrice(value)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  return price
}
