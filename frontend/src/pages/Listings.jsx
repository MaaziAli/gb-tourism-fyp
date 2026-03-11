import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

function Listings() {
  const navigate = useNavigate()
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
   const [locationFilter, setLocationFilter] = useState('')
   const [minPrice, setMinPrice] = useState('')
   const [maxPrice, setMaxPrice] = useState('')
   const [serviceFilter, setServiceFilter] = useState('')

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
    padding: '0 0 16px 0',
    marginBottom: '16px',
    boxShadow: '0 1px 4px rgba(15, 23, 42, 0.08)',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  }

  const filteredListings = listings.filter((listing) => {
    const matchesLocation = locationFilter
      ? listing.location.toLowerCase().includes(locationFilter.toLowerCase())
      : true

    const matchesMinPrice = minPrice
      ? listing.price_per_night >= Number(minPrice)
      : true

    const matchesMaxPrice = maxPrice
      ? listing.price_per_night <= Number(maxPrice)
      : true

    const matchesService = serviceFilter
      ? listing.service_type === serviceFilter
      : true

    return matchesLocation && matchesMinPrice && matchesMaxPrice && matchesService
  })

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
      <h1 style={{ marginBottom: '16px' }}>Listings</h1>
      <div
        style={{
          maxWidth: '1000px',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            padding: '16px 20px',
            boxShadow: '0 1px 4px rgba(15, 23, 42, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            marginBottom: '8px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label htmlFor="locationFilter">Location</label>
              <input
                id="locationFilter"
                type="text"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                placeholder="Search by location"
                style={{
                  padding: '8px',
                  fontSize: '0.95rem',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  width: '100%',
                }}
              />
            </div>
            <div
              style={{
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ flex: '1 1 120px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label htmlFor="minPrice">Min price</label>
                <input
                  id="minPrice"
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="0"
                  style={{
                    padding: '8px',
                    fontSize: '0.95rem',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    width: '100%',
                  }}
                  min="0"
                />
              </div>
              <div style={{ flex: '1 1 120px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label htmlFor="maxPrice">Max price</label>
                <input
                  id="maxPrice"
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="Any"
                  style={{
                    padding: '8px',
                    fontSize: '0.95rem',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    width: '100%',
                  }}
                  min="0"
                />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label htmlFor="serviceFilter">Service type</label>
              <select
                id="serviceFilter"
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                style={{
                  padding: '8px',
                  fontSize: '0.95rem',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  width: '100%',
                }}
              >
                <option value="">All</option>
                <option value="hotel">Hotel</option>
                <option value="tour">Tour</option>
                <option value="transport">Transport</option>
                <option value="activity">Activity</option>
              </select>
            </div>
          </div>
          {/* Search button included for UX; filtering is live on change */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => {
                // No-op: filters already applied via state.
              }}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                cursor: 'pointer',
                fontSize: '0.95rem',
              }}
            >
              Search
            </button>
          </div>
        </div>
      </div>
      <div>
        {filteredListings.length === 0 ? (
          <p>No listings match your filters.</p>
        ) : (
          filteredListings.map((listing) => (
            <div key={listing.id} style={cardStyle}>
              <div
                style={{
                  width: '100%',
                  height: '200px',
                  overflow: 'hidden',
                  borderTopLeftRadius: '8px',
                  borderTopRightRadius: '8px',
                }}
              >
                <img
                  src={
                    listing.image_url
                      ? `http://localhost:8000/uploads/${listing.image_url}`
                      : 'https://via.placeholder.com/800x200?text=Tourism+Listing'
                  }
                  alt={listing.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
              </div>
              <div
                style={{
                  padding: '16px 20px',
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
              </div>
              <div
                style={{
                  marginTop: '12px',
                  display: 'flex',
                  gap: '8px',
                  flexWrap: 'wrap',
                }}
              >
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
                <button
                  type="button"
                  onClick={() => navigate(`/edit-listing/${listing.id}`)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid #2563eb',
                    backgroundColor: '#ffffff',
                    color: '#2563eb',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                  }}
                >
                  Edit
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Listings
