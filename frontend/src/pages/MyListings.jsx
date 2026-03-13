import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { getImageUrl } from '../utils/image'

function MyListings() {
  const navigate = useNavigate()
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedListingId, setExpandedListingId] = useState(null)
  const [bookingsByListing, setBookingsByListing] = useState({})
  const [loadingBookings, setLoadingBookings] = useState({})
  const [deleteErrors, setDeleteErrors] = useState({})

  const containerStyle = {
    background: 'var(--bg-primary)',
    minHeight: '100vh',
  }

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '24px',
  }

  const cardStyle = {
    backgroundColor: 'var(--bg-card)',
    borderRadius: '12px',
    border: '1px solid var(--border-color)',
    boxShadow: 'var(--shadow-sm)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
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
    if (
      !window.confirm(
        'Delete this listing? This cannot be undone.',
      )
    ) {
      return
    }
    setDeleteErrors((prev) => ({ ...prev, [listingId]: '' }))
    try {
      await api.delete(`/listings/${listingId}`)
      setListings((prev) => prev.filter((l) => l.id !== listingId))
      setBookingsByListing((prev) => {
        const next = { ...prev }
        delete next[listingId]
        return next
      })
      if (expandedListingId === listingId) {
        setExpandedListingId(null)
      }
    } catch (err) {
      console.error('Failed to delete listing', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      })
      const msg =
        err.response?.data?.detail ||
        'Failed to delete listing. Please try again later.'
      setDeleteErrors((prev) => ({ ...prev, [listingId]: msg }))
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
    setLoadingBookings((prev) => ({ ...prev, [listingId]: true }))
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
    } finally {
      setLoadingBookings((prev) => ({ ...prev, [listingId]: false }))
    }
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

  const formatPrice = (price) => {
    if (typeof price !== 'number') return '0'
    try {
      return price.toLocaleString('en-PK')
    } catch {
      return String(price)
    }
  }

  const statusBadgeStyle = (status) => {
    if (status === 'cancelled') {
      return {
        backgroundColor: '#fee2e2',
        color: '#991b1b',
        fontSize: '0.75rem',
        fontWeight: 600,
        padding: '3px 10px',
        borderRadius: '20px',
        display: 'inline-block',
      }
    }
    return {
      backgroundColor: '#d1fae5',
      color: '#065f46',
      fontSize: '0.75rem',
      fontWeight: 600,
      padding: '3px 10px',
      borderRadius: '20px',
      display: 'inline-block',
    }
  }

  if (loading) {
    return (
      <div className="page-container" style={containerStyle}>
        <p>Loading listings...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page-container" style={containerStyle}>
        <p style={{ color: 'red' }}>{error}</p>
      </div>
    )
  }

  if (!listings.length) {
    return (
      <div className="page-container" style={containerStyle}>
        <div
          style={{
            maxWidth: '480px',
            margin: '40px auto',
            backgroundColor: 'var(--bg-card)',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            padding: '24px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '8px' }}>🏨</div>
          <h2
            style={{
              margin: '0 0 4px 0',
              fontSize: '1.2rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}
          >
            No listings yet
          </h2>
          <p
            style={{
              margin: '4px 0 16px 0',
              fontSize: '0.9rem',
              color: 'var(--text-secondary)',
            }}
          >
            Start by adding your first hotel, tour, or service
          </p>
          <button
            type="button"
            onClick={() => navigate('/add-listing')}
            style={{
              padding: '9px 20px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'var(--accent)',
              color: '#ffffff',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 500,
            }}
          >
            Add Your First Listing
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container" style={containerStyle}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px',
          gap: '12px',
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: '2rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
          }}
        >
          My Listings
        </h1>
        <button
          type="button"
          onClick={() => navigate('/add-listing')}
          style={{
            padding: '9px 20px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: 'var(--accent)',
            color: '#ffffff',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: 500,
          }}
        >
          Add New Listing
        </button>
      </div>

      <div style={gridStyle}>
        {listings.map((listing) => {
          const bookings = bookingsByListing[listing.id] || []
          const bookingsCount =
            bookingsByListing[listing.id] !== undefined
              ? bookings.length
              : null

          return (
            <div key={listing.id} style={cardStyle}>
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '180px',
                  overflow: 'hidden',
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
                    e.target.onerror = null
                    e.target.src =
                      'https://placehold.co/400x250/e5e7eb/9ca3af?text=GB+Tourism'
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

              <div
                style={{
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <h2
                  style={{
                    margin: '0 0 6px 0',
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                  }}
                >
                  {listing.title}
                </h2>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <span style={{ marginRight: '4px' }}>📍</span>
                  <span>{listing.location}</span>
                </div>

                <div
                  style={{
                    marginTop: '6px',
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                  }}
                >
                  PKR {formatPrice(listing.price_per_night)} / night
                </div>

                <div
                  style={{
                    marginTop: '4px',
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)',
                  }}
                >
                  {bookingsCount === null
                    ? '— bookings'
                    : `${bookingsCount} bookings`}
                </div>

                <div
                  style={{
                    marginTop: '12px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => navigate(`/edit-listing/${listing.id}`)}
                    style={{
                      padding: '7px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--accent)',
                      backgroundColor: 'var(--bg-card)',
                      color: 'var(--accent)',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: 500,
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(listing.id)}
                    style={{
                      padding: '7px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--danger)',
                      backgroundColor: 'var(--bg-card)',
                      color: 'var(--danger)',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: 500,
                    }}
                  >
                    Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleBookings(listing.id)}
                    style={{
                      padding: '7px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: 500,
                    }}
                  >
                    {expandedListingId === listing.id
                      ? 'Hide Bookings'
                      : 'View Bookings'}
                  </button>
                </div>

                {deleteErrors[listing.id] && (
                  <p
                    style={{
                      marginTop: '6px',
                      fontSize: '0.8rem',
                      color: 'var(--danger)',
                    }}
                  >
                    {deleteErrors[listing.id]}
                  </p>
                )}

                {expandedListingId === listing.id && (
                  <div
                    style={{
                      marginTop: '12px',
                      paddingTop: '12px',
                      borderTop: '1px solid var(--border-color)',
                    }}
                  >
                    {loadingBookings[listing.id] ? (
                      <p
                        style={{
                          fontSize: '0.85rem',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        Loading bookings...
                      </p>
                    ) : bookings.length === 0 ? (
                      <p
                        style={{
                          fontSize: '0.85rem',
                          color: 'var(--text-secondary)',
                          fontStyle: 'italic',
                        }}
                      >
                        No bookings for this listing yet.
                      </p>
                    ) : (
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                          fontSize: '0.85rem',
                        }}
                      >
                        {bookings.map((b) => (
                          <div
                            key={b.id}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <span>
                              {b.check_in} → {b.check_out}
                            </span>
                            <span style={statusBadgeStyle(b.status)}>
                              {b.status === 'cancelled' ? 'Cancelled' : 'Active'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default MyListings

