import { useEffect, useState } from 'react'
import api from '../api/axios'

function MyBookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const containerStyle = {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '20px',
  }

  const cardStyle = {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    padding: '16px 20px',
    marginBottom: '16px',
    boxShadow: '0 1px 4px rgba(15, 23, 42, 0.08)',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  }

  const loadBookings = () => {
    setLoading(true)
    setError('')
    api
      .get('/bookings/me')
      .then(async (response) => {
        console.log('Loaded bookings response', response.data)
        const baseBookings = response.data || []

        // Fetch listing details for each booking and merge into booking.listing
        const withListings = await Promise.all(
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
              return booking
            }
          }),
        )

        setBookings(withListings)
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
    try {
      await api.delete(`/bookings/${bookingId}`)
      loadBookings()
    } catch (err) {
      console.error('Failed to cancel booking', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      })
      setError('Failed to cancel booking.')
    }
  }

  if (loading) {
    return (
      <div style={containerStyle}>
        <p>Loading bookings...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={containerStyle}>
        <p style={{ color: 'red' }}>{error}</p>
      </div>
    )
  }

  if (!bookings.length) {
    return (
      <div style={containerStyle}>
        <h1 style={{ marginBottom: '16px' }}>My Bookings</h1>
        <p>No bookings yet.</p>
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      <h1 style={{ marginBottom: '24px' }}>My Bookings</h1>
      <div>
        {bookings.map((booking) => {
          const checkIn = booking.check_in
          const checkOut = booking.check_out
          const pricePerNight =
            booking.listing?.price_per_night ?? booking.price_per_night ?? 0

          const nights =
            checkIn && checkOut
              ? (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)
              : 0
          const totalPrice = nights * pricePerNight

          const title = booking.listing?.title ?? booking.title ?? 'Listing'
          const location =
            booking.listing?.location ?? booking.location ?? 'Unknown'

          return (
            <div key={booking.id} style={cardStyle}>
              <h2 style={{ margin: 0, fontSize: '1.15rem' }}>{title}</h2>
              <p style={{ margin: 0 }}>
                <strong>Location:</strong> {location}
              </p>
              <p style={{ margin: 0 }}>
                <strong>Price per night:</strong> ${pricePerNight}
              </p>
              <p style={{ margin: 0 }}>
                <strong>Check-in:</strong> {checkIn}
              </p>
              <p style={{ margin: 0 }}>
                <strong>Check-out:</strong> {checkOut}
              </p>
              <p style={{ margin: 0 }}>
                <strong>Total nights:</strong> {nights}
              </p>
              <p style={{ margin: 0 }}>
                <strong>Total price:</strong> ${totalPrice}
              </p>
              <div style={{ marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => handleCancel(booking.id)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '6px',
                    border: '1px solid #dc2626',
                    backgroundColor: '#ffffff',
                    color: '#dc2626',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                  }}
                >
                  Cancel Booking
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default MyBookings

