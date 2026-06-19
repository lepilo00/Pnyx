export const PNYX = { lat: 37.9715, lon: 23.7196 }

export const GOOGLE_MAPS_DIRECTIONS_URL =
  `https://www.google.com/maps/dir/?api=1&destination=${PNYX.lat},${PNYX.lon}&travelmode=walking`

export const STREET_VIEW_URL =
  `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${PNYX.lat},${PNYX.lon}`
