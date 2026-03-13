import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { getImageUrl } from '../utils/image'

export default function MyListings() {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [bookingsMap, setBookingsMap] = useState({})
  const [expandedId, setExpandedId] = useState(null)
  const [bookingsLoading, setBookingsLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchListings()
  }, [])

  async function fetchListings() {
    try {
      const res = await api.get('/listings/me')
      setListings(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function toggleBookings(listingId) {
    if (expandedId === listingId) {
      setExpandedId(null)
      return
    }
    setExpandedId(listingId)
    if (bookingsMap[listingId]) return
    setBookingsLoading(true)
    try {
      const res = await api.get(
        `/bookings/listing/${listingId}/bookings`,
      )
      setBookingsMap((prev) => ({
        ...prev,
        [listingId]: res.data,
      }))
    } catch (e) {
      console.error(e)
    } finally {
      setBookingsLoading(false)
    }
  }

  async function deleteListing(id) {
    if (
      !window.confirm(
        'Delete this listing? This cannot be undone.',
      )
    )
      return
    try {
      await api.delete(`/listings/${id}`)
      fetchListings()
      if (expandedId === id) setExpandedId(null)
    } catch (e) {
      alert(e.response?.data?.detail || 'Delete failed')
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

  function statusBadge(status) {
    const styles = {
      active: {
        background: '#dcfce7',
        color: '#15803d',
      },
      cancelled: {
        background: '#fee2e2',
        color: '#dc2626',
      },
      completed: {
        background: '#e0f2fe',
        color: '#0369a1',
      },
    }
    const s = styles[status] || styles.active
    return {
      ...s,
      padding: '2px 10px',
      borderRadius: '999px',
      fontSize: '0.72rem',
      fontWeight: 700,
      display: 'inline-block',
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
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '28px',
          }}
        >
          <div>
            <h1
              style={{
                margin: '0 0 4px',
                fontSize: '1.8rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
              }}
            >
              My Listings
            </h1>
            <p
              style={{
                margin: 0,
                color: 'var(--text-secondary)',
                fontSize: '0.9rem',
              }}
            >
              {listings.length} listing
              {listings.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => navigate('/my-analytics')}
              style={{
                background: 'var(--bg-secondary)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                padding: '9px 18px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.9rem',
              }}
            >
              📊 Analytics
            </button>
            <button
              className="btn-primary"
              onClick={() => navigate('/add-listing')}
            >
              + Add New Listing
            </button>
          </div>
        </div>

        {listings.length === 0 ? (
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
              🏨
            </div>
            <h2
              style={{
                margin: '0 0 8px',
                color: 'var(--text-primary)',
              }}
            >
              No listings yet
            </h2>
            <p
              style={{
                margin: '0 0 20px',
                color: 'var(--text-secondary)',
              }}
            >
              Create your first listing to start receiving bookings
            </p>
            <button
              className="btn-primary"
              onClick={() => navigate('/add-listing')}
            >
              Add First Listing
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0',
            }}
          >
            {listings.map((listing) => {
              const isExpanded = expandedId === listing.id
              const bookings = bookingsMap[listing.id] || []
              const activeCount = bookings.filter(
                (b) => b.status === 'active',
              ).length

              return (
                <div key={listing.id} style={{ marginBottom: '16px' }}>
                  {/* Listing Card */}
                  <div
                    style={{
                      background: 'var(--bg-card)',
                      borderRadius: isExpanded
                        ? 'var(--radius-md) var(--radius-md) 0 0'
                        : 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      borderBottom: isExpanded
                        ? 'none'
                        : '1px solid var(--border-color)',
                      overflow: 'hidden',
                      display: 'flex',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    {/* Image */}
                    <img
                      src={getImageUrl(listing.image_url)}
                      alt={listing.title}
                      onError={(e) => {
                        e.target.onerror = null
                        e.target.src =
                          'https://placehold.co/120x120/e5e7eb/9ca3af?text=GB'
                      }}
                      style={{
                        width: 120,
                        height: 120,
                        objectFit: 'cover',
                        flexShrink: 0,
                      }}
                    />

                    {/* Info */}
                    <div
                      style={{
                        flex: 1,
                        padding: '16px 20px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '16px',
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            display: 'flex',
                            gap: '8px',
                            alignItems: 'center',
                            marginBottom: '4px',
                          }}
                        >
                          <span
                            style={{
                              background: 'var(--accent-light)',
                              color: 'var(--accent)',
                              padding: '2px 8px',
                              borderRadius: '999px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                            }}
                          >
                            {listing.service_type?.toUpperCase()}
                          </span>
                        </div>
                        <h3
                          style={{
                            margin: '0 0 4px',
                            fontWeight: 700,
                            fontSize: '1rem',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                          }}
                          onClick={() =>
                            navigate(`/listing/${listing.id}`)
                          }
                        >
                          {listing.title}
                        </h3>
                        <p
                          style={{
                            margin: '0 0 6px',
                            fontSize: '0.85rem',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          📍 {listing.location} · PKR{' '}
                          {listing.price_per_night?.toLocaleString(
                            'en-PK',
                          )}
                          /night
                        </p>
                      </div>

                      {/* Actions */}
                      <div
                        style={{
                          display: 'flex',
                          gap: '8px',
                          alignItems: 'center',
                          flexShrink: 0,
                          flexWrap: 'wrap',
                          justifyContent: 'flex-end',
                        }}
                      >
                        <button
                          onClick={() => toggleBookings(listing.id)}
                          style={{
                            background: isExpanded
                              ? 'var(--accent)'
                              : 'var(--bg-secondary)',
                            color: isExpanded
                              ? 'white'
                              : 'var(--text-secondary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            padding: '7px 14px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                          }}
                        >
                          📅 Bookings
                          {bookingsMap[listing.id] && (
                            <span
                              style={{
                                marginLeft: '6px',
                                background: isExpanded
                                  ? 'rgba(255,255,255,0.3)'
                                  : 'var(--accent)',
                                color: 'white',
                                borderRadius: '999px',
                                padding: '1px 7px',
                                fontSize: '0.72rem',
                              }}
                            >
                              {bookings.length}
                            </span>
                          )}
                        </button>
                        <button
                          onClick={() =>
                            navigate(`/edit-listing/${listing.id}`)
                          }
                          style={{
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            padding: '7px 14px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                          }}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => deleteListing(listing.id)}
                          style={{
                            background: 'var(--danger-bg)',
                            color: 'var(--danger)',
                            border: '1px solid var(--danger)',
                            borderRadius: '8px',
                            padding: '7px 14px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                          }}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Bookings Panel */}
                  {isExpanded && (
                    <div
                      style={{
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        borderTop: 'none',
                        borderRadius:
                          '0 0 var(--radius-md) var(--radius-md)',
                        overflow: 'hidden',
                      }}
                    >
                      {bookingsLoading && !bookingsMap[listing.id] ? (
                        <div
                          style={{
                            padding: '24px',
                            textAlign: 'center',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          Loading bookings...
                        </div>
                      ) : bookings.length === 0 ? (
                        <div
                          style={{
                            padding: '24px',
                            textAlign: 'center',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          No bookings yet for this listing.
                        </div>
                      ) : (
                        <div>
                          {/* Table header */}
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns:
                                '1.5fr 1fr 1fr 0.8fr 1fr 0.8fr',
                              padding: '10px 20px',
                              borderBottom:
                                '1px solid var(--border-color)',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              color: 'var(--text-muted)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                            }}
                          >
                            <span>Guest</span>
                            <span>Check-in</span>
                            <span>Check-out</span>
                            <span>Nights</span>
                            <span>Total</span>
                            <span>Status</span>
                          </div>

                          {/* Booking rows */}
                          {bookings.map((b, i) => (
                            <div
                              key={b.id}
                              style={{
                                display: 'grid',
                                gridTemplateColumns:
                                  '1.5fr 1fr 1fr 0.8fr 1fr 0.8fr',
                                padding: '12px 20px',
                                borderBottom:
                                  i < bookings.length - 1
                                    ? '1px solid var(--border-color)'
                                    : 'none',
                                alignItems: 'center',
                              }}
                            >
                              <div>
                                <div
                                  style={{
                                    fontWeight: 600,
                                    color: 'var(--text-primary)',
                                    fontSize: '0.875rem',
                                  }}
                                >
                                  {b.guest_name}
                                </div>
                                <div
                                  style={{
                                    fontSize: '0.75rem',
                                    color: 'var(--text-muted)',
                                  }}
                                >
                                  {b.guest_email}
                                </div>
                              </div>
                              <span
                                style={{
                                  color: 'var(--text-primary)',
                                  fontSize: '0.875rem',
                                }}
                              >
                                {formatDate(b.check_in)}
                              </span>
                              <span
                                style={{
                                  color: 'var(--text-primary)',
                                  fontSize: '0.875rem',
                                }}
                              >
                                {formatDate(b.check_out)}
                              </span>
                              <span
                                style={{
                                  color: 'var(--text-secondary)',
                                  fontSize: '0.875rem',
                                }}
                              >
                                {b.nights ?? '—'}
                              </span>
                              <span
                                style={{
                                  fontWeight: 700,
                                  color: 'var(--accent)',
                                  fontSize: '0.875rem',
                                }}
                              >
                                PKR{' '}
                                {b.total_price?.toLocaleString('en-PK')}
                              </span>
                              <span style={statusBadge(b.status)}>
                                {b.status}
                              </span>
                            </div>
                          ))}

                          {/* Revenue summary */}
                          <div
                            style={{
                              padding: '12px 20px',
                              borderTop:
                                '1px solid var(--border-color)',
                              display: 'flex',
                              justifyContent: 'flex-end',
                              gap: '20px',
                            }}
                          >
                            <span
                              style={{
                                fontSize: '0.85rem',
                                color: 'var(--text-secondary)',
                              }}
                            >
                              {activeCount} active booking
                              {activeCount !== 1 ? 's' : ''}
                            </span>
                            <span
                              style={{
                                fontSize: '0.85rem',
                                fontWeight: 700,
                                color: '#10b981',
                              }}
                            >
                              Total revenue: PKR{' '}
                              {bookings
                                .filter((b) => b.status === 'active')
                                .reduce(
                                  (s, b) =>
                                    s + (b.total_price || 0),
                                  0,
                                )
                                .toLocaleString('en-PK')}
                            </span>
                          </div>
                        </div>
                      )}
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

