import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { getImageUrl } from '../utils/image'
import useWindowSize from '../hooks/useWindowSize'

function getServiceBadge(type) {
  const badges = {
    hotel: { bg: '#2563eb', label: '🏨 Hotel' },
    tour: { bg: '#16a34a', label: '🏔️ Tour' },
    transport: { bg: '#d97706',
                  label: '🚐 Transport' },
    activity: { bg: '#7c3aed',
                 label: '🎯 Activity' },
    restaurant: { bg: '#e11d48',
                   label: '🍽️ Restaurant' },
    car_rental: { bg: '#0369a1',
                   label: '🚗 Car Rental' },
    bike_rental: { bg: '#0891b2',
                    label: '🚲 Bike Rental' },
    jeep_safari: { bg: '#92400e',
                    label: '🚙 Jeep Safari' },
    boat_trip: { bg: '#1d4ed8',
                  label: '🚢 Boat Trip' },
    horse_riding: { bg: '#7c2d12',
                     label: '🐴 Horse Riding' },
    medical: { bg: '#dc2626',
                label: '🏥 Medical' },
    guide: { bg: '#059669',
              label: '🧭 Guide' },
    camping: { bg: '#15803d',
                label: '🏕️ Camping' },
  }
  return badges[type] || { bg: '#6b7280',
                             label: type }
}

function getPriceLabel(type) {
  const perPerson = [
    'tour', 'activity', 'horse_riding',
    'guide', 'boat_trip'
  ]
  const perDay = [
    'car_rental', 'bike_rental',
    'jeep_safari', 'camping'
  ]
  if (perPerson.includes(type)) return '/person'
  if (perDay.includes(type)) return '/day'
  return '/night'
}

