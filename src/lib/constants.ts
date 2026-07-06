export const PNYX = { lat: 37.9715, lon: 23.7196 }

export const GOOGLE_MAPS_DIRECTIONS_URL =
  `https://www.google.com/maps/dir/?api=1&destination=${PNYX.lat},${PNYX.lon}&travelmode=walking`

export const STREET_VIEW_URL =
  `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${PNYX.lat},${PNYX.lon}`

// Encoded into the donation QR code (EPC069-12 / SEPA credit transfer).
// The IBAN below is a placeholder — replace with the real account before launch,
// otherwise banking apps will reject the scanned code.
export const DONATION = {
  recipientName: 'Democracy Walk',
  iban: 'SI56 0000 0000 0000 000',
  remittanceText: 'Democracy Walk donation',
}
