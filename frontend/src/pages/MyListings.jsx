import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

function MyListings() {
  const navigate = useNavigate()
  const [listings, setListings] = useState([])
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
        {listings.map((listing) => (
          <div key={listing.id} style={cardStyle}>
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
            <div style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
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
                onClick={() => navigate('/my-bookings')}
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
                View bookings
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default MyListings

