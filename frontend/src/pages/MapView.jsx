import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { getImageUrl } from '../utils/image'
import useWindowSize from '../hooks/useWindowSize'

// GB region coordinates
const GB_CENTER = [35.8884, 74.4584]
const GB_ZOOM = 7

// Known coordinates for GB locations
const LOCATION_COORDS = {
  gilgit: [35.9221, 74.3085],
  hunza: [36.3167, 74.65],
  skardu: [35.2971, 75.6333],
  nagar: [36.25, 74.6167],
  ghizer: [36.2, 73.45],
  diamer: [35.5, 73.9],
  astore: [35.3667, 74.8667],
  shigar: [35.5, 75.6167],
  kharmang: [35.1833, 76.15],
  roundu: [35.5167, 73.8],
  passu: [36.4667, 74.8667],
  karimabad: [36.3167, 74.65],
  gulmit: [36.4333, 74.8167],
  naltar: [36.1667, 74.1833],
  'fairy meadows': [35.3833, 74.6],
  deosai: [34.9167, 75.4],
  khunjerab: [36.85, 75.4333],
}

function getCoords(location) {
  if (!location) return null
  const lower = location.toLowerCase()
  for (const [key, coords] of Object.entries(LOCATION_COORDS)) {
    if (lower.includes(key)) return coords
  }
  return [
    GB_CENTER[0] + (Math.random() - 0.5) * 2,
    GB_CENTER[1] + (Math.random() - 0.5) * 3,
  ]
}

function getServiceColor(type) {
  switch (type) {
    case 'hotel':
      return '#2563eb'
    case 'tour':
      return '#16a34a'
    case 'transport':
      return '#d97706'
    case 'activity':
      return '#7c3aed'
    default:
      return '#0ea5e9'
  }
}

function getServiceEmoji(type) {
  switch (type) {
    case 'hotel':
      return '🏨'
    case 'tour':
      return '🏔️'
    case 'transport':
      return '🚐'
    case 'activity':
      return '🎯'
    default:
      return '📍'
  }
}

