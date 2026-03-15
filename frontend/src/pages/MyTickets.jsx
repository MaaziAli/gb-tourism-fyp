import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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

export default function MyTickets() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { isMobile } = useWindowSize()

  useEffect(() => {
    api
      .get('/ticket-bookings/my-tickets')
      .then((r) => setTickets(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function cancelTicket(bookingId) {
    if (!window.confirm('Cancel this ticket booking?')) return
    try {
      await api.patch(`/ticket-bookings/${bookingId}/cancel`)
      setTickets((prev) =>
        prev.map((t) =>
          t.id === bookingId ? { ...t, status: 'cancelled' } : t
        )
      )
    } catch (e) {
      console.error(e)
    }
  }

  function formatDate(d) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-PK', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  function formatTime(t) {
    if (!t) return ''
    const [h, m] = t.split(':')
    const hour = parseInt(h, 10)
    return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`
  }

  function isUpcoming(dateStr) {
    return dateStr && new Date(dateStr) >= new Date()
  }

  const activeCount = tickets.filter((t) => t.status !== 'cancelled').length

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        paddingBottom: '48px',
      }}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, #4c1d95, #7c3aed)',
          padding: '40px 16px 80px',
        }}
      >
        <div
          style={{
            maxWidth: '800px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <h1
              style={{
                color: 'white',
                margin: '0 0 6px',
                fontSize: '1.8rem',
                fontWeight: 800,
              }}
            >
              🎟️ My Tickets
            </h1>
            <p
              style={{
                color: 'rgba(255,255,255,0.75)',
                margin: 0,
                fontSize: '0.9rem',
              }}
            >
              {activeCount} active ticket{activeCount !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => navigate('/events')}
            style={{
              background: 'white',
              color: '#7c3aed',
              border: 'none',
              borderRadius: '10px',
              padding: '10px 20px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.9rem',
            }}
          >
            Browse Events →
          </button>
        </div>
      </div>

      <div
        style={{
          maxWidth: '800px',
          margin: '-48px auto 0',
          padding: '0 16px',
        }}
      >
        {loading && (
          <div
            style={{
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              padding: '60px',
              textAlign: 'center',
              color: 'var(--text-secondary)',
            }}
          >
            Loading your tickets...
          </div>
        )}

        {!loading && tickets.length === 0 && (
          <div
            style={{
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-md)',
              padding: '60px 20px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🎟️</div>
            <h2
              style={{
                margin: '0 0 8px',
                color: 'var(--text-primary)',
              }}
            >
              No tickets yet
            </h2>
            <p
              style={{
                margin: '0 0 24px',
                color: 'var(--text-secondary)',
                fontSize: '0.9rem',
              }}
            >
              Browse events and get your first ticket!
            </p>
            <button
              onClick={() => navigate('/events')}
              style={{
                background: 'linear-gradient(135deg, #4c1d95, #7c3aed)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                padding: '12px 28px',
                cursor: 'pointer',
                fontWeight: 700,
              }}
            >
              Browse Events →
            </button>
          </div>
        )}

        {!loading && tickets.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            {tickets.map((ticket) => {
              const color = getCategoryColor(ticket.category)
              const upcoming = isUpcoming(ticket.event_date)
              const isCancelled = ticket.status === 'cancelled'

              return (
                <div
                  key={ticket.id}
                  style={{
                    background: 'var(--bg-card)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow-sm)',
                    overflow: 'hidden',
                    opacity: isCancelled ? 0.65 : 1,
                  }}
                >
                  <div
                    style={{
                      height: '5px',
                      background: isCancelled ? '#e5e7eb' : color,
                    }}
                  />

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'stretch',
                    }}
                  >
                    <div
                      onClick={() =>
                        navigate(`/events/${ticket.event_id}`)
                      }
                      style={{
                        width: isMobile ? 80 : 110,
                        flexShrink: 0,
                        background: color + '22',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        overflow: 'hidden',
                        fontSize: '1.8rem',
                      }}
                    >
                      {ticket.image_url ? (
                        <img
                          src={`http://127.0.0.1:8000/uploads/${ticket.image_url}`}
                          alt={ticket.event_title}
                          onError={(e) => {
                            e.target.style.display = 'none'
                          }}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            minHeight: 100,
                          }}
                        />
                      ) : (
                        <span>🎪</span>
                      )}
                    </div>

                    <div
                      style={{
                        flex: 1,
                        padding: '16px 18px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: '6px',
                          gap: '8px',
                        }}
                      >
                        <h3
                          onClick={() =>
                            navigate(`/events/${ticket.event_id}`)
                          }
                          style={{
                            margin: 0,
                            fontWeight: 700,
                            fontSize: '0.975rem',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            flex: 1,
                          }}
                        >
                          {ticket.event_title}
                        </h3>
                        <span
                          style={{
                            padding: '3px 10px',
                            borderRadius: '999px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            flexShrink: 0,
                            background: isCancelled
                              ? 'var(--danger-bg)'
                              : upcoming
                                ? color + '18'
                                : '#dcfce7',
                            color: isCancelled
                              ? 'var(--danger)'
                              : upcoming
                                ? color
                                : '#16a34a',
                          }}
                        >
                          {isCancelled
                            ? '❌ Cancelled'
                            : upcoming
                              ? '⏳ Upcoming'
                              : '✅ Attended'}
                        </span>
                      </div>

                      <div
                        style={{
                          fontSize: '0.8rem',
                          color: 'var(--text-secondary)',
                          marginBottom: '8px',
                        }}
                      >
                        📅 {formatDate(ticket.event_date)} · 🕐{' '}
                        {formatTime(ticket.event_time)}
                        <br />
                        📍 {ticket.venue}
                        {ticket.location && `, ${ticket.location}`}
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          gap: '8px',
                          flexWrap: 'wrap',
                          marginBottom: '10px',
                        }}
                      >
                        <span
                          style={{
                            background: color + '18',
                            color,
                            padding: '2px 10px',
                            borderRadius: '999px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                          }}
                        >
                          🎟️ {ticket.ticket_name}
                          {ticket.quantity > 1 ? ` × ${ticket.quantity}` : ''}
                        </span>
                        <span
                          style={{
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-muted)',
                            padding: '2px 10px',
                            borderRadius: '999px',
                            fontSize: '0.72rem',
                            fontFamily: 'monospace',
                          }}
                        >
                          {ticket.booking_ref}
                        </span>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '8px',
                        }}
                      >
                        <div>
                          <span
                            style={{
                              fontWeight: 800,
                              color:
                                ticket.total_price === 0 ? '#16a34a' : color,
                              fontSize: '1rem',
                            }}
                          >
                            {ticket.total_price === 0
                              ? 'FREE'
                              : `PKR ${ticket.total_price?.toLocaleString('en-PK')}`}
                          </span>
                          {ticket.transaction_id && (
                            <span
                              style={{
                                marginLeft: '8px',
                                fontSize: '0.72rem',
                                color: 'var(--text-muted)',
                                fontFamily: 'monospace',
                              }}
                            >
                              {ticket.transaction_id}
                            </span>
                          )}
                        </div>
                        {!isCancelled && upcoming && (
                          <button
                            onClick={() => cancelTicket(ticket.id)}
                            style={{
                              padding: '6px 14px',
                              borderRadius: '7px',
                              border: '1px solid var(--danger)',
                              background: 'var(--danger-bg)',
                              color: 'var(--danger)',
                              cursor: 'pointer',
                              fontWeight: 600,
                              fontSize: '0.8rem',
                            }}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {!isCancelled && (
                    <div
                      style={{
                        borderTop: '2px dashed var(--border-color)',
                        margin: '0 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '8px 0',
                        fontSize: '0.72rem',
                        color: 'var(--text-muted)',
                        fontWeight: 600,
                        letterSpacing: '0.05em',
                      }}
                    >
                      ✂ TICKET STUB · {ticket.booking_ref}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
