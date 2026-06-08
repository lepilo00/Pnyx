import 'leaflet/dist/leaflet.css'
import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'

// Fix Leaflet's broken default icon URLs in Vite/webpack
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const PNYX: L.LatLngTuple = [37.9715, 23.7196]

const pnyxIcon = L.divIcon({
  html: `<div style="width:28px;height:28px;background:#d97706;border:3px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 8px rgba(0,0,0,0.35)"></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  className: '',
})

const userIcon = L.divIcon({
  html: `<div style="width:14px;height:14px;background:#3b82f6;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(59,130,246,0.5)"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
  className: '',
})

interface FitBoundsProps {
  userPos: L.LatLngTuple | null
}

function FitBounds({ userPos }: FitBoundsProps) {
  const map = useMap()
  const hasFit = useRef(false)

  useEffect(() => {
    if (userPos && !hasFit.current) {
      hasFit.current = true
      map.fitBounds(L.latLngBounds([userPos, PNYX]), { padding: [48, 48], maxZoom: 17 })
    } else if (!userPos && !hasFit.current) {
      map.setView(PNYX, 15)
    }
  }, [map, userPos])

  return null
}

interface MapNavigationProps {
  userLat: number | null
  userLon: number | null
  accuracy: number | null
}

export default function MapNavigation({ userLat, userLon, accuracy }: MapNavigationProps) {
  const userPos: L.LatLngTuple | null =
    userLat !== null && userLon !== null ? [userLat, userLon] : null

  return (
    <MapContainer
      center={PNYX}
      zoom={15}
      scrollWheelZoom
      className="w-full h-72"
      style={{ zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Pnyx destination */}
      <Marker position={PNYX} icon={pnyxIcon}>
        <Popup>
          <strong>Pnyx Hill</strong>
          <br />
          Birthplace of democracy
        </Popup>
      </Marker>

      {/* User location + accuracy ring */}
      {userPos && (
        <>
          <Marker position={userPos} icon={userIcon}>
            <Popup>You are here</Popup>
          </Marker>
          {accuracy !== null && accuracy < 500 && (
            <Circle
              center={userPos}
              radius={accuracy}
              pathOptions={{
                color: '#3b82f6',
                fillColor: '#3b82f6',
                fillOpacity: 0.1,
                weight: 1,
                dashArray: '4 4',
              }}
            />
          )}
        </>
      )}

      <FitBounds userPos={userPos} />
    </MapContainer>
  )
}
