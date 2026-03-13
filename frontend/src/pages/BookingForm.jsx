import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api/axios'

function BookingForm() {
  const navigate = useNavigate()
  const { listingId } = useParams()

  const [listing, setListing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [checkInDate, setCheckInDate] = useState('')
  const [checkOutDate, setCheckOutDate] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    api
      .get(`/listings/${listingId}`)
      .then((response) => {
        if (isMounted) {
          setListing(response.data)
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.response?.data?.detail || 'Failed to load listing.')
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [listingId])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!listingId || !checkInDate || !checkOutDate) {
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const payload = {
        listing_id: Number(listingId),
        check_in: checkInDate,
        check_out: checkOutDate,
      }
      console.log('Creating booking with payload', payload)
      await api.post('/bookings/', payload)
      navigate('/my-bookings')
    } catch (err) {
      console.error('Failed to create booking', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      })
      setError('Failed to create booking.')
    } finally {
      setSubmitting(false)
    }
  }

  const containerStyle = {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '20px',
  }

  const cardStyle = {
    maxWidth: '480px',
    margin: '40px auto',
    backgroundColor: 'var(--bg-card)',
    padding: '24px',
    borderRadius: '8px',
    boxShadow: 'var(--shadow-sm)',
  }

  if (loading) {
    return (
      <div className="page-container" style={containerStyle}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading booking details...</p>
      </div>
    )
  }

  if (error && !listing) {
    return (
      <div className="page-container" style={containerStyle}>
        <p style={{ color: 'var(--danger)' }}>{error}</p>
      </div>
    )
  }

  return (
    <div className="page-container" style={containerStyle}>
      <div style={cardStyle}>
        <h1 style={{ marginBottom: '16px', color: 'var(--text-primary)' }}>Book Listing</h1>
        {listing && (
          <div style={{ marginBottom: '16px' }}>
            <h2 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-primary)' }}>{listing.title}</h2>
            <p style={{ margin: '4px 0', color: 'var(--text-secondary)' }}>
              <strong>Location:</strong> {listing.location}
            </p>
            <p style={{ margin: '4px 0', color: 'var(--text-secondary)' }}>
              <strong>Price:</strong> ${listing.price_per_night} / night
            </p>
            {listing.description && (
              <p
                style={{
                  margin: '4px 0 0 0',
                  fontSize: '0.9rem',
                  color: 'var(--text-secondary)',
                }}
              >
                {listing.description}
              </p>
            )}
          </div>
        )}
        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label htmlFor="checkIn" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Check-in date</label>
            <input
              id="checkIn"
              type="date"
              value={checkInDate}
              onChange={(e) => setCheckInDate(e.target.value)}
              required
              style={{
                padding: '8px',
                fontSize: '0.95rem',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                width: '100%',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label htmlFor="checkOut" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Check-out date</label>
            <input
              id="checkOut"
              type="date"
              value={checkOutDate}
              onChange={(e) => setCheckOutDate(e.target.value)}
              required
              style={{
                padding: '8px',
                fontSize: '0.95rem',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                width: '100%',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
          {error && (
            <p style={{ color: 'var(--danger)', fontSize: '0.9rem', margin: 0 }}>{error}</p>
          )}
          <button
            type="submit"
            disabled={submitting}
            style={{
              marginTop: '4px',
              padding: '10px 16px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: 'var(--accent)',
              color: '#ffffff',
              cursor: submitting ? 'default' : 'pointer',
              opacity: submitting ? 0.8 : 1,
              fontSize: '1rem',
            }}
          >
            {submitting ? 'Booking...' : 'Confirm Booking'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default BookingForm

