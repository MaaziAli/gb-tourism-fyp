import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

function MyListings() {
  const navigate = useNavigate()
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedListingId, setExpandedListingId] = useState(null)
  const [bookingsByListing, setBookingsByListing] = useState({})

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

  const loadListings = () => {
    setLoading(true)
    setError('')
    api
      .get('/listings/me')
      .then((response) => {
        setListings(response.data || [])
      })
      .catch((err) => {
        setError(err.response?.data?.detail || 'Failed to load listings.')
      })
      .finally(() => {
        setLoading(false)
      })
  }

  useEffect(() => {
    loadListings()
  }, [])

  const handleDelete = async (listingId) => {
    try {
      await api.delete(`/listings/${listingId}`)
      loadListings()
    } catch (err) {
      console.error('Failed to delete listing', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      })
      setError('Failed to delete listing.')
    }
  }

  const toggleBookings = async (listingId) => {
    if (expandedListingId === listingId) {
      setExpandedListingId(null)
      return
    }
    if (bookingsByListing[listingId]) {
      setExpandedListingId(listingId)
      return
    }
    try {
      const res = await api.get(`/bookings/listing/${listingId}/bookings`)
      setBookingsByListing((prev) => ({ ...prev, [listingId]: res.data || [] }))
      setExpandedListingId(listingId)
    } catch (err) {
      console.error('Failed to load bookings for listing', listingId, {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      })
      setError('Failed to load bookings for this listing.')
    }
  }

  if (loading) {
    return (
      <div style={containerStyle}>
        <p>Loading listings...</p>
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

  if (!listings.length) {
    return (
      <div style={containerStyle}>
        <h1 style={{ marginBottom: '16px' }}>My Listings</h1>
        <p>You have not created any listings yet.</p>
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      <h1 style={{ marginBottom: '24px' }}>My Listings</h1>
      <div>
        {listings.map((listing) => {
          const bookings = bookingsByListing[listing.id] || []
          return (
            <div key={listing.id} style={cardStyle}>
              {listing.image_url && (
                <div
                  style={{
                    width: '100%',
                    height: '200px',
                    overflow: 'hidden',
                    borderRadius: '8px',
                    marginBottom: '8px',
                  }}
                >
                  <img
                    src={`http://127.0.0.1:8000/uploads/${listing.image_url}`}
                    alt={listing.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                </div>
              )}
              <h2 style={{ margin: 0, fontSize: '1.15rem' }}>{listing.title}</h2>
              <p style={{ margin: 0 }}>
                <strong>Location:</strong> {listing.location}
              </p>
              <p style={{ margin: 0 }}>
                <strong>Price per night:</strong> ${listing.price_per_night}
              </p>
              <p style={{ margin: 0 }}>
                <strong>Service:</strong> {listing.service_type}
              </p>
              <div
                style={{
                  marginTop: '10px',
                  display: 'flex',
                  gap: '8px',
                  flexWrap: 'wrap',
                }}
              >
                <button
                  type="button"
                  onClick={() => navigate(`/edit-listing/${listing.id}`)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '6px',
                    border: '1px solid #2563eb',
                    backgroundColor: '#ffffff',
                    color: '#2563eb',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                  }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(listing.id)}
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
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => toggleBookings(listing.id)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '6px',
                    border: '1px solid #9ca3af',
                    backgroundColor: '#ffffff',
                    color: '#374151',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                  }}
                >
                  {expandedListingId === listing.id
                    ? 'Hide bookings'
                    : 'View bookings'}
                </button>
              </div>
              {expandedListingId === listing.id && (
                <div style={{ marginTop: '12px' }}>
                  <h3 style={{ fontSize: '1rem', marginBottom: '8px' }}>Bookings</h3>
                  {bookings.length === 0 ? (
                    <p>No bookings yet.</p>
                  ) : (
                    <table
                      style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontSize: '0.9rem',
                      }}
                    >
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: '4px' }}>
                            Check-in
                          </th>
                          <th style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: '4px' }}>
                            Check-out
                          </th>
                          <th style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: '4px' }}>
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {bookings.map((b) => (
                          <tr key={b.id}>
                            <td style={{ padding: '4px' }}>{b.check_in}</td>
                            <td style={{ padding: '4px' }}>{b.check_out}</td>
                            <td style={{ padding: '4px' }}>{b.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default MyListings

