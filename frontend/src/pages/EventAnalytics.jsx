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

export default function EventAnalytics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { isMobile } = useWindowSize()

  useEffect(() => {
    api.get('/ticket-bookings/provider-analytics')
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  function formatDate(d) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-PK', {
      day: 'numeric', month: 'short',
      year: 'numeric'
    })
  }

  const s = data?.summary

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      paddingBottom: '48px'
    }}>

      {/* Header */}
      <div style={{
        background:
          'linear-gradient(135deg, #4c1d95, #7c3aed)',
        padding: '40px 16px 80px'
      }}>
        <div style={{
          maxWidth: '1000px', margin: '0 auto',
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
              📊 Events Analytics
            </h1>
            <p style={{
              color: 'rgba(255,255,255,0.75)',
              margin: 0, fontSize: '0.9rem'
            }}>
              Your event performance overview
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/my-events')}
            style={{
              background: 'white',
              color: '#7c3aed',
              border: 'none', borderRadius: '10px',
              padding: '10px 20px',
              cursor: 'pointer', fontWeight: 700,
              fontSize: '0.9rem'
            }}
          >
            🎪 My Events
          </button>
        </div>
      </div>

      <div style={{
        maxWidth: '1000px',
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
            }}>
              📊
            </div>
            Loading analytics...
          </div>
        )}

        {!loading && data && s && (
          <div>
            {/* Summary stat cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile
                ? 'repeat(2, 1fr)'
                : 'repeat(4, 1fr)',
              gap: '14px', marginBottom: '24px'
            }}>
              {[
                {
                  icon: '🎪',
                  label: 'Total Events',
                  value: s.total_events,
                  sub: `${s.active_events} active`,
                  color: '#7c3aed'
                },
                {
                  icon: '🎟️',
                  label: 'Tickets Sold',
                  value: s.total_tickets_sold,
                  sub: `${s.confirmed_bookings} bookings`,
                  color: '#2563eb'
                },
                {
                  icon: '💰',
                  label: 'Your Earnings',
                  value: 'PKR ' +
                    (s.organizer_earnings || 0)
                      .toLocaleString('en-PK'),
                  sub: `PKR ${(s.platform_fees || 0)
                    .toLocaleString('en-PK')} platform fee`,
                  color: '#16a34a'
                },
                {
                  icon: '📈',
                  label: 'Total Revenue',
                  value: 'PKR ' +
                    (s.total_revenue || 0)
                      .toLocaleString('en-PK'),
                  sub: 'Gross ticket sales',
                  color: '#d97706'
                },
              ].map(card => (
                <div key={card.label} style={{
                  background: 'var(--bg-card)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  boxShadow: 'var(--shadow-sm)',
                  padding: isMobile
                    ? '14px 12px' : '20px',
                  borderTop: `3px solid ${card.color}`
                }}>
                  {!isMobile && (
                    <div style={{
                      fontSize: '1.5rem',
                      marginBottom: '8px'
                    }}>
                      {card.icon}
                    </div>
                  )}
                  <div style={{
                    fontSize: isMobile
                      ? '1rem' : '1.3rem',
                    fontWeight: 800,
                    color: card.color,
                    marginBottom: '4px'
                  }}>
                    {card.value}
                  </div>
                  <div style={{
                    fontSize: isMobile
                      ? '0.72rem' : '0.82rem',
                    color: 'var(--text-secondary)',
                    fontWeight: 600
                  }}>
                    {card.label}
                  </div>
                  {!isMobile && (
                    <div style={{
                      fontSize: '0.72rem',
                      color: 'var(--text-muted)',
                      marginTop: '3px'
                    }}>
                      {card.sub}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Events performance table */}
            <div style={{
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-md)',
              overflow: 'hidden'
            }}>
              <div style={{
                padding: '16px 20px',
                borderBottom:
                  '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <h3 style={{
                  margin: 0, fontSize: '1rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)'
                }}>
                  🏆 Events Performance
                </h3>
                <span style={{
                  fontSize: '0.82rem',
                  color: 'var(--text-muted)'
                }}>
                  Sorted by revenue
                </span>
              </div>

              {data.events.length === 0 ? (
                <div style={{
                  padding: '48px 20px',
                  textAlign: 'center',
                  color: 'var(--text-secondary)'
                }}>
                  <div style={{
                    fontSize: '2.5rem',
                    marginBottom: '12px'
                  }}>
                    🎪
                  </div>
                  <p style={{margin: 0}}>
                    No events yet. Create your first
                    event to see analytics!
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      navigate('/create-event')
                    }
                    style={{
                      marginTop: '16px',
                      background:
                        'linear-gradient(135deg, #4c1d95, #7c3aed)',
                      color: 'white', border: 'none',
                      borderRadius: '10px',
                      padding: '10px 24px',
                      cursor: 'pointer',
                      fontWeight: 700
                    }}
                  >
                    + Create Event
                  </button>
                </div>
              ) : isMobile ? (
                /* MOBILE: Cards */
                <div style={{padding: '12px'}}>
                  {data.events.map((ev, idx) => {
                    const color =
                      getCategoryColor(ev.category)
                    return (
                      <div key={ev.id} style={{
                        background:
                          'var(--bg-secondary)',
                        borderRadius:
                          'var(--radius-md)',
                        border:
                          '1px solid var(--border-color)',
                        padding: '14px',
                        marginBottom: '10px'
                      }}>
                        <div style={{
                          display: 'flex', gap: '10px',
                          alignItems: 'flex-start',
                          marginBottom: '10px'
                        }}>
                          <span style={{
                            fontSize: '1.2rem'
                          }}>
                            {idx === 0 ? '🥇'
                              : idx === 1 ? '🥈'
                              : idx === 2 ? '🥉'
                              : `#${idx+1}`}
                          </span>
                          <div style={{flex: 1}}>
                            <div style={{
                              fontWeight: 700,
                              fontSize: '0.875rem',
                              color: 'var(--text-primary)',
                              marginBottom: '2px'
                            }}>
                              {ev.title}
                            </div>
                            <div style={{
                              fontSize: '0.72rem',
                              color: 'var(--text-muted)'
                            }}>
                              {formatDate(ev.event_date)}
                            </div>
                          </div>
                          <span style={{
                            background:
                              ev.status === 'active'
                                ? '#dcfce7'
                                : ev.status === 'cancelled'
                                ? '#fee2e2' : '#e0f2fe',
                            color:
                              ev.status === 'active'
                                ? '#16a34a'
                                : ev.status === 'cancelled'
                                ? '#dc2626' : '#0369a1',
                            padding: '2px 8px',
                            borderRadius: '999px',
                            fontSize: '0.68rem',
                            fontWeight: 700
                          }}>
                            {ev.status}
                          </span>
                        </div>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns:
                            'repeat(3, 1fr)',
                          gap: '8px'
                        }}>
                          {[
                            {
                              l: 'Tickets',
                              v: ev.tickets_sold,
                              c: color
                            },
                            {
                              l: 'Fill Rate',
                              v: ev.fill_rate + '%',
                              c: ev.fill_rate >= 80
                                ? '#16a34a'
                                : ev.fill_rate >= 50
                                ? '#d97706' : '#6b7280'
                            },
                            {
                              l: 'Revenue',
                              v: ev.is_free ? 'FREE'
                                : 'PKR ' +
                                  ev.revenue.toLocaleString(
                                    'en-PK'
                                  ),
                              c: '#7c3aed'
                            },
                          ].map(stat => (
                            <div key={stat.l} style={{
                              background:
                                'var(--bg-card)',
                              borderRadius: '8px',
                              padding: '8px',
                              textAlign: 'center'
                            }}>
                              <div style={{
                                fontSize: '0.65rem',
                                color:
                                  'var(--text-muted)',
                                marginBottom: '3px'
                              }}>
                                {stat.l}
                              </div>
                              <div style={{
                                fontWeight: 700,
                                fontSize: '0.82rem',
                                color: stat.c
                              }}>
                                {stat.v}
                              </div>
                            </div>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/events/${ev.id}/attendees`
                            )
                          }
                          style={{
                            width: '100%',
                            marginTop: '10px',
                            padding: '7px',
                            borderRadius: '8px',
                            border: `1px solid ${color}44`,
                            background: color + '12',
                            color: color,
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '0.8rem'
                          }}
                        >
                          👥 View Attendees
                        </button>
                      </div>
                    )
                  })}
                </div>
              ) : (
                /* DESKTOP: Table */
                <div>
                  {/* Header */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns:
                      '2.5fr 0.8fr 0.8fr 0.8fr 1fr 0.8fr 100px',
                    padding: '10px 20px',
                    fontSize: '0.72rem', fontWeight: 700,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    borderBottom:
                      '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)'
                  }}>
                    <span>Event</span>
                    <span>Date</span>
                    <span>Tickets</span>
                    <span>Fill Rate</span>
                    <span>Revenue</span>
                    <span>Status</span>
                    <span>Action</span>
                  </div>

                  {data.events.map((ev, idx) => {
                    const color =
                      getCategoryColor(ev.category)
                    return (
                      <div key={ev.id} style={{
                        display: 'grid',
                        gridTemplateColumns:
                          '2.5fr 0.8fr 0.8fr 0.8fr 1fr 0.8fr 100px',
                        padding: '14px 20px',
                        borderBottom:
                          idx < data.events.length-1
                            ? '1px solid var(--border-color)'
                            : 'none',
                        alignItems: 'center',
                        transition: 'background 0.15s'
                      }}
                        onMouseEnter={rowEv =>
                          rowEv.currentTarget.style
                            .background =
                            'var(--bg-secondary)'
                        }
                        onMouseLeave={rowEv =>
                          rowEv.currentTarget.style
                            .background = 'transparent'
                        }
                      >
                        {/* Event title */}
                        <div>
                          <div style={{
                            display: 'flex',
                            gap: '6px',
                            alignItems: 'center',
                            marginBottom: '2px'
                          }}>
                            <span style={{
                              fontSize: '1rem'
                            }}>
                              {idx === 0 ? '🥇'
                                : idx === 1 ? '🥈'
                                : idx === 2 ? '🥉'
                                : `#${idx+1}`}
                            </span>
                            <span style={{
                              fontWeight: 700,
                              fontSize: '0.875rem',
                              color: 'var(--text-primary)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {ev.title}
                            </span>
                          </div>
                          <div style={{
                            fontSize: '0.72rem',
                            color: 'var(--text-muted)',
                            marginLeft: '22px'
                          }}>
                            {ev.category}
                          </div>
                        </div>

                        {/* Date */}
                        <div style={{
                          fontSize: '0.8rem',
                          color: 'var(--text-secondary)'
                        }}>
                          {formatDate(ev.event_date)}
                        </div>

                        {/* Tickets sold */}
                        <div style={{
                          fontWeight: 700, color: color
                        }}>
                          {ev.tickets_sold}
                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: 400,
                            color: 'var(--text-muted)',
                            marginLeft: '2px'
                          }}>
                            /{ev.total_capacity}
                          </span>
                        </div>

                        {/* Fill rate */}
                        <div>
                          <div style={{
                            fontWeight: 700,
                            fontSize: '0.875rem',
                            color: ev.fill_rate >= 80
                              ? '#16a34a'
                              : ev.fill_rate >= 50
                              ? '#d97706' : '#6b7280',
                            marginBottom: '3px'
                          }}>
                            {ev.fill_rate}%
                          </div>
                          <div style={{
                            height: '4px',
                            background:
                              'var(--border-color)',
                            borderRadius: '2px',
                            overflow: 'hidden',
                            width: '60px'
                          }}>
                            <div style={{
                              width: `${ev.fill_rate}%`,
                              height: '100%',
                              background: ev.fill_rate
                                >= 80 ? '#16a34a'
                                : ev.fill_rate >= 50
                                ? '#d97706' : '#6b7280',
                              borderRadius: '2px'
                            }} />
                          </div>
                        </div>

                        {/* Revenue */}
                        <div>
                          <div style={{
                            fontWeight: 700,
                            color: ev.is_free
                              ? '#16a34a'
                              : 'var(--accent)',
                            fontSize: '0.875rem'
                          }}>
                            {ev.is_free ? 'FREE EVENT'
                              : `PKR ${ev.revenue
                                  .toLocaleString(
                                    'en-PK'
                                  )}`
                            }
                          </div>
                          {!ev.is_free && (
                            <div style={{
                              fontSize: '0.72rem',
                              color: 'var(--text-muted)'
                            }}>
                              PKR {ev.earnings
                                .toLocaleString('en-PK')}
                              {' '}yours
                            </div>
                          )}
                        </div>

                        {/* Status */}
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: '999px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          background:
                            ev.status === 'active'
                              ? '#dcfce7'
                              : ev.status === 'cancelled'
                              ? '#fee2e2' : '#e0f2fe',
                          color:
                            ev.status === 'active'
                              ? '#16a34a'
                              : ev.status === 'cancelled'
                              ? '#dc2626' : '#0369a1'
                        }}>
                          {ev.status}
                        </span>

                        {/* Action */}
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/events/${ev.id}/attendees`
                            )
                          }
                          style={{
                            padding: '6px 12px',
                            borderRadius: '7px',
                            border:
                              `1px solid ${color}44`,
                            background: color + '12',
                            color: color,
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '0.78rem'
                          }}
                        >
                          👥 Attendees
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
