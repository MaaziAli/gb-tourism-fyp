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

  return (
    <div style={{
      background: 'var(--bg-primary)', minHeight: '100vh'
    }}>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a5f 0%, #0ea5e9 100%)',
        padding: isMobile ? '28px 12px 20px' : '36px 16px 28px'
      }}>
        <div style={{maxWidth: '800px', margin: '0 auto'}}>
          <h1 style={{
            color: 'white', textAlign: 'center',
            fontSize: '1.8rem', fontWeight: 800,
            margin: '0 0 6px'
          }}>
            Explore Gilgit-Baltistan
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.8)', textAlign: 'center',
            margin: '0 0 20px', fontSize: '0.95rem'
          }}>
            Discover hotels, tours, transport & activities
          </p>

          <div style={{display:'flex', gap:'10px', marginBottom:'12px'}}>
            <div style={{flex:1, position:'relative'}}>
              <span style={{
                position:'absolute', left:'14px', top:'50%',
                transform:'translateY(-50%)', pointerEvents:'none'
              }}>🔍</span>
              <input
                type="text"
                placeholder="Search hotels, tours, locations..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width:'100%', padding:'13px 14px 13px 42px',
                  borderRadius:'12px', border:'none',
                  fontSize:'0.95rem', outline:'none',
                  background:'white', color:'#111827',
                  boxSizing:'border-box',
                  boxShadow:'0 4px 20px rgba(0,0,0,0.15)'
                }}
              />
            </div>
            <button
              onClick={() => setFiltersOpen(p => !p)}
              style={{
                background: filtersOpen
                  ? 'white' : 'rgba(255,255,255,0.2)',
                color: filtersOpen ? '#1e3a5f' : 'white',
                border:'2px solid rgba(255,255,255,0.4)',
                borderRadius:'12px', padding:'13px 18px',
                cursor:'pointer', fontWeight:700,
                fontSize:'0.9rem', whiteSpace:'nowrap',
                display:'flex', alignItems:'center', gap:'6px'
              }}
            >
              🎛️ Filters
              {activeFilters > 0 && (
                <span style={{
                  background:'#ef4444', color:'white',
                  borderRadius:'999px', padding:'1px 7px',
                  fontSize:'0.75rem', fontWeight:700
                }}>
                  {activeFilters}
                </span>
              )}
            </button>
          </div>

          <div style={{
            display:'flex', gap:'8px',
            flexWrap:'wrap', justifyContent:'center'
          }}>
            {SERVICE_TYPES.map(t => (
              <button key={t.value}
                onClick={() => setServiceType(t.value)}
                style={{
                  background: serviceType === t.value
                    ? 'white' : 'rgba(255,255,255,0.15)',
                  color: serviceType === t.value
                    ? '#1e3a5f' : 'white',
                  border:'1px solid rgba(255,255,255,0.3)',
                  borderRadius:'999px', padding:'6px 16px',
                  cursor:'pointer', fontWeight:600,
                  fontSize:'0.83rem', transition:'all 0.15s'
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filters panel */}
      {filtersOpen && (
        <div style={{
          background:'var(--bg-card)',
          borderBottom:'1px solid var(--border-color)',
          padding:'20px 16px'
        }}>
          <div style={{
            maxWidth:'800px', margin:'0 auto',
            display:'grid',
            gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))',
            gap:'16px', alignItems:'end'
          }}>
            <div>
              <label style={{
                display:'block', fontSize:'0.8rem',
                fontWeight:600, color:'var(--text-secondary)',
                marginBottom:'6px'
              }}>📍 Location</label>
              <select value={location}
                onChange={e => setLocation(e.target.value)}
                style={{
                  width:'100%', padding:'9px 12px',
                  borderRadius:'8px',
                  border:'1px solid var(--border-color)',
                  background:'var(--bg-secondary)',
                  color:'var(--text-primary)', fontSize:'0.875rem'
                }}>
                {LOCATIONS.map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{
                display:'block', fontSize:'0.8rem',
                fontWeight:600, color:'var(--text-secondary)',
                marginBottom:'6px'
              }}>💰 Min Price (PKR)</label>
              <input type="number" placeholder="e.g. 1000"
                value={minPrice}
                onChange={e => setMinPrice(e.target.value)}
                style={{
                  width:'100%', padding:'9px 12px',
                  borderRadius:'8px',
                  border:'1px solid var(--border-color)',
                  background:'var(--bg-secondary)',
                  color:'var(--text-primary)',
                  fontSize:'0.875rem', boxSizing:'border-box'
                }}
              />
            </div>
            <div>
              <label style={{
                display:'block', fontSize:'0.8rem',
                fontWeight:600, color:'var(--text-secondary)',
                marginBottom:'6px'
              }}>💰 Max Price (PKR)</label>
              <input type="number" placeholder="e.g. 10000"
                value={maxPrice}
                onChange={e => setMaxPrice(e.target.value)}
                style={{
                  width:'100%', padding:'9px 12px',
                  borderRadius:'8px',
                  border:'1px solid var(--border-color)',
                  background:'var(--bg-secondary)',
                  color:'var(--text-primary)',
                  fontSize:'0.875rem', boxSizing:'border-box'
                }}
              />
            </div>
            <div>
              <label style={{
                display:'block', fontSize:'0.8rem',
                fontWeight:600, color:'var(--text-secondary)',
                marginBottom:'6px'
              }}>🔃 Sort By</label>
              <select value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                style={{
                  width:'100%', padding:'9px 12px',
                  borderRadius:'8px',
                  border:'1px solid var(--border-color)',
                  background:'var(--bg-secondary)',
                  color:'var(--text-primary)', fontSize:'0.875rem'
                }}>
                {SORT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <button onClick={resetFilters} style={{
                width:'100%', padding:'9px 12px',
                borderRadius:'8px',
                border:'1px solid var(--border-color)',
                background:'var(--danger-bg)',
                color:'var(--danger)', fontWeight:600,
                fontSize:'0.875rem', cursor:'pointer'
              }}>
                ✖ Reset Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      <div style={{
        maxWidth:'1100px', margin:'0 auto',
        padding: isMobile ? '16px 12px' : '24px 16px'
      }}>
        {!loading && (
          <div style={{
            display:'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? '10px' : '0',
            justifyContent:'space-between',
            alignItems: isMobile ? 'stretch' : 'center',
            marginBottom:'20px'
          }}>
            <p style={{
              margin:0, color:'var(--text-secondary)',
              fontSize:'0.9rem'
            }}>
              {filtered.length === listings.length
                ? `${listings.length} stays & experiences`
                : `${filtered.length} of ${listings.length} results`
              }
              {search && (
                <span style={{color:'var(--accent)'}}>
                  {' '}for "{search}"
                </span>
              )}
            </p>
            <select value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              style={{
                padding:'7px 12px', borderRadius:'8px',
                border:'1px solid var(--border-color)',
                background:'var(--bg-card)',
                color:'var(--text-primary)',
                fontSize:'0.85rem', cursor:'pointer'
              }}>
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {loading && (
          <div style={{
            textAlign:'center', padding:'60px',
            color:'var(--text-secondary)'
          }}>
            <div style={{fontSize:'2rem', marginBottom:'12px'}}>
              ⏳
            </div>
            Loading stays & experiences...
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{
            textAlign:'center', padding:'60px 20px',
            background:'var(--bg-card)',
            borderRadius:'var(--radius-md)',
            border:'1px solid var(--border-color)'
          }}>
            <div style={{fontSize:'3rem', marginBottom:'12px'}}>
              🔍
            </div>
            <h2 style={{margin:'0 0 8px',
                         color:'var(--text-primary)'}}>
              No results found
            </h2>
            <p style={{margin:'0 0 20px',
                        color:'var(--text-secondary)'}}>
              Try adjusting your search or filters
            </p>
            <button onClick={resetFilters} style={{
              background:'var(--accent)', color:'white',
              border:'none', borderRadius:'10px',
              padding:'10px 24px', cursor:'pointer',
              fontWeight:600, fontSize:'0.9rem'
            }}>
              Clear All Filters
            </button>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div style={{
            display:'grid',
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

                <div style={{
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  flex: '1'
                }}>
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

                  <div style={{flex: '1'}} />

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
                      View and Book
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

