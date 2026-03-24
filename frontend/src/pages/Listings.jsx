import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import useWindowSize from '../hooks/useWindowSize'
import { getAmenityInfo } from '../utils/amenities'

const SERVICE_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'hotel', label: '🏨 Hotel' },
  { value: 'tour', label: '🏔️ Tour' },
  { value: 'transport', label: '🚐 Transport' },
  { value: 'activity', label: '🎯 Activity' },
  { value: 'restaurant', label: '🍽️ Restaurant' },
  { value: 'car_rental', label: '🚗 Car' },
  { value: 'bike_rental', label: '🚲 Bike' },
  { value: 'jeep_safari', label: '🚙 Jeep' },
  { value: 'boat_trip', label: '🚢 Boat' },
  { value: 'horse_riding', label: '🐴 Horse' },
  { value: 'medical', label: '🏥 Medical' },
  { value: 'guide', label: '🧭 Guide' },
  { value: 'camping', label: '🏕️ Camping' },
]

const SORT_OPTIONS = [
  { value: 'recommended', label: '⭐ Recommended' },
  { value: 'price_asc', label: '💰 Price: Low to High' },
  { value: 'price_desc', label: '💰 Price: High to Low' },
  { value: 'rating', label: '🏆 Top Rated' },
  { value: 'newest', label: '🆕 Newest First' },
]

const LOCATIONS = [
  'All Locations',
  'Gilgit', 'Hunza', 'Skardu', 'Nagar',
  'Ghizer', 'Diamer', 'Astore', 'Shigar',
  'Kharmang', 'Roundu'
]

const SERVICE_COLORS = {
  hotel: '#2563eb', tour: '#16a34a',
  transport: '#d97706', activity: '#7c3aed',
  restaurant: '#e11d48', car_rental: '#0369a1',
  guide: '#059669', camping: '#15803d'
}

const SERVICE_LABELS = {
  hotel: 'Hotel',
  tour: 'Tour',
  transport: 'Transport',
  activity: 'Activity',
  restaurant: 'Restaurant',
  car_rental: 'Car Rental',
  bike_rental: 'Bike Rental',
  jeep_safari: 'Jeep Safari',
  boat_trip: 'Boat Trip',
  horse_riding: 'Horse Riding',
  medical: 'Medical',
  guide: 'Guide',
  camping: 'Camping',
}

function getServiceBadge(type) {
  switch(type) {
    case 'hotel': return { bg: '#2563eb', label: '🏨 Hotel' }
    case 'tour': return { bg: '#16a34a', label: '🏔️ Tour' }
    case 'transport': return { bg: '#d97706', label: '🚐 Transport' }
    case 'activity': return { bg: '#7c3aed', label: '🎯 Activity' }
    case 'restaurant': return { bg: '#e11d48', label: '🍽️ Restaurant' }
    case 'car_rental': return { bg: '#0369a1', label: '🚗 Car Rental' }
    case 'bike_rental': return { bg: '#0891b2', label: '🚲 Bike Rental' }
    case 'jeep_safari': return { bg: '#92400e', label: '🚙 Jeep Safari' }
    case 'boat_trip': return { bg: '#1d4ed8', label: '🚢 Boat Trip' }
    case 'horse_riding': return { bg: '#7c2d12', label: '🐴 Horse Riding' }
    case 'medical': return { bg: '#dc2626', label: '🏥 Medical' }
    case 'guide': return { bg: '#059669', label: '🧭 Guide' }
    case 'camping': return { bg: '#15803d', label: '🏕️ Camping' }
    default: return { bg: '#6b7280', label: type }
  }
}

