import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { getImageUrl } from '../utils/image'

const SERVICE_COLORS = {
  hotel: '#2563eb', tour: '#16a34a',
  transport: '#d97706', activity: '#7c3aed',
  restaurant: '#e11d48', car_rental: '#0369a1',
  guide: '#059669', camping: '#15803d'
}

export default function RecentlyViewed() {
  const [items, setItems] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    const raw = localStorage.getItem('user')
    if (!raw) return
    api.get('/recently-viewed/')
      .then(r => setItems(r.data || []))
      .catch(() => {})
  }, [])

  if (items.length === 0) return null

  return (
    <div style={{marginBottom: '32px'}}>
      <h3 style={{
        margin: '0 0 14px', fontSize: '1rem',
        fontWeight: 700,
        color: 'var(--text-primary)',
        display: 'flex', alignItems: 'center',
        gap: '8px'
      }}>
        👁️ Recently Viewed
        <span style={{
          fontSize: '0.72rem', fontWeight: 400,
          color: 'var(--text-muted)'
        }}>
          Continue where you left off
        </span>
      </h3>
      <div style={{
        display: 'flex', gap: '12px',
        overflowX: 'auto', paddingBottom: '8px',
        scrollbarWidth: 'none',
        WebkitOverflowScrolling: 'touch'
      }}>
        {items.map(item => {
          const color = SERVICE_COLORS[
            item.service_type
          ] || '#6b7280'
          return (
            <div
              key={item.id}
              onClick={() =>
                navigate(`/listing/${item.id}`)
              }
              style={{
                flexShrink: 0, width: 180,
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                overflow: 'hidden', cursor: 'pointer',
                transition: 'transform 0.15s',
                boxShadow: 'var(--shadow-sm)'
              }}
              onMouseEnter={e =>
                e.currentTarget.style.transform =
                  'translateY(-2px)'
              }
              onMouseLeave={e =>
                e.currentTarget.style.transform =
                  'translateY(0)'
              }
            >
              {/* Image */}
              <div style={{
                height: 100,
                background: color + '18',
                overflow: 'hidden'
              }}>
                <img
                  src={getImageUrl(item.image_url)}
                  alt={item.title}
                  onError={e => {
                    e.target.onerror = null
                    e.target.src =
                      `https://placehold.co/180x100/${
                        color.replace('#','')
                      }/ffffff?text=📷`
                  }}
                  style={{
                    width: '100%', height: '100%',
                    objectFit: 'cover', display: 'block'
                  }}
                />
              </div>

              {/* Info */}
              <div style={{padding: '8px 10px'}}>
                <div style={{
                  fontWeight: 700, fontSize: '0.78rem',
                  color: 'var(--text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  marginBottom: '2px'
                }}>
                  {item.title}
                </div>
                <div style={{
                  fontSize: '0.7rem',
                  color: 'var(--text-muted)',
                  marginBottom: '4px'
                }}>
                  📍 {item.location}
                </div>
                <div style={{
                  fontWeight: 800, color,
                  fontSize: '0.82rem'
                }}>
                  PKR {item.price_per_night
                    ?.toLocaleString('en-PK')}
                  {item.average_rating > 0 && (
                    <span style={{
                      marginLeft: '6px',
                      color: '#f59e0b',
                      fontWeight: 600,
                      fontSize: '0.72rem'
                    }}>
                      ⭐{item.average_rating}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
