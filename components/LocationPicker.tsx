'use client'

import 'leaflet/dist/leaflet.css'
import { useEffect, useRef, useState } from 'react'

type Props = {
  lat: number | null
  lng: number | null
  onChange: (lat: number, lng: number) => void
}

// Default center: Doha, Qatar
const DOHA = { lat: 25.2854, lng: 51.5310 }

const ICON_HTML = `
  <div style="
    width:22px;height:22px;border-radius:50%;
    background:#f59e0b;border:3px solid white;
    box-shadow:0 2px 10px rgba(0,0,0,0.45);
    cursor:grab;
  "></div>
`

export default function LocationPicker({ lat, lng, onChange }: Props) {
  const containerRef  = useRef<HTMLDivElement>(null)
  const mapRef        = useRef<any>(null)
  const markerRef     = useRef<any>(null)
  const [locating, setLocating] = useState(false)
  const [locError, setLocError] = useState('')

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    let L: any

    import('leaflet').then(mod => {
      L = mod.default ?? mod

      const center = (lat && lng) ? [lat, lng] : [DOHA.lat, DOHA.lng]

      const map = L.map(containerRef.current, {
        center,
        zoom: 14,
        zoomControl: true,
        attributionControl: false,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map)

      const icon = L.divIcon({
        className: '',
        html: ICON_HTML,
        iconSize:   [22, 22],
        iconAnchor: [11, 11],
      })

      const marker = L.marker(center, { draggable: true, icon }).addTo(map)
      markerRef.current = marker

      const emit = (latlng: { lat: number; lng: number }) => onChange(latlng.lat, latlng.lng)

      marker.on('dragend', () => emit(marker.getLatLng()))
      map.on('click', (e: any) => { marker.setLatLng(e.latlng); emit(e.latlng) })

      mapRef.current = map

      // Auto-locate on first load if no coords given
      if (!lat && !lng && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          pos => {
            const ll = [pos.coords.latitude, pos.coords.longitude]
            map.setView(ll as any, 16)
            marker.setLatLng(ll as any)
            onChange(pos.coords.latitude, pos.coords.longitude)
          },
          () => {} // silently ignore denial
        )
      } else if (lat && lng) {
        emit({ lat, lng })
      }
    })

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }
    }
  }, [])

  function useMyLocation() {
    if (!navigator.geolocation) return
    setLocating(true)
    setLocError('')
    navigator.geolocation.getCurrentPosition(
      pos => {
        const ll = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        if (mapRef.current) {
          mapRef.current.setView([ll.lat, ll.lng], 17)
          markerRef.current?.setLatLng([ll.lat, ll.lng])
        }
        onChange(ll.lat, ll.lng)
        setLocating(false)
      },
      err => {
        setLocError('Location access denied. Please pin your location on the map.')
        setLocating(false)
      }
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative rounded-xl overflow-hidden border border-stone-700" style={{ height: 280 }}>
        <div ref={containerRef} style={{ height: '100%', width: '100%' }} />

        {/* Use my location button — overlaid on the map */}
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          className="absolute bottom-3 left-3 z-[1000] flex items-center gap-2 bg-stone-900/90 backdrop-blur border border-stone-700 hover:border-amber-500 text-stone-300 hover:text-white text-xs font-medium px-3 py-2 rounded-lg transition-all shadow-lg"
        >
          {locating ? (
            <span className="animate-pulse">Locating…</span>
          ) : (
            <><span>📍</span> Use my location</>
          )}
        </button>
      </div>

      {locError && <p className="text-red-400 text-xs">{locError}</p>}
      <p className="text-stone-600 text-xs">Tap the map or drag the pin to your exact delivery spot.</p>
    </div>
  )
}
