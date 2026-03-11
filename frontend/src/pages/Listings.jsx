import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

function Listings() {
  const navigate = useNavigate()
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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

  if (listings.length === 0) {
    return (
      <div style={containerStyle}>
        <h1 style={{ marginBottom: '16px' }}>Listings</h1>
        <p>No listings available.</p>
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      <h1 style={{ marginBottom: '24px' }}>Listings</h1>
      <div>
        {listings.map((listing) => (
          <div key={listing.id} style={cardStyle}>
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
                onClick={() => navigate(`/booking/${listing.id}`)}
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
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Listings