export default function MapView() {
  const { isMobile } = useWindowSize()
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState('')
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])
  const navigate = useNavigate()

  useEffect(() => {
    fetchListings()
    loadLeaflet()
  }, [])

  async function fetchListings() {
    try {
      const res = await api.get('/listings')
      setListings(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  function loadLeaflet() {
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }
    if (!document.getElementById('leaflet-js')) {
      const script = document.createElement('script')
      script.id = 'leaflet-js'
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.onload = () => initMap()
      document.head.appendChild(script)
    } else if (window.L) {
      initMap()
    }
  }

  function initMap() {
    if (mapInstanceRef.current || !mapRef.current) return
    const L = window.L
    const map = L.map(mapRef.current, {
      center: GB_CENTER,
      zoom: GB_ZOOM,
      zoomControl: true,
    })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map)
    mapInstanceRef.current = map
  }

  useEffect(() => {
    if (listings.length === 0) return
    const interval = setInterval(() => {
      if (!window.L || !mapInstanceRef.current) return
      clearInterval(interval)
      addMarkers()
    }, 100)
    return () => clearInterval(interval)
  }, [listings, filter])

  function addMarkers() {
    const L = window.L
    const map = mapInstanceRef.current
    if (!L || !map) return

    markersRef.current.forEach((m) => map.removeLayer(m))
    markersRef.current = []

    const filtered = filter
      ? listings.filter((l) => l.service_type === filter)
      : listings

    filtered.forEach((listing) => {
      const coords = getCoords(listing.location)
      if (!coords) return

      const color = getServiceColor(listing.service_type)
      const emoji = getServiceEmoji(listing.service_type)

      const icon = L.divIcon({
        className: '',
        html: '<div style="'
          + 'background:' + color + ';'
          + 'color:white;'
          + 'border-radius:50% 50% 50% 0;'
          + 'transform:rotate(-45deg);'
          + 'width:32px;height:32px;'
          + 'display:flex;align-items:center;'
          + 'justify-content:center;'
          + 'box-shadow:0 2px 8px rgba(0,0,0,0.3);'
          + 'border:2px solid white;'
          + 'font-size:0.9rem;">'
          + '<span style="transform:rotate(45deg)">'
          + emoji
          + '</span>'
          + '</div>',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      })

      const marker = L.marker(coords, { icon })

      const ratingText = listing.average_rating
        ? listing.average_rating.toFixed(1) + ' stars'
        : 'No reviews'

      const price = listing.price_per_night
        ?.toLocaleString('en-PK') || '0'

      const imgSrc = listing.image_url
        ? 'http://127.0.0.1:8000/uploads/' + listing.image_url
        : 'https://placehold.co/220x120/e5e7eb/9ca3af?text=GB'

      const popupHtml = '<div style="font-family:system-ui,sans-serif;'
        + 'min-width:180px">'
        + '<img src="' + imgSrc + '"'
        + ' style="width:100%;height:90px;object-fit:cover;'
        + 'border-radius:6px;margin-bottom:8px;display:block"'
        + ' onerror="this.onerror=null;this.src='
        + "'https://placehold.co/220x90/e5e7eb/9ca3af?text=GB'\""
        + '/>'
        + '<div style="font-weight:700;font-size:0.875rem;'
        + 'color:#111827;margin-bottom:4px">'
        + listing.title
        + '</div>'
        + '<div style="font-size:0.78rem;color:#6b7280;'
        + 'margin-bottom:4px">Location: '
        + listing.location
        + '</div>'
        + '<div style="display:flex;justify-content:space-between;'
        + 'align-items:center;margin-bottom:8px">'
        + '<span style="font-weight:700;color:#0ea5e9;'
        + 'font-size:0.85rem">PKR ' + price + '/night</span>'
        + '<span style="font-size:0.78rem;color:#6b7280">'
        + ratingText + '</span>'
        + '</div>'
        + '<a href="/listing/' + listing.id + '"'
        + ' onclick="event.preventDefault();'
        + 'window.location.href=\'/listing/' + listing.id + '\'"'
        + ' style="display:block;text-align:center;'
        + 'background:#0ea5e9;color:white;padding:7px;'
        + 'border-radius:6px;text-decoration:none;'
        + 'font-size:0.85rem;font-weight:600">'
        + 'View Details'
        + '</a>'
        + '</div>'

      const popup = L.popup({ maxWidth: 220 })
        .setContent(popupHtml)

      marker.bindPopup(popup)
      marker.on('click', () => setSelected(listing))
      marker.addTo(map)
      markersRef.current.push(marker)
    })

    // Force map to recalculate size
    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize()
      }
    }, 50)
  }

  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (mapInstanceRef.current) {
      setTimeout(() => {
        mapInstanceRef.current.invalidateSize()
      }, 100)
    }
  }, [isMobile])

  const filteredListings = filter
    ? listings.filter((l) => l.service_type === filter)
    : listings

  const SERVICE_TYPES = [
    { value: '', label: 'All', emoji: '🗺️' },
    { value: 'hotel', label: 'Hotels', emoji: '🏨' },
    { value: 'tour', label: 'Tours', emoji: '🏔️' },
    { value: 'transport', label: 'Transport', emoji: '🚐' },
    { value: 'activity', label: 'Activities', emoji: '🎯' },
  ]

  return (
    <div
      style={{
        background: 'var(--bg-primary)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, #1e3a5f 0%, #0ea5e9 100%)',
          padding: '20px 16px',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <h1
              style={{
                color: 'white',
                margin: '0 0 4px',
                fontSize: '1.5rem',
                fontWeight: 800,
              }}
            >
              📍 Explore on Map
            </h1>
            <p
              style={{
                color: 'rgba(255,255,255,0.8)',
                margin: 0,
                fontSize: '0.875rem',
              }}
            >
              {filteredListings.length} services across Gilgit-Baltistan
            </p>
          </div>
          <div
            style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
              justifyContent: isMobile ? 'flex-start' : 'flex-end',
            }}
          >
            {SERVICE_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setFilter(t.value)}
                style={{
                  background:
                    filter === t.value
                      ? 'white'
                      : 'rgba(255,255,255,0.2)',
                  color: filter === t.value ? '#1e3a5f' : 'white',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '999px',
                  padding: '6px 14px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                }}
              >
                {t.emoji} {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div
          style={{
            flex: 1,
            maxWidth: '1200px',
            width: '100%',
            margin: '0 auto',
            padding: isMobile ? '12px' : '16px',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: '16px',
            alignItems: 'flex-start',
          }}
        >
          {/* Map container */}
          <div
            style={{
              flex: isMobile ? 'none' : 1,
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-md)',
              height: isMobile ? '350px' : '600px',
              minHeight: isMobile ? '350px' : '600px',
              maxHeight: isMobile ? '350px' : '600px',
              position: 'relative',
              width: isMobile ? '100%' : 'auto',
            }}
          >
            {loading && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1000,
                  background: 'var(--bg-card)',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ fontSize: '2.5rem' }}>🗺️</div>
                <p
                  style={{
                    color: 'var(--text-secondary)',
                    margin: 0,
                  }}
                >
                  Loading map...
                </p>
              </div>
            )}
            <div
              ref={mapRef}
              style={{
                width: '100%',
                height: '100%',
                minHeight: isMobile ? '350px' : '600px',
              }}
            />
          </div>

          {/* Sidebar */}
          <div
            style={{
              width: isMobile ? '100%' : '300px',
              flexShrink: 0,
            }}
          >
            <p
              style={{
                margin: '0 0 10px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
              }}
            >
              {filteredListings.length} results
            </p>

            {isMobile ? (
              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  overflowX: 'auto',
                  paddingBottom: '8px',
                  WebkitOverflowScrolling: 'touch',
                }}
              >
                {filteredListings.map((listing) => (
                  <div
                    key={listing.id}
                    onClick={() =>
                      navigate(`/listing/${listing.id}`)
                    }
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      flexShrink: 0,
                      width: '180px',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <img
                      src={
                        listing.image_url
                          ? 'http://127.0.0.1:8000/uploads/' +
                              listing.image_url
                          : 'https://placehold.co/180x90/e5e7eb/9ca3af?text=GB'
                      }
                      alt={listing.title}
                      onError={(e) => {
                        e.target.onerror = null
                        e.target.src =
                          'https://placehold.co/180x90/e5e7eb/9ca3af?text=GB'
                      }}
                      style={{
                        width: '100%',
                        height: '85px',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                    <div style={{ padding: '8px 10px' }}>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          color: 'var(--text-primary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          marginBottom: '2px',
                        }}
                      >
                        {listing.title}
                      </div>
                      <div
                        style={{
                          fontSize: '0.7rem',
                          color: 'var(--text-secondary)',
                          marginBottom: '3px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        📍 {listing.location}
                      </div>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: 'var(--accent)',
                        }}
                      >
                        PKR{' '}
                        {listing.price_per_night?.toLocaleString(
                          'en-PK',
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  overflowY: 'auto',
                  maxHeight: '650px',
                }}
              >
                {filteredListings.map((listing) => (
                  <div
                    key={listing.id}
                    onClick={() =>
                      navigate(`/listing/${listing.id}`)
                    }
                    style={{
                      background:
                        selected?.id === listing.id
                          ? 'var(--accent-light)'
                          : 'var(--bg-card)',
                      border:
                        selected?.id === listing.id
                          ? '2px solid var(--accent)'
                          : '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '10px',
                      cursor: 'pointer',
                      display: 'flex',
                      gap: '10px',
                      alignItems: 'flex-start',
                    }}
                  >
                    <img
                      src={
                        listing.image_url
                          ? 'http://127.0.0.1:8000/uploads/' +
                              listing.image_url
                          : 'https://placehold.co/64x64/e5e7eb/9ca3af?text=GB'
                      }
                      alt={listing.title}
                      onError={(e) => {
                        e.target.onerror = null
                        e.target.src =
                          'https://placehold.co/64x64/e5e7eb/9ca3af?text=GB'
                      }}
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: '6px',
                        objectFit: 'cover',
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: '0.825rem',
                          color: 'var(--text-primary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          marginBottom: '2px',
                        }}
                      >
                        {getServiceEmoji(listing.service_type)}{' '}
                        {listing.title}
                      </div>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-secondary)',
                          marginBottom: '2px',
                        }}
                      >
                        📍 {listing.location}
                      </div>
                      <div
                        style={{
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          color: 'var(--accent)',
                        }}
                      >
                        PKR{' '}
                        {listing.price_per_night?.toLocaleString(
                          'en-PK',
                        )}
                        /night
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

