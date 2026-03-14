import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import api from '../api/axios'
import { getImageUrl } from '../utils/image'

export default function BookingForm() {
  const { listingId } = useParams()
  const [searchParams] = useSearchParams()
  const roomTypeId = searchParams.get('room_type_id')
  const roomTypeName = searchParams.get('room_name')
  const navigate = useNavigate()
  const [listing, setListing] = useState(null)
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [nights, setNights] = useState(0)
  const [totalPrice, setTotalPrice] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [roomPrice, setRoomPrice] = useState(null)

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (roomTypeId && listingId) {
      api.get('/room-types/' + listingId)
        .then(res => {
          const room = res.data.find(
            r => r.id === parseInt(roomTypeId, 10)
          )
          if (room) setRoomPrice(room.price_per_night)
        })
        .catch(console.error)
    }
  }, [roomTypeId, listingId])

  useEffect(() => {
    if (!listingId) {
      setLoading(false)
      return
    }
    api
      .get(`/listings/${listingId}`)
      .then((r) => setListing(r.data))
      .catch((e) => {
        console.error('Failed to load listing', e)
        setListing(null)
      })
      .finally(() => setLoading(false))
  }, [listingId])

  useEffect(() => {
    const pricePerNight = roomPrice ?? listing?.price_per_night ?? 0
    if (checkIn && checkOut && checkIn < checkOut) {
      const n = Math.round(
        (new Date(checkOut) - new Date(checkIn))
        / (1000 * 60 * 60 * 24)
      )
      setNights(n)
      setTotalPrice(n * pricePerNight)
    } else {
      setNights(0)
      setTotalPrice(0)
    }
  }, [checkIn, checkOut, listing, roomPrice])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!checkIn || !checkOut) {
      setError('Please select check-in and check-out dates')
      return
    }
    if (checkIn >= checkOut) {
      setError('Check-out must be after check-in')
      return
    }
    if (!listingId) {
      setError('Missing listing id')
      return
    }
    setSubmitting(true)
    try {
      await api.post('/bookings/', {
        listing_id: parseInt(listingId, 10),
        check_in: checkIn,
        check_out: checkOut,
        room_type_id: roomTypeId ? parseInt(roomTypeId, 10) : null,
      })
      navigate('/my-bookings')
    } catch (e) {
      setError(e.response?.data?.detail || 'Booking failed')
    } finally {
      setSubmitting(false)
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

  if (!listing)
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
        Listing not found.
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
      <div style={{ maxWidth: '780px', margin: '0 auto' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '0.9rem',
            marginBottom: '24px',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          ← Back
        </button>

        <h1
          style={{
            margin: '0 0 24px',
            fontSize: '1.6rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
          }}
        >
          Complete Your Booking
        </h1>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 340px',
            gap: '24px',
            alignItems: 'start',
          }}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              padding: '28px',
            }}
          >
            <h2
              style={{
                margin: '0 0 20px',
                fontSize: '1.1rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
              }}
            >
              📅 Select Your Dates
            </h2>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label
                  style={{
                    display: 'block',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    marginBottom: '8px',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Check-in Date
                </label>
                <input
                  type="date"
                  value={checkIn}
                  min={today}
                  onChange={(e) => {
                    setCheckIn(e.target.value)
                    if (checkOut && e.target.value >= checkOut) {
                      setCheckOut('')
                    }
                  }}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '1rem',
                    boxSizing: 'border-box',
                    colorScheme: 'dark',
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label
                  style={{
                    display: 'block',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    marginBottom: '8px',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Check-out Date
                </label>
                <input
                  type="date"
                  value={checkOut}
                  min={checkIn || today}
                  onChange={(e) => setCheckOut(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '1rem',
                    boxSizing: 'border-box',
                    colorScheme: 'dark',
                  }}
                />
              </div>

              {nights > 0 && (
                <div
                  style={{
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '16px',
                    marginBottom: '20px',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '8px',
                    }}
                  >
                    <span style={{ color: 'var(--text-secondary)' }}>
                      PKR{' '}
                      {(roomPrice ?? listing?.price_per_night)
                        ?.toLocaleString('en-PK')}{' '}
                      × {nights} night{nights > 1 ? 's' : ''}
                    </span>
                    <span
                      style={{
                        color: 'var(--text-primary)',
                        fontWeight: 600,
                      }}
                    >
                      PKR {totalPrice.toLocaleString('en-PK')}
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      paddingTop: '10px',
                      borderTop: '1px solid var(--border-color)',
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                      }}
                    >
                      Total
                    </span>
                    <span
                      style={{
                        fontWeight: 800,
                        fontSize: '1.1rem',
                        color: 'var(--accent)',
                      }}
                    >
                      PKR {totalPrice.toLocaleString('en-PK')}
                    </span>
                  </div>
                </div>
              )}

              {error && (
                <div
                  style={{
                    padding: '12px 14px',
                    marginBottom: '16px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--danger-bg)',
                    color: 'var(--danger)',
                    fontSize: '0.875rem',
                  }}
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  padding: '14px',
                  fontSize: '1rem',
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                {submitting
                  ? 'Booking...'
                  : nights > 0
                  ? `Confirm Booking — PKR ${totalPrice.toLocaleString('en-PK')}`
                  : 'Select dates to continue'}
              </button>

              <p
                style={{
                  textAlign: 'center',
                  marginTop: '12px',
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                }}
              >
                ✅ Free cancellation anytime before check-in
              </p>
            </form>
          </div>

          <div
            style={{
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              overflow: 'hidden',
              position: 'sticky',
              top: '90px',
            }}
          >
            <img
              src={getImageUrl(listing.image_url)}
              alt={listing.title}
              onError={(e) => {
                e.target.onerror = null
                e.target.src =
                  'https://placehold.co/400x200/e5e7eb/9ca3af?text=GB+Tourism'
              }}
              style={{
                width: '100%',
                height: '180px',
                objectFit: 'cover',
                display: 'block',
              }}
            />
            <div style={{ padding: '20px' }}>
              <h3
                style={{
                  margin: '0 0 6px',
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                }}
              >
                {listing.title}
              </h3>
              {roomTypeName && (
                <div
                  style={{
                    display: 'inline-block',
                    background: 'var(--accent-light)',
                    color: 'var(--accent)',
                    padding: '3px 10px',
                    borderRadius: '999px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    marginBottom: '8px',
                  }}
                >
                  🛏️ {roomTypeName}
                </div>
              )}
              <p
                style={{
                  margin: '0 0 12px',
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)',
                }}
              >
                📍 {listing.location}
              </p>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--border-color)',
                }}
              >
                <span
                  style={{
                    color: 'var(--text-secondary)',
                    fontSize: '0.875rem',
                  }}
                >
                  Per night
                </span>
                <span
                  style={{
                    fontWeight: 800,
                    fontSize: '1.1rem',
                    color: 'var(--accent)',
                  }}
                >
                  PKR {(roomPrice ?? listing?.price_per_night)
                    ?.toLocaleString('en-PK')}
                </span>
              </div>
              {nights > 0 && (
                <div
                  style={{
                    marginTop: '10px',
                    padding: '10px 12px',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary)',
                  }}
                >
                  📅 {checkIn} → {checkOut}
                  <br />
                  <strong style={{ color: 'var(--text-primary)' }}>
                    {nights} night{nights > 1 ? 's' : ''}
                  </strong>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