export default function Wishlist() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { isMobile } = useWindowSize()

  useEffect(() => {
    api.get('/wishlist/')
      .then(r => setItems(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function removeItem(listingId) {
    try {
      await api.delete(`/wishlist/${listingId}`)
      setItems(prev =>
        prev.filter(i => i.id !== listingId)
      )
    } catch (e) { console.error(e) }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      paddingBottom: '48px'
    }}>

      {/* Header */}
      <div style={{
        background:
          'linear-gradient(135deg, #e11d48 0%, #f97316 100%)',
        padding: '40px 16px 80px'
      }}>
        <div style={{
          maxWidth: '900px', margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          flexWrap: 'wrap', gap: '16px'
        }}>
          <div>
            <h1 style={{
              color: 'white', margin: '0 0 6px',
              fontSize: '1.8rem', fontWeight: 800
            }}>
              ❤️ My Wishlist
            </h1>
            <p style={{
              color: 'rgba(255,255,255,0.75)',
              margin: 0, fontSize: '0.9rem'
            }}>
              {items.length} saved service
              {items.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/listings')}
            style={{
              background: 'white',
              color: '#e11d48', border: 'none',
              borderRadius: '10px',
              padding: '10px 20px',
              cursor: 'pointer', fontWeight: 700,
              fontSize: '0.9rem'
            }}
          >
            Browse More →
          </button>
        </div>
      </div>

      <div style={{
        maxWidth: '900px',
        margin: '-48px auto 0',
        padding: '0 16px'
      }}>

        {loading && (
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            padding: '60px', textAlign: 'center',
            color: 'var(--text-secondary)'
          }}>
            <div style={{
              fontSize: '2rem', marginBottom: '12px'
            }}>❤️</div>
            Loading wishlist...
          </div>
        )}

        {!loading && items.length === 0 && (
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-md)',
            padding: '60px 20px', textAlign: 'center'
          }}>
            <div style={{
              fontSize: '3.5rem', marginBottom: '12px'
            }}>
              💔
            </div>
            <h2 style={{
              margin: '0 0 8px',
              color: 'var(--text-primary)'
            }}>
              Your wishlist is empty
            </h2>
            <p style={{
              margin: '0 0 24px',
              color: 'var(--text-secondary)',
              fontSize: '0.9rem'
            }}>
              Tap ❤️ on any service to save it here
            </p>
            <button
              type="button"
              onClick={() => navigate('/listings')}
              style={{
                background:
                  'linear-gradient(135deg, #e11d48, #f97316)',
                color: 'white', border: 'none',
                borderRadius: '10px',
                padding: '12px 28px',
                cursor: 'pointer', fontWeight: 700
              }}
            >
              Explore Services →
            </button>
          </div>
        )}

        {!loading && items.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile
              ? '1fr'
              : 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '16px'
          }}>
            {items.map(item => {
              const badge =
                getServiceBadge(item.service_type)
              const priceLabel =
                getPriceLabel(item.service_type)
              return (
                <div key={item.id} style={{
                  background: 'var(--bg-card)',
                  borderRadius: 'var(--radius-lg)',
                  border:
                    '1px solid var(--border-color)',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'transform 0.18s'
                }}
                  onMouseEnter={e =>
                    e.currentTarget.style.transform =
                      'translateY(-4px)'
                  }
                  onMouseLeave={e =>
                    e.currentTarget.style.transform =
                      'translateY(0)'
                  }
                >
                  {/* Image */}
                  <div style={{
                    position: 'relative',
                    height: '180px', overflow: 'hidden'
                  }}>
                    <img
                      src={getImageUrl(item.image_url)}
                      alt={item.title}
                      onError={e => {
                        e.target.onerror = null
                        e.target.src =
                          'https://placehold.co/400x180/e5e7eb/9ca3af?text=GB+Tourism'
                      }}
                      onClick={() =>
                        navigate(
                          `/listing/${item.id}`
                        )
                      }
                      style={{
                        width: '100%', height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                        cursor: 'pointer'
                      }}
                    />
                    {/* Gradient */}
                    <div style={{
                      position: 'absolute', inset: 0,
                      background:
                        'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 60%)'
                    }} />
                    {/* Badge */}
                    <div style={{
                      position: 'absolute',
                      top: '10px', left: '10px',
                      background: badge.bg,
                      color: 'white',
                      padding: '3px 10px',
                      borderRadius: '999px',
                      fontSize: '0.72rem',
                      fontWeight: 700
                    }}>
                      {badge.label}
                    </div>
                    {/* Remove heart */}
                    <button
                      type="button"
                      onClick={() =>
                        removeItem(item.id)
                      }
                      title="Remove from wishlist"
                      style={{
                        position: 'absolute',
                        top: '10px', right: '10px',
                        width: 34, height: 34,
                        borderRadius: '50%',
                        background: '#e11d48',
                        border: 'none', color: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1rem',
                        boxShadow:
                          '0 2px 8px rgba(0,0,0,0.2)'
                      }}
                    >
                      ❤️
                    </button>
                  </div>

                  {/* Content */}
                  <div style={{padding: '14px 16px'}}>
                    <h3
                      role="presentation"
                      onClick={() =>
                        navigate(`/listing/${item.id}`)
                      }
                      style={{
                        margin: '0 0 4px',
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {item.title}
                    </h3>
                    <p style={{
                      margin: '0 0 8px',
                      fontSize: '0.8rem',
                      color: 'var(--text-secondary)'
                    }}>
                      📍 {item.location}
                    </p>
                    {item.average_rating > 0 && (
                      <div style={{
                        fontSize: '0.78rem',
                        color: '#f59e0b',
                        marginBottom: '8px'
                      }}>
                        {'★'.repeat(
                          Math.round(
                            item.average_rating
                          )
                        )}
                        <span style={{
                          color: 'var(--text-muted)',
                          marginLeft: '4px'
                        }}>
                          {item.average_rating
                            ?.toFixed(1)}
                          {' '}({item.review_count})
                        </span>
                      </div>
                    )}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div style={{
                        fontWeight: 800,
                        fontSize: '1rem',
                        color: 'var(--accent)'
                      }}>
                        PKR {item.price_per_night
                          ?.toLocaleString('en-PK')}
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 400,
                          color: 'var(--text-muted)',
                          marginLeft: '2px'
                        }}>
                          {priceLabel}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/listing/${item.id}`
                          )
                        }
                        style={{
                          padding: '7px 16px',
                          borderRadius: '8px',
                          border: 'none',
                          background:
                            'linear-gradient(135deg, #1e3a5f, #0ea5e9)',
                          color: 'white',
                          fontWeight: 600,
                          fontSize: '0.82rem',
                          cursor: 'pointer'
                        }}
                      >
                        View →
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
