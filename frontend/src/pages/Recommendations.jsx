import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { getImageUrl } from '../utils/image'

function getServiceBadge(type) {
  switch(type) {
    case 'hotel': return { bg: '#2563eb', label: '🏨 Hotel' }
    case 'tour': return { bg: '#16a34a', label: '🏔️ Tour' }
    case 'transport': return { bg: '#d97706', label: '🚐 Transport' }
    case 'activity': return { bg: '#7c3aed', label: '🎯 Activity' }
    case 'restaurant': return { bg: '#e11d48', label: '🍽️ Restaurant' }
    default: return { bg: '#0ea5e9', label: type }
  }
}

export default function Recommendations() {
  const [recs, setRecs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => { fetchRecs() }, [])

  async function fetchRecs() {
    setLoading(true)
    try {
      const res = await api.get('/recommendations')
      setRecs(res.data)
    } catch(e) {
      setError(
        e.response?.data?.detail ||
        'Could not load recommendations'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      paddingBottom: '48px'
    }}>

      {/* Gradient header */}
      <div style={{
        background:
          'linear-gradient(135deg, #1e3a5f 0%, #0ea5e9 100%)',
        padding: '40px 16px 72px'
      }}>
        <div style={{
          maxWidth: '900px', margin: '0 auto',
          textAlign: 'center'
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center',
            gap: '8px',
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.25)',
            borderRadius: '999px',
            padding: '6px 16px',
            marginBottom: '16px',
            fontSize: '0.82rem', fontWeight: 600,
            color: 'white'
          }}>
            ✨ AI-Powered
          </div>
          <h1 style={{
            color: 'white', margin: '0 0 10px',
            fontSize: '2rem', fontWeight: 800,
            letterSpacing: '-0.02em'
          }}>
            Recommended For You
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.8)',
            margin: 0, fontSize: '0.95rem',
            maxWidth: '500px', margin: '0 auto'
          }}>
            Personalized picks based on your booking history
            and preferences
          </p>
        </div>
      </div>

      {/* Content pulled up over header */}
      <div style={{
        maxWidth: '900px', margin: '-48px auto 0',
        padding: '0 16px'
      }}>

        {/* Loading */}
        {loading && (
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-md)',
            padding: '60px 20px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '2.5rem', marginBottom: '12px'
            }}>
              ✨
            </div>
            <p style={{
              color: 'var(--text-secondary)',
              margin: 0, fontSize: '0.95rem'
            }}>
              Finding your perfect stays...
            </p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-md)',
            padding: '60px 20px', textAlign: 'center'
          }}>
            <div style={{
              fontSize: '2.5rem', marginBottom: '12px'
            }}>
              🔒
            </div>
            <h2 style={{
              margin: '0 0 8px',
              color: 'var(--text-primary)',
              fontSize: '1.2rem', fontWeight: 700
            }}>
              Login Required
            </h2>
            <p style={{
              margin: '0 0 20px',
              color: 'var(--text-secondary)',
              fontSize: '0.9rem'
            }}>
              Sign in to see personalized recommendations
            </p>
            <button
              onClick={() => navigate('/login')}
              style={{
                background:
                  'linear-gradient(135deg, #1e3a5f, #0ea5e9)',
                color: 'white', border: 'none',
                borderRadius: '10px',
                padding: '11px 28px',
                cursor: 'pointer', fontWeight: 700,
                fontSize: '0.9rem'
              }}
            >
              Sign In
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && recs.length === 0 && (
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-md)',
            padding: '60px 20px', textAlign: 'center'
          }}>
            <div style={{
              fontSize: '3rem', marginBottom: '12px'
            }}>
              🏔️
            </div>
            <h2 style={{
              margin: '0 0 8px',
              color: 'var(--text-primary)',
              fontSize: '1.2rem', fontWeight: 700
            }}>
              No recommendations yet
            </h2>
            <p style={{
              margin: '0 0 20px',
              color: 'var(--text-secondary)',
              fontSize: '0.9rem'
            }}>
              Make a booking first and we'll suggest similar
              stays you'll love
            </p>
            <button
              onClick={() => navigate('/')}
              style={{
                background:
                  'linear-gradient(135deg, #1e3a5f, #0ea5e9)',
                color: 'white', border: 'none',
                borderRadius: '10px',
                padding: '11px 28px',
                cursor: 'pointer', fontWeight: 700,
                fontSize: '0.9rem'
              }}
            >
              Explore Stays
            </button>
          </div>
        )}

        {/* Recommendations grid */}
        {!loading && !error && recs.length > 0 && (
          <div>
            {/* Count badge */}
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: '16px'
            }}>
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '999px',
                padding: '6px 16px',
                fontSize: '0.85rem', fontWeight: 600,
                color: 'var(--text-secondary)',
                boxShadow: 'var(--shadow-sm)'
              }}>
                {recs.length} recommendation{recs.length !== 1 ? 's' : ''} for you
              </div>
              <button
                onClick={fetchRecs}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '999px',
                  padding: '6px 16px',
                  fontSize: '0.85rem', fontWeight: 600,
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                🔄 Refresh
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '20px'
            }}>
              {recs.map((item, idx) => {
                const badge = getServiceBadge(item.service_type)
                return (
                  <div key={item.id}
                    onClick={() =>
                      navigate(`/listing/${item.id}`)
                    }
                    style={{
                      background: 'var(--bg-card)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      overflow: 'hidden', cursor: 'pointer',
                      boxShadow: 'var(--shadow-sm)',
                      transition:
                        'transform 0.18s, box-shadow 0.18s'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform =
                        'translateY(-4px)'
                      e.currentTarget.style.boxShadow =
                        '0 12px 32px rgba(0,0,0,0.12)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform =
                        'translateY(0)'
                      e.currentTarget.style.boxShadow =
                        'var(--shadow-sm)'
                    }}
                  >
                    {/* Image */}
                    <div style={{position: 'relative'}}>
                      <img
                        src={getImageUrl(item.image_url)}
                        alt={item.title}
                        onError={e => {
                          e.target.onerror = null
                          e.target.src =
                            'https://placehold.co/400x220/e5e7eb/9ca3af?text=GB+Tourism'
                        }}
                        style={{
                          width: '100%', height: '190px',
                          objectFit: 'cover', display: 'block'
                        }}
                      />

                      {/* Rank badge */}
                      <div style={{
                        position: 'absolute',
                        top: '10px', left: '10px',
                        background: idx === 0
                          ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                          : idx === 1
                          ? 'linear-gradient(135deg, #94a3b8, #64748b)'
                          : idx === 2
                          ? 'linear-gradient(135deg, #cd7c2f, #92400e)'
                          : 'rgba(0,0,0,0.55)',
                        color: 'white',
                        borderRadius: '999px',
                        padding: '3px 10px',
                        fontSize: '0.72rem',
                        fontWeight: 700
                      }}>
                        {idx === 0 ? '🥇 Top Pick'
                          : idx === 1 ? '🥈 #2'
                          : idx === 2 ? '🥉 #3'
                          : `#${idx + 1}`
                        }
                      </div>

                      {/* Service type badge */}
                      <span style={{
                        position: 'absolute',
                        top: '10px', right: '10px',
                        background: badge.bg, color: 'white',
                        padding: '3px 10px',
                        borderRadius: '999px',
                        fontSize: '0.72rem', fontWeight: 700
                      }}>
                        {badge.label}
                      </span>

                      {/* Rating overlay */}
                      {item.average_rating > 0 && (
                        <div style={{
                          position: 'absolute',
                          bottom: '10px', right: '10px',
                          background: 'rgba(0,0,0,0.65)',
                          color: 'white', padding: '3px 10px',
                          borderRadius: '999px',
                          fontSize: '0.75rem', fontWeight: 700,
                          display: 'flex', alignItems: 'center',
                          gap: '4px'
                        }}>
                          ⭐ {item.average_rating.toFixed(1)}
                          <span style={{
                            opacity: 0.7, fontSize: '0.7rem'
                          }}>
                            ({item.review_count || 0})
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Card body */}
                    <div style={{padding: '16px'}}>
                      <h3 style={{
                        margin: '0 0 6px', fontWeight: 700,
                        fontSize: '1rem',
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {item.title}
                      </h3>
                      <p style={{
                        margin: '0 0 14px',
                        fontSize: '0.85rem',
                        color: 'var(--text-secondary)'
                      }}>
                        📍 {item.location}
                      </p>

                      {/* Price + action row */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <span style={{
                            fontSize: '1.1rem', fontWeight: 800,
                            color: 'var(--accent)'
                          }}>
                            PKR {item.price_per_night
                              ?.toLocaleString('en-PK')}
                          </span>
                          <span style={{
                            fontSize: '0.78rem',
                            color: 'var(--text-muted)'
                          }}>
                            {' '}{item.service_type === 'restaurant' ||
                            item.service_type === 'tour' ||
                            item.service_type === 'activity'
                              ? '/person'
                              : '/night'}
                          </span>
                        </div>
                        <button
                          onClick={e => {
                            e.stopPropagation()
                            navigate(item.service_type === 'restaurant'
                              ? `/listing/${item.id}`
                              : `/booking/${item.id}`)
                          }}
                          style={{
                            background: item.service_type === 'restaurant'
                              ? 'linear-gradient(135deg, #e11d48, #f97316)'
                              : 'linear-gradient(135deg, #1e3a5f, #0ea5e9)',
                            color: 'white', border: 'none',
                            borderRadius: '8px',
                            padding: '8px 16px',
                            cursor: 'pointer', fontWeight: 700,
                            fontSize: '0.82rem'
                          }}
                        >
                          {item.service_type === 'restaurant'
                            ? '🍽️ Reserve'
                            : 'Book Now'}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Bottom CTA */}
            <div style={{
              marginTop: '32px', textAlign: 'center',
              padding: '28px',
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <p style={{
                margin: '0 0 14px',
                color: 'var(--text-secondary)',
                fontSize: '0.9rem'
              }}>
                Want to explore more options?
              </p>
              <button
                onClick={() => navigate('/')}
                style={{
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  padding: '11px 28px',
                  cursor: 'pointer', fontWeight: 700,
                  fontSize: '0.9rem'
                }}
              >
                Browse All Stays & Experiences →
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

