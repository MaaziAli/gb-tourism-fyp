import { useState, useEffect } from 'react'
import api from '../api/axios'

function Listings() {
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
                onClick={() => console.log('Book listing', listing.id)}
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
