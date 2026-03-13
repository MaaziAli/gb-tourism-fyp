import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { getImageUrl } from '../utils/image'

function MyBookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancelErrors, setCancelErrors] = useState({})
  const navigate = useNavigate()

  const containerStyle = {
    background: 'var(--bg-primary)',
    minHeight: '100vh',
  }

  const listWrapperStyle = {
    maxWidth: '750px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  }

  const cardStyle = {
    backgroundColor: 'var(--bg-card)',
    borderRadius: '12px',
    border: '1px solid var(--border-color)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'row',
  }

  const imageWrapperStyle = {
    width: '160px',
    minHeight: '130px',
    flexShrink: 0,
    backgroundColor: 'var(--bg-secondary)',
  }

  const contentWrapperStyle = {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  }

  const statusBadgeStyle = (status) => {
    if (status === 'cancelled') {
      return {
        backgroundColor: '#fee2e2',
        color: '#991b1b',
        fontSize: '0.75rem',
        fontWeight: 600,
        padding: '3px 10px',
        borderRadius: '20px',
        display: 'inline-block',
      }
    }
    return {
      backgroundColor: '#d1fae5',
      color: '#065f46',
      fontSize: '0.75rem',
      fontWeight: 600,
      padding: '3px 10px',
      borderRadius: '20px',
      display: 'inline-block',
    }
  }

  const loadBookings = () => {
    setLoading(true)
    setError('')
    api
      .get('/bookings/me')
      .then(async (response) => {
        console.log('Loaded bookings response', response.data)
        const baseBookings = response.data || []

        const enriched = await Promise.all(
          baseBookings.map(async (booking) => {
            try {
              const listingRes = await api.get(`/listings/${booking.listing_id}`)
              return { ...booking, listing: listingRes.data }
            } catch (err) {
              console.error('Failed to load listing for booking', booking.id, {
                message: err.message,
                status: err.response?.status,
                data: err.response?.data,
              })
              return { ...booking, listing: null }
            }
          }),
        )

        setBookings(enriched)
      })
      .catch((err) => {
        setError(err.response?.data?.detail || 'Failed to load bookings.')
      })
      .finally(() => {
        setLoading(false)
      })
  }

  useEffect(() => {
    loadBookings()
  }, [])

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return
    }
    setCancelErrors((prev) => ({ ...prev, [bookingId]: '' }))
    try {
      await api.patch(`/bookings/${bookingId}/cancel`)
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, status: 'cancelled' } : b,
        ),
      )
    } catch (err) {
      console.error('Failed to cancel booking', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      })
      const msg =
        err.response?.data?.detail ||
        'Failed to cancel booking. Please try again later.'
      setCancelErrors((prev) => ({ ...prev, [bookingId]: msg }))
    }
  }

  const computeNights = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 0
    const start = new Date(checkIn)
    const end = new Date(checkOut)
    const diff = (end - start) / (1000 * 60 * 60 * 24)
    return diff > 0 ? diff : 0
  }

  const formatPrice = (price) => {
    if (typeof price !== 'number') return '0'
    try {
      return price.toLocaleString('en-PK')
    } catch {
      return String(price)
    }
  }

  if (loading) {
    return (
      <div className="page-container" style={containerStyle}>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
          Loading your bookings...
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page-container" style={containerStyle}>
        <p style={{ color: 'var(--danger)' }}>{error}</p>
      </div>
    )
  }

  if (!bookings.length) {
    return (
      <div className="page-container" style={containerStyle}>
        <div
          style={{
            maxWidth: '480px',
            margin: '40px auto',
            backgroundColor: 'var(--bg-card)',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            padding: '24px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '8px' }}>🗓️</div>
          <h2
            style={{
              margin: '0 0 4px 0',
              fontSize: '1.2rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}
          >
            No bookings yet
          </h2>
          <p
            style={{
              margin: '4px 0 16px 0',
              fontSize: '0.9rem',
              color: 'var(--text-secondary)',
            }}
          >
            Start exploring Gilgit-Baltistan and book your first trip!
          </p>
          <button
            type="button"
            onClick={() => navigate('/')}
            style={{
              padding: '9px 18px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'var(--accent)',
              color: '#ffffff',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 500,
            }}
          >
            Explore Listings
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container" style={containerStyle}>
      <div style={{ marginBottom: '32px' }}>
        <h1
          style={{
            margin: 0,
            fontSize: '2rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
          }}
        >
          My Bookings
        </h1>
        <p
          style={{
            marginTop: '6px',
            fontSize: '0.9rem',
            color: 'var(--text-secondary)',
          }}
        >
          Manage your upcoming and past trips
        </p>
      </div>

      <div style={listWrapperStyle}>
        {bookings.map((booking) => {
          const checkIn = booking.check_in
          const checkOut = booking.check_out
          const pricePerNight =
            booking.listing?.price_per_night ?? booking.price_per_night ?? 0

          const nights = computeNights(checkIn, checkOut)
          const totalPrice = nights * pricePerNight

          const title =
            booking.listing?.title ?? booking.title ?? 'Listing unavailable'
          const location =
            booking.listing?.location ?? booking.location ?? 'Unknown location'

          const totalText = formatPrice(totalPrice)

          return (
            <div key={booking.id} style={cardStyle}>
              <div style={imageWrapperStyle}>
                {booking.listing?.image_url ? (
                  <img
                    src={getImageUrl(booking.listing.image_url)}
                    alt={title || 'Listing image'}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                    onError={(e) => {
                      e.target.onerror = null
                      e.target.src =
                        'https://placehold.co/400x250/e5e7eb/9ca3af?text=GB+Tourism'
                    }}
                  />
                ) : (
                    <div
                  style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    color: 'var(--text-muted)',
                      fontSize: '2rem',
                    }}
                  >
                    🏨
                  </div>
                )}
              </div>

              <div style={contentWrapperStyle}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '8px',
                  }}
                >
                  <h2
                    style={{
                      margin: 0,
                      fontSize: '1rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                    }}
                  >
                    {title}
                  </h2>
                  <span style={statusBadgeStyle(booking.status)}>
                    {booking.status === 'cancelled' ? 'Cancelled' : 'Active'}
                  </span>
                </div>

                    <div
                  style={{
                    marginTop: '4px',
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <span style={{ marginRight: '4px' }}>📍</span>
                  <span>{location}</span>
                </div>

                    <div
                  style={{
                    marginTop: '6px',
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                  }}
                >
                  📅 Check-in: {checkIn} → Check-out: {checkOut}
                </div>

                    <div
                  style={{
                    marginTop: '4px',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                  }}
                >
                  {nights} nights · PKR {totalText} total
                </div>

                <div style={{ marginTop: 'auto' }}>
                  {booking.status === 'active' && (
                    <button
                      type="button"
                      onClick={() => handleCancel(booking.id)}
                      style={{
                        marginTop: '10px',
                        padding: '7px 16px',
                        borderRadius: '8px',
                        border: '1px solid var(--danger)',
                        backgroundColor: 'var(--bg-card)',
                        color: 'var(--danger)',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                      }}
                    >
                      Cancel Booking
                    </button>
                  )}
                  {cancelErrors[booking.id] && (
                    <p
                      style={{
                        marginTop: '6px',
                        fontSize: '0.8rem',
                        color: 'var(--danger)',
                      }}
                    >
                      {cancelErrors[booking.id]}
                    </p>
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

export default MyBookings

