import { useState, useEffect } from 'react'
import api from '../api/axios'

function Listings() {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedListingId, setSelectedListingId] = useState(null)
  const [checkInDate, setCheckInDate] = useState('')
  const [checkOutDate, setCheckOutDate] = useState('')
  const [bookingMessage, setBookingMessage] = useState('')

  const handleOpenBookingForm = (listingId) => {
    setSelectedListingId(listingId)
    setCheckInDate('')
    setCheckOutDate('')
    setBookingMessage('')
  }

  const handleConfirmBooking = async () => {
    if (!selectedListingId || !checkInDate || !checkOutDate) {
      return
    }

    try {
      await api.post('/bookings', {
        listing_id: selectedListingId,
        check_in_date: checkInDate,
        check_out_date: checkOutDate,
      })
      setBookingMessage('Booking created successfully')
    } catch (err) {
      console.error('Failed to create booking', err)
      setBookingMessage('Failed to create booking')
    }
  }

  const handleCancelBooking = () => {
    setSelectedListingId(null)
    setCheckInDate('')
    setCheckOutDate('')
    setBookingMessage('')
  }

  useEffect(() => {
    api.get('/listings')
      .then((response) => {
        setListings(response.data)
      })
      .catch((err) => {
        setError(err.response?.data?.detail || 'Failed to load listings.')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  if (loading) {
    return <p>Loading listings...</p>
  }

  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>
  }

  if (listings.length === 0) {
    return (
      <div
        style={{
          maxWidth: '960px',
          margin: '40px auto',
          padding: '0 16px',
          textAlign: 'center',
        }}
      >
        <h1 style={{ marginBottom: '16px' }}>Listings</h1>
        <p>No listings available.</p>
      </div>
    )
  }

  return (
    <div
      style={{
        maxWidth: '960px',
        margin: '40px auto',
        padding: '0 16px',
      }}
    >
      <h1 style={{ marginBottom: '24px' }}>Listings</h1>
      <div>
        {listings.map((listing) => (
          <div
            key={listing.id}
            style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '16px 20px',
              marginBottom: '16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{listing.title}</h2>
            <p style={{ margin: 0 }}>
              <strong>Location:</strong> {listing.location}
            </p>
            <p style={{ margin: 0 }}>
              <strong>Price:</strong> ${listing.price_per_night} / night
            </p>
            <p style={{ margin: 0 }}>
              <strong>Service:</strong> {listing.service_type}
            </p>
            <div style={{ marginTop: '12px' }}>
              <button
                type="button"
                onClick={() => handleOpenBookingForm(listing.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '4px',
                  border: 'none',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                }}
              >
                Book Now
              </button>
              {selectedListingId === listing.id && (
                <div
                  style={{
                    marginTop: '12px',
                    paddingTop: '12px',
                    borderTop: '1px solid #eee',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <label style={{ fontSize: '0.85rem', marginBottom: '4px' }}>
                        Check-in date
                      </label>
                      <input
                        type="date"
                        value={checkInDate}
                        onChange={(e) => setCheckInDate(e.target.value)}
                        style={{ padding: '4px 6px', fontSize: '0.9rem' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <label style={{ fontSize: '0.85rem', marginBottom: '4px' }}>
                        Check-out date
                      </label>
                      <input
                        type="date"
                        value={checkOutDate}
                        onChange={(e) => setCheckOutDate(e.target.value)}
                        style={{ padding: '4px 6px', fontSize: '0.9rem' }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={handleConfirmBooking}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '4px',
                        border: 'none',
                        backgroundColor: '#16a34a',
                        color: '#ffffff',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                      }}
                    >
                      Confirm Booking
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelBooking}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '4px',
                        border: '1px solid #d1d5db',
                        backgroundColor: '#ffffff',
                        color: '#374151',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                  {bookingMessage && (
                    <p
                      style={{
                        margin: 0,
                        fontSize: '0.9rem',
                        color: bookingMessage.includes('successfully') ? 'green' : 'red',
                      }}
                    >
                      {bookingMessage}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Listings
