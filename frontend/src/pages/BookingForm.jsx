import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api/axios'
import { getImageUrl } from '../utils/image'

function BookingForm() {
  const navigate = useNavigate()
  const { listingId } = useParams()

  const [listing, setListing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [validationError, setValidationError] = useState('')
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

  const today = useMemo(
    () => new Date().toISOString().split('T')[0],
    [],
  )

  const minCheckout = useMemo(() => {
    if (!checkInDate) {
      const d = new Date()
      d.setDate(d.getDate() + 1)
      return d.toISOString().split('T')[0]
    }
    const d = new Date(checkInDate)
    d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
  }, [checkInDate])

  const handleCheckInChange = (value) => {
    setCheckInDate(value)
    setValidationError('')
    if (checkOutDate && value && checkOutDate <= value) {
      setCheckOutDate('')
    }
  }

  const handleCheckOutChange = (value) => {
    setCheckOutDate(value)
    setValidationError('')
  }

  const getServiceBadgeColor = (serviceType) => {
    switch (serviceType) {
      case 'hotel':
        return '#2563eb'
      case 'tour':
        return '#16a34a'
      case 'transport':
        return '#d97706'
      case 'activity':
        return '#7c3aed'
      default:
        return '#6b7280'
    }
  }

  const nights = useMemo(() => {
    if (!checkInDate || !checkOutDate) return 0
    const start = new Date(checkInDate)
    const end = new Date(checkOutDate)
    const diffMs = end.getTime() - start.getTime()
    const diffDays = diffMs / (1000 * 60 * 60 * 24)
    return diffDays > 0 ? diffDays : 0
  }, [checkInDate, checkOutDate])

  const totalPrice = listing && nights > 0 ? nights * listing.price_per_night : 0

  const formatPrice = (price) => {
    if (typeof price !== 'number') return '0'
    try {
      return price.toLocaleString('en-PK')
    } catch {
      return String(price)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setValidationError('')

    if (!listingId || !checkInDate || !checkOutDate) {
      setValidationError('Please select both check-in and check-out dates.')
      return
    }

    if (new Date(checkOutDate) <= new Date(checkInDate)) {
      setValidationError('Check-out date must be after check-in date.')
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
    maxWidth: '900px',
    margin: '0 auto',
    padding: '20px',
  }

  if (loading) {
    return (
      <div style={containerStyle}>
        <p style={{ textAlign: 'center' }}>Loading booking details...</p>
      </div>
    )
  }

  if (error && !listing) {
    return (
      <div style={containerStyle}>
        <p style={{ color: 'red' }}>{error}</p>
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '24px',
        }}
      >
        {/* Left column: listing summary */}
        <div
          style={{
            flex: '1.2 1 260px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            padding: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          }}
        >
          {listing && (
            <>
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '200px',
                  overflow: 'hidden',
                  borderRadius: '8px',
                  marginBottom: '12px',
                }}
              >
                <img
                  src={getImageUrl(listing.image_url)}
                  alt={listing.title || 'Listing image'}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                  onError={(e) => {
                    e.target.src = 'https://placehold.co/400x250?text=No+Image'
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    backgroundColor: getServiceBadgeColor(listing.service_type),
                    color: '#ffffff',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: '20px',
                    textTransform: 'capitalize',
                  }}
                >
                  {listing.service_type}
                </span>
              </div>

              <h1
                style={{
                  margin: '0 0 6px 0',
                  fontSize: '1.2rem',
                  fontWeight: 700,
                  color: '#111827',
                }}
              >
                {listing.title}
              </h1>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '0.9rem',
                  color: '#6b7280',
                  marginBottom: '8px',
                }}
              >
                <span style={{ marginRight: '4px' }}>📍</span>
                <span>{listing.location}</span>
              </div>

              <div
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: '#2563eb',
                }}
              >
                PKR {formatPrice(listing.price_per_night)} / night
              </div>
            </>
          )}
        </div>

        {/* Right column: booking form */}
        <div
          style={{
            flex: '1 1 260px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          }}
        >
          <h2
            style={{
              margin: '0 0 20px 0',
              fontSize: '1.2rem',
              fontWeight: 700,
              color: '#111827',
            }}
          >
            Book This Listing
          </h2>

          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label
                htmlFor="checkIn"
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  color: '#374151',
                  marginBottom: '2px',
                }}
              >
                Check-in Date
              </label>
              <input
                id="checkIn"
                type="date"
                value={checkInDate}
                onChange={(e) => handleCheckInChange(e.target.value)}
                required
                min={today}
                style={{
                  padding: '8px 10px',
                  fontSize: '0.95rem',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  width: '100%',
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label
                htmlFor="checkOut"
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  color: '#374151',
                  marginBottom: '2px',
                }}
              >
                Check-out Date
              </label>
              <input
                id="checkOut"
                type="date"
                value={checkOutDate}
                onChange={(e) => handleCheckOutChange(e.target.value)}
                required
                min={minCheckout}
                style={{
                  padding: '8px 10px',
                  fontSize: '0.95rem',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  width: '100%',
                }}
              />
            </div>

            {nights > 0 && listing && (
              <div
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '16px',
                  margin: '8px 0 4px 0',
                  fontSize: '0.9rem',
                  color: '#1f2933',
                }}
              >
                <div style={{ marginBottom: '4px' }}>
                  Duration:{' '}
                  <span style={{ fontWeight: 600 }}>{nights} nights</span>
                </div>
                <div style={{ marginBottom: '8px' }}>
                  Price per night: PKR{' '}
                  <span style={{ fontWeight: 600 }}>
                    {formatPrice(listing.price_per_night)}
                  </span>
                </div>
                <div
                  style={{
                    borderTop: '1px solid #e2e8f0',
                    margin: '8px 0',
                  }}
                />
                <div
                  style={{
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    color: '#2563eb',
                  }}
                >
                  Total: PKR {formatPrice(totalPrice)}
                </div>
              </div>
            )}

            {validationError && (
              <p
                style={{
                  color: 'red',
                  fontSize: '0.85rem',
                  margin: '4px 0 0 0',
                }}
              >
                {validationError}
              </p>
            )}

            {error && (
              <p
                style={{
                  color: 'red',
                  fontSize: '0.85rem',
                  margin: '4px 0 0 0',
                }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              style={{
                marginTop: '8px',
                padding: '11px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                cursor: submitting ? 'default' : 'pointer',
                opacity: submitting ? 0.85 : 1,
                fontSize: '1rem',
                fontWeight: 600,
                width: '100%',
              }}
            >
              {submitting ? 'Booking...' : 'Confirm Booking'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default BookingForm

