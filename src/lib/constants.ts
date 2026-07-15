export const PNYX = { lat: 37.9715, lon: 23.7196 }

export const GOOGLE_MAPS_DIRECTIONS_URL =
  `https://www.google.com/maps/dir/?api=1&destination=${PNYX.lat},${PNYX.lon}&travelmode=walking`

export const STREET_VIEW_URL =
  `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${PNYX.lat},${PNYX.lon}`

// Encoded into the donation QR code (EPC069-12 / SEPA credit transfer).
// The IBAN below is a placeholder — replace with the real account before launch,
// otherwise banking apps will reject the scanned code.
export const DONATION = {
  recipientName: 'PNYX Athens',
  iban: 'SI56 0000 0000 0000 000',
  remittanceText: 'PNYX Athens support',
}

// One-time full-experience unlock (honor system, same SEPA QR flow as donations).
export const UNLOCK = {
  remittanceText: 'PNYX Athens unlock',
}

// Used until app_settings.unlock_price_eur is fetched (or when Supabase is unavailable).
export const DEFAULT_UNLOCK_PRICE_EUR = 5.9

// Placeholder — replace with the real inbox before launch (same as the IBAN above).
export const CONTACT_EMAIL = 'hello@pnyx-athens.example'
