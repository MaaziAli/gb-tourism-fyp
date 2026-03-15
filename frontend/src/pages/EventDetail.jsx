import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import useWindowSize from '../hooks/useWindowSize'

function getCategoryColor(cat) {
  const colors = {
    'Music & Cultural Festival': '#7c3aed',
    'Polo & Horse Events': '#0369a1',
    'Guided Trek & Expedition': '#16a34a',
    'Art & Photography': '#d97706',
    'Local Festival & Fair': '#e11d48',
    'Sports Event': '#2563eb',
    'Food & Dining Event': '#f97316',
    'Community Gathering': '#0891b2',
    'Horse Riding & Adventure': '#92400e',
  }
  return colors[cat] || '#7c3aed'
}

export default function EventDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isMobile } = useWindowSize()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get(`/events/${id}`)
      .then((r) => setEvent(r.data))
      .catch((e) => {
        console.error(e)
        setError('Event not found')
      })
      .finally(() => setLoading(false))
  }, [id])

  function formatDate(d) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-PK', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  function formatTime(t) {
    if (!t) return ''
    const [h, m] = t.split(':')
    const hour = parseInt(h, 10)
    return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`
  }

  if (loading)
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--bg-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-secondary)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🎪</div>
          Loading event...
        </div>
      </div>
    )

  if (error || !event)
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--bg-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem' }}>😕</div>
          <p style={{ color: 'var(--text-secondary)' }}>
            {error || 'Event not found'}
          </p>
          <button
            onClick={() => navigate('/events')}
            style={{
              background: '#7c3aed',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 20px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Back to Events
          </button>
        </div>
      </div>
    )

  const color = getCategoryColor(event.category)
  const spotsLeft = event.spots_remaining
  const isSoldOut = spotsLeft <= 0

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        paddingBottom: '48px',
      }}
    >
      <div style={{ position: 'relative' }}>
        {event.image_url ? (
          <img
            src={`http://127.0.0.1:8000/uploads/${event.image_url}`}
            alt={event.title}
            onError={(e) => {
              e.target.style.display = 'none'
            }}
            style={{
              width: '100%',
              height: isMobile ? '220px' : '380px',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: isMobile ? '220px' : '380px',
              background: `linear-gradient(135deg, ${color}33, ${color}66)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '5rem',
            }}
          >
            🎪
          </div>
        )}

        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)',
          }}
        />

        <button
          onClick={() => navigate('/events')}
          style={{
            position: 'absolute',
            top: '16px',
            left: '16px',
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: 'white',
            borderRadius: '10px',
            padding: '8px 16px',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: 600,
          }}
        >
          ← Events
        </button>

        <div
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            display: 'flex',
            gap: '6px',
          }}
        >
          {event.is_featured && (
            <span
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: 'white',
                padding: '5px 12px',
                borderRadius: '999px',
                fontSize: '0.75rem',
                fontWeight: 700,
              }}
            >
              ⭐ Featured
            </span>
          )}
          {event.is_free && (
            <span
              style={{
                background: '#16a34a',
                color: 'white',
                padding: '5px 12px',
                borderRadius: '999px',
                fontSize: '0.75rem',
                fontWeight: 700,
              }}
            >
              FREE
            </span>
          )}
          {isSoldOut && (
            <span
              style={{
                background: '#dc2626',
                color: 'white',
                padding: '5px 12px',
                borderRadius: '999px',
                fontSize: '0.75rem',
                fontWeight: 700,
              }}
            >
              SOLD OUT
            </span>
          )}
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '20px 20px',
          }}
        >
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div
              style={{
                display: 'inline-block',
                background: color,
                color: 'white',
                padding: '4px 12px',
                borderRadius: '999px',
                fontSize: '0.78rem',
                fontWeight: 700,
                marginBottom: '8px',
              }}
            >
              {event.category}
            </div>
            <h1
              style={{
                color: 'white',
                margin: 0,
                fontSize: isMobile ? '1.4rem' : '2rem',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                textShadow: '0 2px 8px rgba(0,0,0,0.3)',
              }}
            >
              {event.title}
            </h1>
          </div>
        </div>
      </div>

      <div
        style={{
          maxWidth: '1000px',
          margin: '0 auto',
          padding: isMobile ? '16px 12px' : '24px 16px',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 340px',
          gap: '24px',
          alignItems: 'start',
        }}
      >
        <div>
          <div
            style={{
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-sm)',
              padding: '24px',
              marginBottom: '20px',
            }}
          >
            <h2
              style={{
                margin: '0 0 16px',
                fontSize: '1.1rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
              }}
            >
              📋 Event Details
            </h2>

            {[
              {
                icon: '📅',
                label: 'Date',
                value: formatDate(event.event_date),
              },
              {
                icon: '🕐',
                label: 'Time',
                value:
                  formatTime(event.event_time) +
                  (event.end_time ? ` — ${formatTime(event.end_time)}` : ''),
              },
              {
                icon: '📍',
                label: 'Venue',
                value: `${event.venue}, ${event.location}`,
              },
              {
                icon: '👤',
                label: 'Organizer',
                value: event.organizer_name,
              },
              {
                icon: '👥',
                label: 'Capacity',
                value: `${event.total_capacity} total · ${spotsLeft} spots remaining`,
              },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  display: 'flex',
                  gap: '12px',
                  padding: '10px 0',
                  borderBottom: '1px solid var(--border-color)',
                }}
              >
                <span
                  style={{
                    fontSize: '1.1rem',
                    flexShrink: 0,
                    width: '24px',
                    textAlign: 'center',
                  }}
                >
                  {item.icon}
                </span>
                <div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: '2px',
                    }}
                  >
                    {item.label}
                  </div>
                  <div
                    style={{
                      fontSize: '0.9rem',
                      color: 'var(--text-primary)',
                      fontWeight: 500,
                    }}
                  >
                    {item.value}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {event.description && (
            <div
              style={{
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-sm)',
                padding: '24px',
                marginBottom: '20px',
              }}
            >
              <h2
                style={{
                  margin: '0 0 14px',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                }}
              >
                ℹ️ About This Event
              </h2>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.925rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.8,
                }}
              >
                {event.description}
              </p>
            </div>
          )}

          {event.ticket_types?.length > 0 && (
            <div
              style={{
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-sm)',
                padding: '24px',
              }}
            >
              <h2
                style={{
                  margin: '0 0 16px',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                }}
              >
                🎟️ Available Tickets
              </h2>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                {event.ticket_types.map((tt) => (
                  <div
                    key={tt.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '14px 16px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-secondary)',
                      opacity: tt.available === 0 ? 0.6 : 1,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          color: 'var(--text-primary)',
                          marginBottom: '3px',
                        }}
                      >
                        🎟️ {tt.name}
                        {tt.available === 0 && (
                          <span
                            style={{
                              marginLeft: '8px',
                              fontSize: '0.72rem',
                              color: '#dc2626',
                              fontWeight: 700,
                            }}
                          >
                            SOLD OUT
                          </span>
                        )}
                      </div>
                      {tt.description && (
                        <div
                          style={{
                            fontSize: '0.78rem',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          {tt.description}
                        </div>
                      )}
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-muted)',
                          marginTop: '2px',
                        }}
                      >
                        {tt.available} of {tt.capacity} available
                      </div>
                    </div>
                    <div
                      style={{
                        fontWeight: 800,
                        fontSize: '1.1rem',
                        color: tt.is_free ? '#16a34a' : color,
                        flexShrink: 0,
                      }}
                    >
                      {tt.is_free || tt.price === 0
                        ? 'FREE'
                        : `PKR ${tt.price?.toLocaleString('en-PK')}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            position: isMobile ? 'relative' : 'sticky',
            top: '20px',
            order: isMobile ? -1 : 0,
          }}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-md)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                background: color,
                padding: '20px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: isMobile ? '1.6rem' : '1.8rem',
                  fontWeight: 800,
                  color: 'white',
                  marginBottom: '4px',
                }}
              >
                {event.is_free
                  ? 'FREE EVENT'
                  : event.starting_price === 0
                    ? 'FREE'
                    : `PKR ${event.starting_price?.toLocaleString('en-PK')}+`}
              </div>
              <div
                style={{
                  color: 'rgba(255,255,255,0.8)',
                  fontSize: '0.85rem',
                }}
              >
                {isSoldOut
                  ? '❌ Sold Out'
                  : spotsLeft <= 10
                    ? `🔥 Only ${spotsLeft} spots left!`
                    : `${spotsLeft} spots available`}
              </div>
            </div>

            <div style={{ padding: '20px' }}>
              <div
                style={{
                  background: 'var(--bg-secondary)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  marginBottom: '16px',
                }}
              >
                <div
                  style={{
                    fontSize: '0.82rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.8,
                  }}
                >
                  <div>📅 {formatDate(event.event_date)}</div>
                  <div>
                    🕐 {formatTime(event.event_time)}
                    {event.end_time && ` — ${formatTime(event.end_time)}`}
                  </div>
                  <div>📍 {event.venue}</div>
                </div>
              </div>

              {isSoldOut ? (
                <div
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '12px',
                    background: '#fee2e2',
                    color: '#dc2626',
                    fontWeight: 700,
                    textAlign: 'center',
                    fontSize: '1rem',
                  }}
                >
                  ❌ Sold Out
                </div>
              ) : event.status === 'cancelled' ? (
                <div
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '12px',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-muted)',
                    fontWeight: 700,
                    textAlign: 'center',
                    fontSize: '1rem',
                  }}
                >
                  ❌ Event Cancelled
                </div>
              ) : (
                <button
                  onClick={() => {
                    const raw = localStorage.getItem('user')
                    if (!raw) {
                      navigate('/login')
                      return
                    }
                    navigate(`/events/${event.id}/tickets`)
                  }}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '12px',
                    border: 'none',
                    background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                    color: 'white',
                    fontWeight: 800,
                    fontSize: '1rem',
                    cursor: 'pointer',
                    boxShadow: `0 4px 16px ${color}44`,
                  }}
                >
                  🎟️ Get Tickets
                </button>
              )}

              <p
                style={{
                  textAlign: 'center',
                  margin: '10px 0 0',
                  fontSize: '0.72rem',
                  color: 'var(--text-muted)',
                }}
              >
                ✅ Instant confirmation · Free cancellation
              </p>

              <div
                style={{
                  marginTop: '16px',
                  padding: '12px',
                  background: 'var(--bg-secondary)',
                  borderRadius: '10px',
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: color,
                    color: 'white',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1rem',
                    flexShrink: 0,
                  }}
                >
                  {event.organizer_name?.[0]?.toUpperCase() || 'O'}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: '0.72rem',
                      color: 'var(--text-muted)',
                    }}
                  >
                    Organized by
                  </div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {event.organizer_name}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
