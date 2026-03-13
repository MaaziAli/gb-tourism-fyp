import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { getUser, getRole, isLoggedIn } from '../utils/role'
import { getImageUrl } from '../utils/image'

function Listings() {
  const navigate = useNavigate()
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [locationFilter, setLocationFilter] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [serviceFilter, setServiceFilter] = useState('')
  const [teaserRecs, setTeaserRecs] = useState([])
  const currentUser = getUser()
  const role = getRole()
  const userId = currentUser?.id ?? null
  const isProviderUser = role === 'provider'

  useEffect(() => {
    api
      .get('/listings')
      .then((response) => {
        const data = response.data
        console.log('Listings data from API:', data)
        console.log('First listing image_url:', data?.[0]?.image_url)
        setListings(data)
      })
      .catch((err) => {
        setError(err.response?.data?.detail || 'Failed to load listings.')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    if (!isLoggedIn()) {
      return
    }
    api
      .get('/recommendations', { params: { limit: 3 } })
      .then((res) => {
        setTeaserRecs(res.data || [])
      })
      .catch((err) => {
        console.error('Failed to load teaser recommendations', {
          message: err.message,
          status: err.response?.status,
          data: err.response?.data,
        })
        setTeaserRecs([])
      })
  }, [])

  const containerStyle = {}

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
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
    transition: 'box-shadow 0.2s ease',
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

  if (loading) {
    return (
      <div className="page-container" style={containerStyle}>
        <p style={{ textAlign: 'center', color: '#6b7280' }}>Loading listings...</p>
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

  if (listings.length === 0) {
    return (
      <div className="page-container" style={containerStyle}>
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '8px' }}>🏔️</div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', fontWeight: 600 }}>
            No listings found
          </h2>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#6b7280' }}>
            Try adjusting your search filters.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container" style={containerStyle}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1
          style={{
            margin: 0,
            fontSize: '2rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
          }}
        >
          Explore Gilgit-Baltistan
        </h1>
        <p style={{ marginTop: '8px', fontSize: '1rem', color: 'var(--text-secondary)' }}>
          Discover hotels, tours, transport and activities across GB
        </p>
      </div>

      {isLoggedIn() && teaserRecs.length > 0 && (
        <div
          style={{
            marginBottom: '24px',
            padding: '16px 20px',
            backgroundColor: 'var(--bg-card)',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
          }}
        >
          <div
            style={{
              marginBottom: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                }}
              >
                ✨ Recommended for You
              </div>
              <div
                style={{
                  marginTop: '2px',
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                }}
              >
                Based on your preferences
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/recommendations')}
              style={{
                padding: '6px 10px',
                borderRadius: '999px',
                border: '1px solid var(--accent)',
                backgroundColor: 'var(--accent-light)',
                color: 'var(--accent)',
                cursor: 'pointer',
                fontSize: '0.8rem',
                whiteSpace: 'nowrap',
              }}
            >
              View all →
            </button>
          </div>
          <div
            style={{
              display: 'flex',
              overflowX: 'auto',
              gap: '16px',
              paddingBottom: '4px',
            }}
          >
            {teaserRecs.map((item) => {
              const priceText = formatPrice(item.price_per_night)
              return (
                <div
                  key={item.id}
                  style={{
                    flex: '0 0 220px',
                    backgroundColor: 'var(--bg-card)',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow-sm)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: '120px',
                      overflow: 'hidden',
                    }}
                  >
                    <img
                      src={getImageUrl(item.image_url)}
                      alt={item.title || 'Listing image'}
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
                  </div>
                  <div
                    style={{
                      padding: '10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {item.title}
                    </div>
                    <div
                      style={{
                        fontSize: '0.8rem',
                        color: 'var(--accent)',
                        fontWeight: 600,
                      }}
                    >
                      PKR {priceText} / night
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate(`/booking/${item.id}`)}
                      style={{
                        marginTop: '6px',
                        padding: '7px 0',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: 'var(--accent)',
                        color: '#ffffff',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 500,
                      }}
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div
        style={{
                backgroundColor: 'var(--bg-card)',
          borderRadius: '12px',
                border: '1px solid var(--border-color)',
          padding: '20px',
          marginBottom: '32px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div
            style={{
              flex: '1 1 180px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <label
              htmlFor="locationFilter"
              style={{
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
                fontWeight: 500,
                marginBottom: '4px',
              }}
            >
              Location
            </label>
            <input
              id="locationFilter"
              type="text"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              placeholder="Search by location"
              style={{
                padding: '8px 12px',
                fontSize: '0.9rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                width: '100%',
              }}
            />
          </div>

          <div
            style={{
              flex: '1 1 140px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <label
              htmlFor="minPrice"
              style={{
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
                fontWeight: 500,
                marginBottom: '4px',
              }}
            >
              Min price
            </label>
            <input
              id="minPrice"
              type="number"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="0"
              style={{
                padding: '8px 12px',
                fontSize: '0.9rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                width: '100%',
              }}
              min="0"
            />
          </div>

          <div
            style={{
              flex: '1 1 140px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <label
              htmlFor="maxPrice"
              style={{
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
                fontWeight: 500,
                marginBottom: '4px',
              }}
            >
              Max price
            </label>
            <input
              id="maxPrice"
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="Any"
              style={{
                padding: '8px 12px',
                fontSize: '0.9rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                width: '100%',
              }}
              min="0"
            />
          </div>

          <div
            style={{
              flex: '1 1 160px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <label
              htmlFor="serviceFilter"
              style={{
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
                fontWeight: 500,
                marginBottom: '4px',
              }}
            >
              Service type
            </label>
            <select
              id="serviceFilter"
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                fontSize: '0.9rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
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

          <div
            style={{
              flex: '0 0 auto',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'flex-end',
              marginLeft: 'auto',
            }}
          >
            <button
              type="button"
              onClick={() => {
                // Filters are already applied via state; button kept for UX.
              }}
              style={{
                padding: '10px 24px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: 'var(--accent)',
                color: '#ffffff',
                cursor: 'pointer',
                fontSize: '0.9rem',
              }}
            >
              Search
            </button>
          </div>
        </div>
      </div>

      {filteredListings.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '8px' }}>🏔️</div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', fontWeight: 600 }}>
            No listings found
          </h2>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Try adjusting your search filters.
          </p>
        </div>
      ) : (
        <div style={gridStyle}>
          {filteredListings.map((listing) => {
            console.log('Listing:', listing)
            const isOwner = userId != null && userId === listing.owner_id
            const canEdit = isProviderUser && isOwner
            const canBook = !isProviderUser || !isOwner

            const priceText = formatPrice(listing.price_per_night)

            return (
              <div
                key={listing.id}
                style={cardStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
                }}
              >
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: '200px',
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
                  <h3
                    onClick={() => navigate(`/listing/${listing.id}`)}
                    style={{
                      cursor: 'pointer',
                      margin: '0 0 6px',
                      fontSize: '1rem',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                    }}
                  >
                    {listing.title}
                  </h3>

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

                  {listing.description && (
                    <p
                      style={{
                        fontSize: '0.8rem',
                        color: 'var(--text-secondary)',
                        margin: '4px 0',
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {listing.description}
                    </p>
                  )}

                  <div
                    style={{
                      marginTop: '8px',
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                    }}
                  >
                    PKR {priceText} / night
                  </div>

                  <div
                    style={{
                      marginTop: '12px',
                      display: 'flex',
                      gap: '8px',
                      alignItems: 'center',
                    }}
                  >
                    {canBook && (
                      <button
                        type="button"
                        onClick={() => navigate(`/booking/${listing.id}`)}
                        style={{
                          flex: 1,
                          padding: '9px 0',
                          borderRadius: '8px',
                          border: 'none',
                          backgroundColor: 'var(--accent)',
                          color: '#ffffff',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          fontWeight: 500,
                        }}
                      >
                        Book Now
                      </button>
                    )}
                    {!canBook && isProviderUser && isOwner && (
                      <button
                        type="button"
                        disabled
                        title="You cannot book your own listing"
                        style={{
                          flex: 1,
                          padding: '9px 0',
                          borderRadius: '8px',
                          border: '1px dashed var(--border-color)',
                          backgroundColor: 'var(--bg-secondary)',
                          color: 'var(--text-muted)',
                          fontSize: '0.9rem',
                          cursor: 'not-allowed',
                        }}
                      >
                        Your listing
                      </button>
                    )}
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => navigate(`/edit-listing/${listing.id}`)}
                        style={{
                          padding: '9px 16px',
                          borderRadius: '8px',
                          border: '1px solid var(--accent)',
                          backgroundColor: 'var(--bg-card)',
                          color: 'var(--accent)',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          fontWeight: 500,
                        }}
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Listings
