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
    return <p>No listings available.</p>
  }

  return (
    <div>
      <h1>Listings</h1>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {listings.map((listing) => (
          <li key={listing.id} style={{ borderBottom: '1px solid #ccc', padding: '12px 0' }}>
            <strong>{listing.title}</strong>
            <p>Location: {listing.location}</p>
            <p>Price per night: ${listing.price_per_night}</p>
            <p>Service type: {listing.service_type}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default Listings
