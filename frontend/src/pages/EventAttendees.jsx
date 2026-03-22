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

export default function EventAttendees() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isMobile } = useWindowSize()

  const [event, setEvent] = useState(null)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    // Fetch event details
    api.get(`/events/${id}`)
      .then(r => setEvent(r.data))
      .catch(console.error)

    // Fetch attendees
    api.get(
      `/ticket-bookings/event/${id}/attendees`
    )
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  function formatDate(d) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-PK', {
      day: 'numeric', month: 'short',
      year: 'numeric'
    })
  }

  function formatDateTime(d) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-PK', {
      day: 'numeric', month: 'short',
      year: 'numeric', hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filtered = (data?.attendees || []).filter(a => {
    const matchSearch = !search.trim() ||
      a.attendee_name.toLowerCase().includes(
        search.toLowerCase()
      ) ||
      a.attendee_email.toLowerCase().includes(
        search.toLowerCase()
      ) ||
      a.booking_ref.toLowerCase().includes(
        search.toLowerCase()
      )

    const matchFilter = filter === 'all' ||
      a.status === filter

    return matchSearch && matchFilter
  })

  const color = event
    ? getCategoryColor(event.category)
    : '#7c3aed'

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      paddingBottom: '48px'
    }}>

      {/* Header */}
      <div style={{
        background:
          `linear-gradient(135deg, ${color}dd, ${color})`,
        padding: '32px 16px 80px'
      }}>
        <div style={{
          maxWidth: '1000px', margin: '0 auto'
        }}>
          <button
            onClick={() => navigate('/my-events')}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'white', borderRadius: '8px',
              padding: '7px 16px', cursor: 'pointer',
              fontSize: '0.85rem', fontWeight: 600,
              marginBottom: '16px'
            }}
          >
            ← My Events
          </button>

          <h1 style={{
            color: 'white', margin: '0 0 4px',
            fontSize: isMobile ? '1.4rem' : '1.8rem',
            fontWeight: 800
          }}>
            👥 Attendees
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.8)',
            margin: '0 0 20px', fontSize: '0.9rem'
          }}>
            {event?.title || 'Loading...'}
          </p>

          {/* Stats row */}
          {data && (
            <div style={{
              display: 'inline-flex',
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '14px', overflow: 'hidden'
            }}>
              {[
                {
                  v: data.total_bookings,
                  l: 'Bookings'
                },
                {
                  v: data.attendees?.reduce(
                    (s, a) => s + a.quantity, 0
                  ) || 0,
                  l: 'Tickets Sold'
                },
                {
                  v: 'PKR ' + (
                    data.organizer_revenue || 0
                  ).toLocaleString('en-PK'),
                  l: 'Your Earnings'
                },
                {
                  v: 'PKR ' + (
                    data.commission || 0
                  ).toLocaleString('en-PK'),
                  l: 'Platform Fee'
                },
              ].map((s, i, arr) => (
                <div key={s.l} style={{
                  padding: isMobile
                    ? '12px 14px' : '14px 24px',
                  textAlign: 'center',
                  borderRight: i < arr.length - 1
                    ? '1px solid rgba(255,255,255,0.12)'
                    : 'none'
                }}>
                  <div style={{
                    fontSize: isMobile
                      ? '0.95rem' : '1.2rem',
                    fontWeight: 800,
                    color: 'white', lineHeight: 1
                  }}>
                    {s.v}
                  </div>
                  <div style={{
                    fontSize: '0.7rem',
                    color: 'rgba(255,255,255,0.6)',
                    marginTop: '4px'
                  }}>
                    {s.l}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{
        maxWidth: '1000px',
        margin: '-48px auto 0',
        padding: '0 16px'
      }}>

        {/* Search + filter bar */}
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-md)',
          padding: '16px 20px',
          marginBottom: '16px',
          display: 'flex', gap: '12px',
          flexWrap: 'wrap', alignItems: 'center'
        }}>
          {/* Search */}
          <div style={{
            flex: 1, minWidth: '200px',
            position: 'relative'
          }}>
            <span style={{
              position: 'absolute', left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              pointerEvents: 'none'
            }}>🔍</span>
            <input
              type="text"
              placeholder="Search by name, email or ref..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
                boxSizing: 'border-box', outline: 'none'
              }}
            />
          </div>

          {/* Filter pills */}
          <div style={{
            display: 'flex', gap: '8px'
          }}>
            {[
              { key: 'all', label: 'All' },
              { key: 'confirmed',
                label: '✅ Confirmed' },
              { key: 'cancelled',
                label: '❌ Cancelled' },
            ].map(f => (
              <button key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '999px',
                  border: filter === f.key
                    ? 'none'
                    : '1px solid var(--border-color)',
                  background: filter === f.key
                    ? color : 'var(--bg-secondary)',
                  color: filter === f.key
                    ? 'white'
                    : 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Count */}
          <span style={{
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
            whiteSpace: 'nowrap'
          }}>
            {filtered.length} attendee
            {filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Loading */}
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
            }}>
              👥
            </div>
            Loading attendees...
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
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
              {search ? '🔍' : '👥'}
            </div>
            <h2 style={{
              margin: '0 0 8px',
              color: 'var(--text-primary)'
            }}>
              {search
                ? 'No matching attendees'
                : 'No attendees yet'
              }
            </h2>
            <p style={{
              margin: 0,
              color: 'var(--text-secondary)',
              fontSize: '0.9rem'
            }}>
              {search
                ? 'Try a different search term'
                : 'Share your event to get ticket sales!'
              }
            </p>
          </div>
        )}

        {/* Attendees table */}
        {!loading && filtered.length > 0 && (
          isMobile ? (
            /* MOBILE: Cards */
            <div style={{
              display: 'flex', flexDirection: 'column',
              gap: '10px'
            }}>
              {filtered.map(a => (
                <div key={a.booking_ref} style={{
                  background: 'var(--bg-card)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  boxShadow: 'var(--shadow-sm)',
                  padding: '14px 16px',
                  opacity: a.status === 'cancelled'
                    ? 0.65 : 1
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '8px', gap: '8px'
                  }}>
                    {/* Avatar + name */}
                    <div style={{
                      display: 'flex', gap: '10px',
                      alignItems: 'center'
                    }}>
                      <div style={{
                        width: 36, height: 36,
                        borderRadius: '50%',
                        background: color,
                        color: 'white', fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.95rem',
                        flexShrink: 0
                      }}>
                        {a.attendee_name?.[0]
                          ?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <div style={{
                          fontWeight: 700,
                          fontSize: '0.875rem',
                          color: 'var(--text-primary)'
                        }}>
                          {a.attendee_name}
                        </div>
                        <div style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-muted)'
                        }}>
                          {a.attendee_email}
                        </div>
                      </div>
                    </div>

                    {/* Status */}
                    <span style={{
                      padding: '3px 10px',
                      borderRadius: '999px',
                      fontSize: '0.7rem', fontWeight: 700,
                      flexShrink: 0,
                      background:
                        a.status === 'confirmed'
                          ? '#dcfce7' : '#fee2e2',
                      color: a.status === 'confirmed'
                        ? '#16a34a' : '#dc2626'
                    }}>
                      {a.status === 'confirmed'
                        ? '✅' : '❌'}
                      {' '}{a.status}
                    </span>
                  </div>

                  {/* Details grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px', marginTop: '10px'
                  }}>
                    <div style={{
                      background: 'var(--bg-secondary)',
                      borderRadius: '8px',
                      padding: '8px 10px'
                    }}>
                      <div style={{
                        fontSize: '0.68rem',
                        color: 'var(--text-muted)',
                        marginBottom: '2px'
                      }}>
                        Ticket
                      </div>
                      <div style={{
                        fontWeight: 600,
                        fontSize: '0.82rem',
                        color: 'var(--text-primary)'
                      }}>
                        {a.ticket_name}
                        {a.quantity > 1
                          ? ` × ${a.quantity}` : ''
                        }
                      </div>
                    </div>
                    <div style={{
                      background: 'var(--bg-secondary)',
                      borderRadius: '8px',
                      padding: '8px 10px'
                    }}>
                      <div style={{
                        fontSize: '0.68rem',
                        color: 'var(--text-muted)',
                        marginBottom: '2px'
                      }}>
                        Amount
                      </div>
                      <div style={{
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        color: a.total_price === 0
                          ? '#16a34a' : color
                      }}>
                        {a.total_price === 0
                          ? 'FREE'
                          : `PKR ${a.total_price
                              ?.toLocaleString('en-PK')}`
                        }
                      </div>
                    </div>
                    <div style={{
                      background: 'var(--bg-secondary)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      gridColumn: '1 / -1'
                    }}>
                      <div style={{
                        fontSize: '0.68rem',
                        color: 'var(--text-muted)',
                        marginBottom: '2px'
                      }}>
                        Booking Ref
                      </div>
                      <div style={{
                        fontFamily: 'monospace',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        color: 'var(--text-primary)'
                      }}>
                        {a.booking_ref}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* DESKTOP: Table */
            <div style={{
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-md)',
              overflow: 'hidden'
            }}>
              {/* Table header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns:
                  '2fr 1.5fr 1.2fr 1fr 1fr 0.8fr',
                padding: '12px 20px',
                borderBottom:
                  '1px solid var(--border-color)',
                fontSize: '0.72rem', fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                background: 'var(--bg-secondary)'
              }}>
                <span>Attendee</span>
                <span>Booking Ref</span>
                <span>Ticket</span>
                <span>Qty</span>
                <span>Amount</span>
                <span>Status</span>
              </div>

              {/* Rows */}
              {filtered.map((a, i) => (
                <div key={a.booking_ref} style={{
                  display: 'grid',
                  gridTemplateColumns:
                    '2fr 1.5fr 1.2fr 1fr 1fr 0.8fr',
                  padding: '14px 20px',
                  borderBottom:
                    i < filtered.length - 1
                      ? '1px solid var(--border-color)'
                      : 'none',
                  alignItems: 'center',
                  opacity: a.status === 'cancelled'
                    ? 0.6 : 1,
                  transition: 'background 0.15s'
                }}
                  onMouseEnter={e =>
                    e.currentTarget.style.background =
                      'var(--bg-secondary)'
                  }
                  onMouseLeave={e =>
                    e.currentTarget.style.background =
                      'transparent'
                  }
                >
                  {/* Attendee */}
                  <div style={{
                    display: 'flex', gap: '10px',
                    alignItems: 'center'
                  }}>
                    <div style={{
                      width: 36, height: 36,
                      borderRadius: '50%',
                      background: color,
                      color: 'white', fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.95rem', flexShrink: 0
                    }}>
                      {a.attendee_name?.[0]
                        ?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <div style={{
                        fontWeight: 700,
                        fontSize: '0.875rem',
                        color: 'var(--text-primary)'
                      }}>
                        {a.attendee_name}
                      </div>
                      <div style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)'
                      }}>
                        {a.attendee_email}
                      </div>
                    </div>
                  </div>

                  {/* Booking ref */}
                  <div style={{
                    fontFamily: 'monospace',
                    fontSize: '0.82rem', fontWeight: 600,
                    color: 'var(--text-secondary)'
                  }}>
                    {a.booking_ref}
                  </div>

                  {/* Ticket name */}
                  <div style={{
                    fontSize: '0.875rem',
                    color: 'var(--text-primary)'
                  }}>
                    {a.ticket_name}
                  </div>

                  {/* Quantity */}
                  <div style={{
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    fontSize: '0.95rem'
                  }}>
                    {a.quantity}
                  </div>

                  {/* Amount */}
                  <div style={{
                    fontWeight: 700,
                    color: a.total_price === 0
                      ? '#16a34a' : color,
                    fontSize: '0.9rem'
                  }}>
                    {a.total_price === 0
                      ? 'FREE'
                      : `PKR ${a.total_price
                          ?.toLocaleString('en-PK')}`
                    }
                  </div>

                  {/* Status */}
                  <span style={{
                    display: 'inline-block',
                    padding: '3px 10px',
                    borderRadius: '999px',
                    fontSize: '0.72rem', fontWeight: 700,
                    background:
                      a.status === 'confirmed'
                        ? '#dcfce7' : '#fee2e2',
                    color: a.status === 'confirmed'
                      ? '#16a34a' : '#dc2626'
                  }}>
                    {a.status === 'confirmed'
                      ? '✅ Confirmed'
                      : '❌ Cancelled'
                    }
                  </span>
                </div>
              ))}

              {/* Revenue footer */}
              <div style={{
                display: 'grid',
                gridTemplateColumns:
                  '2fr 1.5fr 1.2fr 1fr 1fr 0.8fr',
                padding: '14px 20px',
                borderTop:
                  '2px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                alignItems: 'center'
              }}>
                <div style={{
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                  gridColumn: '1 / 4'
                }}>
                  Total Revenue
                </div>
                <div style={{
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  fontSize: '0.875rem'
                }}>
                  {filtered.reduce(
                    (s, a) => s + a.quantity, 0
                  )} tickets
                </div>
                <div style={{
                  fontWeight: 800, color: color,
                  fontSize: '1rem'
                }}>
                  PKR {filtered.reduce(
                    (s, a) => s + a.total_price, 0
                  ).toLocaleString('en-PK')}
                </div>
                <div />
              </div>
            </div>
          )
        )}

        {/* Export hint */}
        {!loading && filtered.length > 0 && (
          <div style={{
            marginTop: '16px', textAlign: 'center',
            fontSize: '0.8rem',
            color: 'var(--text-muted)'
          }}>
            💡 Tip: Use Ctrl+P to print or save
            attendee list as PDF
          </div>
        )}
      </div>
    </div>
  )
}
