import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { getImageUrl } from '../utils/image'

export default function MyBookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    fetchBookings()
  }, [])

  async function fetchBookings() {
    try {
      const res = await api.get('/bookings/me')
      const base = res.data || []
      const enriched = await Promise.all(
        base.map(async (b) => {
          try {
            const lr = await api.get(`/listings/${b.listing_id}`)
            return { ...b, listing: lr.data }
          } catch {
            return { ...b, listing: null }
          }
        }),
      )
      setBookings(enriched)
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  async function cancelBooking(id) {
    if (
      !window.confirm('Cancel this booking? This cannot be undone.')
    )
      return
    try {
      await api.patch(`/bookings/${id}/cancel`)
      fetchBookings()
    } catch (e) {
      alert(e.response?.data?.detail || 'Cancel failed')
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-PK', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  function getNights(checkIn, checkOut) {
    if (!checkIn || !checkOut) return null
    const d1 = new Date(checkIn)
    const d2 = new Date(checkOut)
    return Math.round((d2 - d1) / (1000 * 60 * 60 * 24))
  }

  const statusStyle = (status) => {
    if (status === 'active')
      return {
        background: '#dcfce7',
        color: '#15803d',
        padding: '3px 10px',
        borderRadius: '999px',
        fontSize: '0.75rem',
        fontWeight: 700,
      }
    if (status === 'cancelled')
      return {
        background: '#fee2e2',
        color: '#dc2626',
        padding: '3px 10px',
        borderRadius: '999px',
        fontSize: '0.75rem',
        fontWeight: 700,
      }
    return {
      background: '#f3f4f6',
      color: '#6b7280',
      padding: '3px 10px',
      borderRadius: '999px',
      fontSize: '0.75rem',
      fontWeight: 700,
    }
  }

  if (loading)
    return (
      <div
        style={{
          background: 'var(--bg-primary)',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-secondary)',
        }}
      >
        Loading...
      </div>
    )

  return (
    <div
      style={{
        background: 'var(--bg-primary)',
        minHeight: '100vh',
        padding: '32px 16px',
      }}
    >
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <h1
          style={{
            margin: '0 0 6px',
            fontSize: '1.6rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
          }}
        >
          My Bookings
        </h1>
        <p
          style={{
            margin: '0 0 28px',
            color: 'var(--text-secondary)',
          }}
        >
          Manage your upcoming and past trips
        </p>

        {error && (
          <div
            style={{
              padding: '14px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--danger-bg)',
              color: 'var(--danger)',
              marginBottom: '20px',
            }}
          >
            {error}
          </div>
        )}

        {bookings.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
            }}
          >
            <div
              style={{
                fontSize: '3rem',
                marginBottom: '12px',
              }}
            >
              🗓️
            </div>
            <h2
              style={{
                margin: '0 0 8px',
                color: 'var(--text-primary)',
                fontWeight: 700,
              }}
            >
              No bookings yet
            </h2>
            <p
              style={{
                margin: '0 0 20px',
                color: 'var(--text-secondary)',
              }}
            >
              Start exploring Gilgit-Baltistan and book your first trip!
            </p>
            <button className="btn-primary" onClick={() => navigate('/')}>
              Explore Listings
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            {bookings.map((b) => {
              const nights = getNights(b.check_in, b.check_out)
              const isActive = b.status === 'active'
              return (
                <div
                  key={b.id}
                  style={{
                    background: 'var(--bg-card)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    overflow: 'hidden',
                    display: 'flex',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <img
                    src={getImageUrl(b.listing?.image_url)}
                    alt={b.listing?.title || `Booking #${b.id}`}
                    onError={(e) => {
                      e.target.onerror = null
                      e.target.src =
                        'https://placehold.co/120x120/e5e7eb/9ca3af?text=GB'
                    }}
                    style={{
                      width: '130px',
                      minHeight: '130px',
                      objectFit: 'cover',
                      flexShrink: 0,
                    }}
                  />

                  <div
                    style={{
                      flex: 1,
                      padding: '18px 20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                      }}
                    >
                      <div>
                        <h3
                          style={{
                            margin: '0 0 4px',
                            fontWeight: 700,
                            fontSize: '1rem',
                            color: 'var(--text-primary)',
                          }}
                        >
                          {b.listing?.title || `Booking #${b.id}`}
                        </h3>
                        <p
                          style={{
                            margin: 0,
                            fontSize: '0.85rem',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          📍 {b.listing?.location}
                        </p>
                        {b.room_type_name && (
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              marginTop: '4px',
                              background: 'var(--accent-light)',
                              color: 'var(--accent)',
                              padding: '2px 10px',
                              borderRadius: '999px',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                            }}
                          >
                            🛏️ {b.room_type_name}
                          </div>
                        )}
                      </div>
                      <span style={statusStyle(b.status)}>
                        {b.status === 'active'
                          ? 'Active'
                          : b.status === 'cancelled'
                          ? 'Cancelled'
                          : b.status}
                      </span>
                    </div>

                    {b.check_in && b.check_out && (
                      <div
                        style={{
                          display: 'flex',
                          gap: '16px',
                          fontSize: '0.85rem',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        <span>
                          📅 Check-in:{' '}
                          <strong style={{ color: 'var(--text-primary)' }}>
                            {formatDate(b.check_in)}
                          </strong>
                        </span>
                        <span>
                          🏁 Check-out:{' '}
                          <strong style={{ color: 'var(--text-primary)' }}>
                            {formatDate(b.check_out)}
                          </strong>
                        </span>
                      </div>
                    )}

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.875rem',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {nights
                          ? `${nights} night${nights > 1 ? 's' : ''} · `
                          : ''}
                        <strong style={{ color: 'var(--accent)' }}>
                          PKR {b.total_price?.toLocaleString('en-PK')} total
                        </strong>
                      </span>

                      {isActive && (
                        <button
                          onClick={() => cancelBooking(b.id)}
                          style={{
                            background: 'var(--danger-bg)',
                            color: 'var(--danger)',
                            border: '1px solid var(--danger)',
                            borderRadius: '8px',
                            padding: '6px 14px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                          }}
                        >
                          Cancel Booking
                        </button>
                      )}
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