export default function Listings() {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { isMobile, isTablet } = useWindowSize()

  const [search, setSearch] = useState('')
  const [serviceType, setServiceType] = useState('')
  const [location, setLocation] = useState('All Locations')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [sortBy, setSortBy] = useState('recommended')
  const [filtersOpen, setFiltersOpen] = useState(false)

  useEffect(() => { fetchListings() }, [])

  async function fetchListings() {
    setLoading(true)
    try {
      const res = await api.get('/listings')
      setListings(res.data)
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  const activeFilters = [
    serviceType !== '',
    location !== 'All Locations',
    minPrice !== '',
    maxPrice !== '',
    sortBy !== 'recommended'
  ].filter(Boolean).length

  function resetFilters() {
    setSearch('')
    setServiceType('')
    setLocation('All Locations')
    setMinPrice('')
    setMaxPrice('')
    setSortBy('recommended')
  }

  const filtered = useMemo(() => {
    let result = [...listings]
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(l =>
        l.title?.toLowerCase().includes(q) ||
        l.location?.toLowerCase().includes(q) ||
        l.description?.toLowerCase().includes(q)
      )
    }
    if (serviceType) {
      result = result.filter(l => l.service_type === serviceType)
    }
    if (location !== 'All Locations') {
      result = result.filter(l =>
        l.location?.toLowerCase().includes(location.toLowerCase())
      )
    }
    if (minPrice !== '') {
      result = result.filter(
        l => l.price_per_night >= parseFloat(minPrice)
      )
    }
    if (maxPrice !== '') {
      result = result.filter(
        l => l.price_per_night <= parseFloat(maxPrice)
      )
    }
    switch(sortBy) {
      case 'price_asc':
        result.sort((a,b) => a.price_per_night - b.price_per_night)
        break
      case 'price_desc':
        result.sort((a,b) => b.price_per_night - a.price_per_night)
        break
      case 'rating':
        result.sort(
          (a,b) => (b.average_rating||0) - (a.average_rating||0)
        )
        break
      case 'newest':
        result.sort((a,b) => b.id - a.id)
        break
      default: break
    }
    return result
  }, [listings, search, serviceType, location,
      minPrice, maxPrice, sortBy])

  const searchQuery = search
  const setSearchQuery = setSearch
  const selectedType = serviceType
  const setSelectedType = setServiceType

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      width: '100%',
      overflowX: 'hidden',
      boxSizing: 'border-box'
    }}>

      {/* Page header */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a5f, #0ea5e9)',
        padding: isMobile ? '24px 16px' : '32px 24px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <h1 style={{
            color: 'white',
            margin: '0 0 6px 0',
            fontSize: isMobile ? '1.4rem' : '1.8rem',
            fontWeight: '800'
          }}>
            Explore GB Tourism
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.75)',
            margin: '0',
            fontSize: '0.9rem'
          }}>
            Hotels, tours, transport and more
            in Gilgit-Baltistan
          </p>
        </div>
      </div>

      {/* Search + filters bar */}
      <div style={{
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border-color)',
        padding: '12px 16px',
        position: 'sticky',
        top: '58px',
        zIndex: '40'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          gap: '10px',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          {/* Search input */}
          <div style={{
            flex: '1',
            minWidth: '200px',
            position: 'relative'
          }}>
            <input
              type="text"
              placeholder="Search hotels, tours, guides..."
              value={searchQuery || ''}
              onChange={e => setSearchQuery
                ? setSearchQuery(e.target.value)
                : null}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            <span style={{
              position: 'absolute',
              left: '11px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '0.9rem',
              pointerEvents: 'none'
            }}>
              🔍
            </span>
          </div>

          {/* Service type filter */}
          <select
            value={selectedType || ''}
            onChange={e => setSelectedType
              ? setSelectedType(e.target.value)
              : null}
            style={{
              padding: '9px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              cursor: 'pointer',
              minWidth: '140px'
            }}
          >
            <option value="">All Services</option>
            <option value="hotel">Hotel</option>
            <option value="tour">Tour</option>
            <option value="transport">Transport</option>
            <option value="activity">Activity</option>
            <option value="restaurant">Restaurant</option>
            <option value="car_rental">Car Rental</option>
            <option value="guide">Guide</option>
            <option value="camping">Camping</option>
          </select>

          {/* Results count */}
          <span style={{
            fontSize: '0.82rem',
            color: 'var(--text-muted)',
            whiteSpace: 'nowrap'
          }}>
            {(filtered || listings || []).length} results
          </span>
        </div>
      </div>

      {/* Main content */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: isMobile ? '16px 12px' : '24px 24px',
        boxSizing: 'border-box',
        width: '100%'
      }}>

        {/* Results grid — VERTICAL CARDS */}
        {(filtered || listings || []).length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: 'var(--text-muted)'
          }}>
            <div style={{fontSize: '3rem', marginBottom: '12px'}}>
              🔍
            </div>
            <p style={{margin: '0', fontSize: '1rem'}}>
              No services found
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile
              ? '1fr'
              : 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '20px',
            width: '100%',
            boxSizing: 'border-box'
          }}>
            {(filtered || listings || []).map(listing => (
              <div
                key={listing.id}
                onClick={() => navigate('/listing/' + listing.id)}
                style={{
                  background: 'var(--bg-card)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  display: 'flex',
                  flexDirection: 'column',
                  width: '100%',
                  boxSizing: 'border-box'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-3px)'
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'
                }}
              >
                {/* IMAGE ON TOP */}
                <div style={{
                  width: '100%',
                  height: '200px',
                  position: 'relative',
                  overflow: 'hidden',
                  background: '#e0f2fe',
                  flexShrink: '0'
                }}>
                  <img
                    src={
                      listing.image_url
                        ? (listing.image_url.startsWith('http')
                            ? listing.image_url
                            : 'http://127.0.0.1:8000/uploads/' + listing.image_url)
                        : 'https://placehold.co/400x200/1e3a5f/ffffff?text=Hotel'
                    }
                    alt={listing.title || 'Service'}
                    onError={e => {
                      e.target.onerror = null
                      e.target.src = 'https://placehold.co/400x200/1e3a5f/ffffff?text=Hotel'
                    }}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block'
                    }}
                  />
                  {/* Type badge */}
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    background: '#0ea5e9',
                    color: 'white',
                    padding: '3px 10px',
                    borderRadius: '999px',
                    fontSize: '0.7rem',
                    fontWeight: '700',
                    textTransform: 'capitalize'
                  }}>
                    {(listing.service_type || '').replace(/_/g, ' ')}
                  </div>
                  {/* Featured badge */}
                  {listing.is_featured ? (
                    <div style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      background: '#f59e0b',
                      color: 'white',
                      padding: '3px 8px',
                      borderRadius: '999px',
                      fontSize: '0.68rem',
                      fontWeight: '700'
                    }}>
                      Featured
                    </div>
                  ) : null}
                  {/* Rating badge on image */}
                  {listing.average_rating > 0 ? (
                    <div style={{
                      position: 'absolute',
                      bottom: '10px',
                      left: '10px',
                      background: '#16a34a',
                      color: 'white',
                      padding: '3px 9px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: '700'
                    }}>
                      {Number(listing.average_rating).toFixed(1)}
                      <span style={{
                        fontWeight: '400',
                        marginLeft: '3px',
                        fontSize: '0.68rem'
                      }}>
                        ({listing.review_count || 0})
                      </span>
                    </div>
                  ) : null}
                </div>

                {/* CONTENT BELOW IMAGE */}
                <div style={{
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  flex: '1'
                }}>
                  {/* Hotel name — max 2 lines */}
                  <h3 style={{
                    margin: '0 0 6px 0',
                    fontWeight: '700',
                    fontSize: '1rem',
                    color: 'var(--text-primary)',
                    lineHeight: '1.4',
                    display: '-webkit-box',
                    WebkitLineClamp: '2',
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    minHeight: '2.8em'
                  }}>
                    {listing.title}
                  </h3>

                  {/* Location */}
                  <div style={{
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                    marginBottom: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <span>📍</span>
                    <span>{listing.location}</span>
                  </div>

                  {/* Description — max 2 lines */}
                  {listing.description ? (
                    <p style={{
                      margin: '0 0 10px 0',
                      fontSize: '0.78rem',
                      color: 'var(--text-muted)',
                      lineHeight: '1.5',
                      display: '-webkit-box',
                      WebkitLineClamp: '2',
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {listing.description}
                    </p>
                  ) : null}

                  {/* Spacer to push price to bottom */}
                  <div style={{flex: '1'}} />

                  {/* Price + Button */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--border-color)',
                    marginTop: '8px',
                    gap: '10px'
                  }}>
                    <div style={{minWidth: '0', flexShrink: '1'}}>
                      <div style={{
                        fontSize: '0.65rem',
                        color: 'var(--text-muted)',
                        marginBottom: '1px'
                      }}>
                        Starting from
                      </div>
                      <div style={{
                        fontSize: '1.15rem',
                        fontWeight: '900',
                        color: '#0ea5e9',
                        lineHeight: '1',
                        whiteSpace: 'nowrap'
                      }}>
                        PKR {(listing.price_per_night || 0).toLocaleString('en-PK')}
                        <span style={{
                          fontSize: '0.68rem',
                          fontWeight: '400',
                          color: 'var(--text-muted)',
                          marginLeft: '3px'
                        }}>
                          /night
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        navigate('/listing/' + listing.id)
                      }}
                      style={{
                        padding: '9px 16px',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'linear-gradient(135deg,#1e3a5f,#0ea5e9)',
                        color: 'white',
                        fontWeight: '700',
                        cursor: 'pointer',
                        fontSize: '0.82rem',
                        whiteSpace: 'nowrap',
                        flexShrink: '0'
                      }}
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

