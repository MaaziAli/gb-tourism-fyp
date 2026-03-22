import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import useWindowSize from '../hooks/useWindowSize'

export default function MyBookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancellingId, setCancellingId] = useState(null)
  const [filter, setFilter] = useState('all')
  const navigate = useNavigate()
  const { isMobile } = useWindowSize()

  useEffect(() => { fetchBookings() }, [])

  async function fetchBookings() {
    try {
      const res = await api.get('/bookings/me')
      setBookings(res.data)
    } catch(e) {
      setError(
        e.response?.data?.detail || 'Failed to load bookings'
      )
    } finally {
      setLoading(false)
    }
  }

  async function cancelBooking(id) {
    if (!window.confirm(
      'Cancel this booking? This cannot be undone.'
    )) return
    setCancellingId(id)
    try {
      await api.patch(`/bookings/${id}/cancel`)
      setBookings(prev => prev.map(b =>
        b.id === id ? { ...b, status: 'cancelled' } : b
      ))
    } catch(e) {
      alert(e.response?.data?.detail || 'Cancel failed')
    } finally {
      setCancellingId(null)
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-PK', {
      day: 'numeric', month: 'short', year: 'numeric'
    })
  }

  function getNights(checkIn, checkOut) {
    if (!checkIn || !checkOut) return 0
    return Math.round(
      (new Date(checkOut) - new Date(checkIn))
      / (1000 * 60 * 60 * 24)
    )
  }

  function isUpcoming(checkIn) {
    if (!checkIn) return false
    return new Date(checkIn) >= new Date()
  }

  const filtered = bookings.filter(b => {
    if (filter === 'active') return b.status === 'active'
    if (filter === 'cancelled')
      return b.status === 'cancelled'
    return true
  })

  const counts = {
    all: bookings.length,
    active: bookings.filter(b => b.status === 'active').length,
    cancelled: bookings.filter(
      b => b.status === 'cancelled'
    ).length,
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
        padding: '40px 16px 80px'
      }}>
        <div style={{
          maxWidth: '800px', margin: '0 auto'
        }}>
          <h1 style={{
            color: 'white', margin: '0 0 6px',
            fontSize: '1.8rem', fontWeight: 800
          }}>
            My Bookings
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.75)',
            margin: '0 0 24px', fontSize: '0.9rem'
          }}>
            Manage your upcoming and past trips
          </p>

          {/* Stats row */}
          <div style={{
            display: 'inline-flex',
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '12px', overflow: 'hidden'
          }}>
            {[
              { key: 'all', label: 'Total', count: counts.all },
              { key: 'active', label: 'Active', count: counts.active },
              { key: 'cancelled', label: 'Cancelled', count: counts.cancelled },
            ].map((s, i, arr) => (
              <div key={s.key}
                onClick={() => setFilter(s.key)}
                style={{
                  padding: '12px 20px',
                  borderRight: i < arr.length - 1
                    ? '1px solid rgba(255,255,255,0.12)'
                    : 'none',
                  cursor: 'pointer', textAlign: 'center',
                  background: filter === s.key
                    ? 'rgba(255,255,255,0.15)'
                    : 'transparent',
                  transition: 'background 0.15s'
                }}
              >
                <div style={{
                  fontSize: '1.3rem', fontWeight: 800,
                  color: 'white', lineHeight: 1
                }}>
                  {s.count}
                </div>
                <div style={{
                  fontSize: '0.72rem',
                  color: 'rgba(255,255,255,0.6)',
                  marginTop: '3px', fontWeight: 500
                }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{
        maxWidth: '800px',
        margin: '-48px auto 0',
        padding: '0 16px'
      }}>

        {/* Filter tabs */}
        <div style={{
          display: 'flex', gap: '8px',
          marginBottom: '20px', flexWrap: 'wrap'
        }}>
          {[
            { key: 'all', label: '🗂️ All Bookings' },
            { key: 'active', label: '✅ Active' },
            { key: 'cancelled', label: '❌ Cancelled' },
          ].map(t => (
            <button key={t.key}
              onClick={() => setFilter(t.key)}
              style={{
                padding: '8px 18px',
                borderRadius: '999px', border: 'none',
                background: filter === t.key
                  ? 'var(--accent)'
                  : 'var(--bg-card)',
                color: filter === t.key
                  ? 'white' : 'var(--text-secondary)',
                fontWeight: 600, fontSize: '0.85rem',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-sm)',
                border: filter === t.key
                  ? 'none'
                  : '1px solid var(--border-color)',
                transition: 'all 0.15s'
              }}
            >
              {t.label}
              <span style={{
                marginLeft: '6px',
                background: filter === t.key
                  ? 'rgba(255,255,255,0.25)'
                  : 'var(--bg-secondary)',
                color: filter === t.key
                  ? 'white' : 'var(--text-muted)',
                borderRadius: '999px',
                padding: '1px 7px',
                fontSize: '0.72rem'
              }}>
                {counts[t.key]}
              </span>
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            padding: '60px 20px', textAlign: 'center',
            boxShadow: 'var(--shadow-md)'
          }}>
            <div style={{
              fontSize: '2rem', marginBottom: '12px'
            }}>⏳</div>
            <p style={{
              color: 'var(--text-secondary)', margin: 0
            }}>
              Loading your bookings...
            </p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div style={{
            background: 'var(--danger-bg)',
            border: '1px solid var(--danger)',
            borderRadius: 'var(--radius-md)',
            padding: '16px 20px',
            color: 'var(--danger)', fontWeight: 600,
            fontSize: '0.9rem'
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filtered.length === 0 && (
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
              {filter === 'cancelled' ? '❌' : '🗓️'}
            </div>
            <h2 style={{
              margin: '0 0 8px', fontSize: '1.2rem',
              fontWeight: 700,
              color: 'var(--text-primary)'
            }}>
              {filter === 'all'
                ? 'No bookings yet'
                : filter === 'active'
                ? 'No active bookings'
                : 'No cancelled bookings'
              }
            </h2>
            <p style={{
              margin: '0 0 24px',
              color: 'var(--text-secondary)',
              fontSize: '0.9rem'
            }}>
              {filter === 'all'
                ? 'Start exploring Gilgit-Baltistan and book your first trip!'
                : 'Try switching to a different filter'
              }
            </p>
            {filter === 'all' && (
              <button
                onClick={() => navigate('/')}
                style={{
                  background:
                    'linear-gradient(135deg, #1e3a5f, #0ea5e9)',
                  color: 'white', border: 'none',
                  borderRadius: '10px',
                  padding: '12px 28px',
                  cursor: 'pointer', fontWeight: 700,
                  fontSize: '0.9rem'
                }}
              >
                Explore Stays →
              </button>
            )}
          </div>
        )}

        {/* Bookings list */}
        {!loading && !error && filtered.length > 0 && (
          <div style={{
            display: 'flex', flexDirection: 'column',
            gap: '14px'
          }}>
            {filtered.map(b => {
              const nights = getNights(b.check_in, b.check_out)
              const upcoming = isUpcoming(b.check_in)
              const isActive = b.status === 'active'
              const isCancelling = cancellingId === b.id

              return (
                <div
                  key={b.id}
                  style={{
                    background: 'var(--bg-card)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow-sm)',
                    overflow: 'hidden',
                    opacity: isActive ? 1 : 0.75,
                  }}
                >
                  {/* Status bar at top */}
                  <div
                    style={{
                      height: '4px',
                      background: isActive
                        ? upcoming
                          ? 'linear-gradient(90deg, #0ea5e9, #6366f1)'
                          : 'linear-gradient(90deg, #16a34a, #0ea5e9)'
                        : '#e5e7eb',
                    }}
                  />

                  {isMobile ? (
                    <>
                      <div
                        onClick={() =>
                          navigate(`/listing/${b.listing_id}`)
                        }
                        style={{ cursor: 'pointer' }}
                      >
                        <img
                          src={
                            b.image_url
                              ? 'http://127.0.0.1:8000/uploads/' +
                                  b.image_url
                              : 'https://placehold.co/400x140/e5e7eb/9ca3af?text=GB'
                          }
                          alt={b.listing_title}
                          onError={(e) => {
                            e.target.onerror = null
                            e.target.src =
                              'https://placehold.co/400x140/e5e7eb/9ca3af?text=GB'
                          }}
                          style={{
                            width: '100%',
                            height: '140px',
                            objectFit: 'cover',
                            display: 'block',
                          }}
                        />
                      </div>
                      <div style={{ padding: '14px 16px' }}>
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
                              navigate(`/listing/${b.listing_id}`)
                            }
                            style={{
                              margin: 0,
                              fontWeight: 700,
                              fontSize: '0.95rem',
                              color: 'var(--text-primary)',
                              cursor: 'pointer',
                              flex: 1,
                            }}
                          >
                            {b.listing_title}
                          </h3>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '3px 10px',
                              borderRadius: '999px',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              flexShrink: 0,
                              background: isActive
                                ? upcoming
                                  ? 'var(--accent-light)'
                                  : '#dcfce7'
                                : 'var(--danger-bg)',
                              color: isActive
                                ? upcoming
                                  ? 'var(--accent)'
                                  : '#16a34a'
                                : 'var(--danger)',
                            }}
                          >
                            {isActive
                              ? upcoming
                                ? '⏳ Upcoming'
                                : '✅ Done'
                              : '❌ Cancelled'}
                          </span>
                        </div>
                        <p
                          style={{
                            margin: '0 0 6px',
                            fontSize: '0.82rem',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          📍 {b.location}
                        </p>
                        {b.room_type_name && (
                          <div
                            style={{
                              display: 'inline-block',
                              marginBottom: '8px',
                              background: 'var(--accent-light)',
                              color: 'var(--accent)',
                              padding: '2px 10px',
                              borderRadius: '999px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                            }}
                          >
                            🛏️ {b.room_type_name}
                          </div>
                        )}
                        <div
                          style={{
                            fontSize: '0.8rem',
                            color: 'var(--text-secondary)',
                            marginBottom: '10px',
                            display: 'flex',
                            gap: '6px',
                            flexWrap: 'wrap',
                            alignItems: 'center',
                          }}
                        >
                          <span>📅 {formatDate(b.check_in)}</span>
                          <span>→</span>
                          <span>🏁 {formatDate(b.check_out)}</span>
                          {nights > 0 && (
                            <span
                              style={{ color: 'var(--text-muted)' }}
                            >
                              · {nights} night
                              {nights > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        {b.is_group_booking && (
                          <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '6px',
                            alignItems: 'center',
                            marginBottom: '6px',
                          }}>
                            <div style={{
                              display: 'inline-flex',
                              alignItems: 'center', gap: '6px',
                              background: 'var(--accent-light)',
                              color: 'var(--accent)',
                              padding: '3px 10px', borderRadius: '999px',
                              fontSize: '0.75rem', fontWeight: 700,
                            }}>
                              👥 Group of {b.group_size}
                              {b.price_per_person != null && (
                                <span style={{
                                  fontWeight: 400,
                                  color: 'var(--text-secondary)',
                                }}>
                                  · PKR {b.price_per_person
                                    ?.toLocaleString('en-PK')}/person
                                </span>
                              )}
                            </div>
                            {b.group_discount_applied > 0 && (
                              <div style={{
                                display: 'inline-flex',
                                alignItems: 'center', gap: '4px',
                                background: '#dcfce7',
                                color: '#16a34a',
                                padding: '2px 8px', borderRadius: '999px',
                                fontSize: '0.72rem', fontWeight: 600,
                              }}>
                                🎉 Saved PKR {b.group_discount_applied
                                  ?.toLocaleString('en-PK')}
                              </div>
                            )}
                          </div>
                        )}
                        {b.special_requirements && (
                          <div style={{
                            fontSize: '0.78rem',
                            color: 'var(--text-muted)',
                            fontStyle: 'italic', marginTop: '4px',
                            marginBottom: '4px',
                          }}>
                            📋 {b.special_requirements}
                          </div>
                        )}
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '8px',
                          }}
                        >
                          <span
                            style={{
                              fontWeight: 800,
                              color: 'var(--accent)',
                              fontSize: '1rem',
                            }}
                          >
                            PKR{' '}
                            {b.total_price?.toLocaleString('en-PK')}
                            <span
                              style={{
                                fontSize: '0.72rem',
                                fontWeight: 400,
                                color: 'var(--text-muted)',
                                marginLeft: '4px',
                              }}
                            >
                              total
                            </span>
                          </span>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {isActive &&
                              b.payment_status !== 'paid' && (
                                <button
                                  onClick={() =>
                                    navigate('/payment/' + b.id)
                                  }
                                  style={{
                                    padding: '7px 14px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background:
                                      'linear-gradient(135deg, #16a34a, #15803d)',
                                    color: 'white',
                                    fontWeight: 700,
                                    fontSize: '0.8rem',
                                    cursor: 'pointer',
                                  }}
                                >
                                  💳 Pay
                                </button>
                              )}
                            {isActive &&
                              b.payment_status === 'paid' && (
                                <span
                                  style={{
                                    padding: '7px 12px',
                                    borderRadius: '8px',
                                    background: '#dcfce7',
                                    color: '#16a34a',
                                    fontWeight: 700,
                                    fontSize: '0.8rem',
                                  }}
                                >
                                  ✅ Paid
                                </span>
                              )}
                            {isActive && upcoming && (
                              <button
                                onClick={() => cancelBooking(b.id)}
                                disabled={isCancelling}
                                style={{
                                  padding: '7px 14px',
                                  borderRadius: '8px',
                                  border: '1px solid var(--danger)',
                                  background: 'var(--danger-bg)',
                                  color: 'var(--danger)',
                                  fontWeight: 600,
                                  fontSize: '0.8rem',
                                  cursor: 'pointer',
                                  opacity: isCancelling ? 0.6 : 1,
                                }}
                              >
                                {isCancelling ? '...' : 'Cancel'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div
                      style={{
                        display: 'flex',
                        gap: '0',
                        alignItems: 'stretch',
                      }}
                    >
                      <div
                        onClick={() =>
                          navigate(`/listing/${b.listing_id}`)
                        }
                        style={{
                          width: 110,
                          flexShrink: 0,
                          cursor: 'pointer',
                          overflow: 'hidden',
                        }}
                      >
                        <img
                          src={
                            b.image_url
                              ? 'http://127.0.0.1:8000/uploads/' +
                                  b.image_url
                              : 'https://placehold.co/110x110/e5e7eb/9ca3af?text=GB'
                          }
                          alt={b.listing_title}
                          onError={(e) => {
                            e.target.onerror = null
                            e.target.src =
                              'https://placehold.co/110x110/e5e7eb/9ca3af?text=GB'
                          }}
                          style={{
                            width: '100%',
                            height: '100%',
                            minHeight: 110,
                            objectFit: 'cover',
                            display: 'block',
                          }}
                        />
                      </div>
                      <div
                        style={{
                          flex: 1,
                          padding: '16px 18px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div>
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
                                navigate(`/listing/${b.listing_id}`)
                              }
                              style={{
                                margin: 0,
                                fontWeight: 700,
                                fontSize: '1rem',
                                color: 'var(--text-primary)',
                                cursor: 'pointer',
                                flex: 1,
                              }}
                            >
                              {b.listing_title}
                            </h3>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '3px 10px',
                                borderRadius: '999px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                flexShrink: 0,
                                background: isActive
                                  ? upcoming
                                    ? 'var(--accent-light)'
                                    : '#dcfce7'
                                  : 'var(--danger-bg)',
                                color: isActive
                                  ? upcoming
                                    ? 'var(--accent)'
                                    : '#16a34a'
                                  : 'var(--danger)',
                              }}
                            >
                              {isActive
                                ? upcoming
                                  ? '⏳ Upcoming'
                                  : '✅ Completed'
                                : '❌ Cancelled'}
                            </span>
                          </div>
                          <p
                            style={{
                              margin: '0 0 6px',
                              fontSize: '0.85rem',
                              color: 'var(--text-secondary)',
                            }}
                          >
                            📍 {b.location}
                          </p>
                          {b.room_type_name && (
                            <div
                              style={{
                                display: 'inline-block',
                                marginBottom: '8px',
                                background: 'var(--accent-light)',
                                color: 'var(--accent)',
                                padding: '2px 10px',
                                borderRadius: '999px',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                              }}
                            >
                              🛏️ {b.room_type_name}
                            </div>
                          )}
                          <div
                            style={{
                              display: 'flex',
                              gap: '16px',
                              flexWrap: 'wrap',
                              fontSize: '0.82rem',
                              color: 'var(--text-secondary)',
                            }}
                          >
                            <span>📅 {formatDate(b.check_in)}</span>
                            <span>→</span>
                            <span>🏁 {formatDate(b.check_out)}</span>
                            {nights > 0 && (
                              <span
                                style={{
                                  color: 'var(--text-muted)',
                                }}
                              >
                                · {nights} night
                                {nights > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                          {b.is_group_booking && (
                            <div style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: '6px',
                              alignItems: 'center',
                              marginBottom: '6px',
                            }}>
                              <div style={{
                                display: 'inline-flex',
                                alignItems: 'center', gap: '6px',
                                background: 'var(--accent-light)',
                                color: 'var(--accent)',
                                padding: '3px 10px', borderRadius: '999px',
                                fontSize: '0.75rem', fontWeight: 700,
                              }}>
                                👥 Group of {b.group_size}
                                {b.price_per_person != null && (
                                  <span style={{
                                    fontWeight: 400,
                                    color: 'var(--text-secondary)',
                                  }}>
                                    · PKR {b.price_per_person
                                      ?.toLocaleString('en-PK')}/person
                                  </span>
                                )}
                              </div>
                              {b.group_discount_applied > 0 && (
                                <div style={{
                                  display: 'inline-flex',
                                  alignItems: 'center', gap: '4px',
                                  background: '#dcfce7',
                                  color: '#16a34a',
                                  padding: '2px 8px', borderRadius: '999px',
                                  fontSize: '0.72rem', fontWeight: 600,
                                }}>
                                  🎉 Saved PKR {b.group_discount_applied
                                    ?.toLocaleString('en-PK')}
                                </div>
                              )}
                            </div>
                          )}
                          {b.special_requirements && (
                            <div style={{
                              fontSize: '0.78rem',
                              color: 'var(--text-muted)',
                              fontStyle: 'italic', marginTop: '4px',
                              marginBottom: '4px',
                            }}>
                              📋 {b.special_requirements}
                            </div>
                          )}
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginTop: '12px',
                            flexWrap: 'wrap',
                            gap: '8px',
                          }}
                        >
                          <span
                            style={{
                              fontWeight: 800,
                              color: 'var(--accent)',
                              fontSize: '1.05rem',
                            }}
                          >
                            PKR{' '}
                            {b.total_price?.toLocaleString(
                              'en-PK',
                            )}
                            <span
                              style={{
                                fontSize: '0.75rem',
                                fontWeight: 400,
                                color: 'var(--text-muted)',
                                marginLeft: '4px',
                              }}
                            >
                              total
                            </span>
                          </span>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {isActive &&
                              b.payment_status !== 'paid' && (
                                <button
                                  onClick={() =>
                                    navigate('/payment/' + b.id)
                                  }
                                  style={{
                                    padding: '7px 16px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background:
                                      'linear-gradient(135deg, #16a34a, #15803d)',
                                    color: 'white',
                                    fontWeight: 700,
                                    fontSize: '0.82rem',
                                    cursor: 'pointer',
                                  }}
                                >
                                  💳 Pay Now
                                </button>
                              )}
                            {isActive &&
                              b.payment_status === 'paid' && (
                                <span
                                  style={{
                                    padding: '7px 16px',
                                    borderRadius: '8px',
                                    background: '#dcfce7',
                                    color: '#16a34a',
                                    fontWeight: 700,
                                    fontSize: '0.82rem',
                                  }}
                                >
                                  ✅ Paid
                                </span>
                              )}
                            {isActive && upcoming && (
                              <button
                                onClick={() => cancelBooking(b.id)}
                                disabled={isCancelling}
                                style={{
                                  padding: '7px 16px',
                                  borderRadius: '8px',
                                  border: '1px solid var(--danger)',
                                  background: 'var(--danger-bg)',
                                  color: 'var(--danger)',
                                  fontWeight: 600,
                                  fontSize: '0.82rem',
                                  cursor: 'pointer',
                                  opacity: isCancelling ? 0.6 : 1,
                                }}
                              >
                                {isCancelling
                                  ? 'Cancelling...'
                                  : 'Cancel Booking'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
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
