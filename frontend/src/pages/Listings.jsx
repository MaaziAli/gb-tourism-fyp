import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { getImageUrl } from '../utils/image'

const SERVICE_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'hotel', label: '🏨 Hotel' },
  { value: 'tour', label: '🏔️ Tour' },
  { value: 'transport', label: '🚐 Transport' },
  { value: 'activity', label: '🎯 Activity' },
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

function getServiceBadge(type) {
  switch(type) {
    case 'hotel': return { bg: '#2563eb', label: '🏨 Hotel' }
    case 'tour': return { bg: '#16a34a', label: '🏔️ Tour' }
    case 'transport': return { bg: '#d97706', label: '🚐 Transport' }
    case 'activity': return { bg: '#7c3aed', label: '🎯 Activity' }
    default: return { bg: '#6b7280', label: type }
  }
}

export default function Listings() {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

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
        padding: '36px 16px 28px'
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
        maxWidth:'1100px', margin:'0 auto', padding:'24px 16px'
      }}>
        {!loading && (
          <div style={{
            display:'flex', justifyContent:'space-between',
            alignItems:'center', marginBottom:'20px'
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
            gridTemplateColumns:
              'repeat(auto-fill, minmax(300px, 1fr))',
            gap:'20px'
          }}>
            {filtered.map(listing => {
              const badge = getServiceBadge(listing.service_type)
              return (
                <div key={listing.id}
                  onClick={() => navigate(`/listing/${listing.id}`)}
                  style={{
                    background:'var(--bg-card)',
                    borderRadius:'var(--radius-md)',
                    border:'1px solid var(--border-color)',
                    overflow:'hidden', cursor:'pointer',
                    boxShadow:'var(--shadow-sm)',
                    transition:'transform 0.18s, box-shadow 0.18s'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform =
                      'translateY(-4px)'
                    e.currentTarget.style.boxShadow =
                      '0 8px 30px rgba(0,0,0,0.12)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform =
                      'translateY(0)'
                    e.currentTarget.style.boxShadow =
                      'var(--shadow-sm)'
                  }}
                >
                  <div style={{position:'relative'}}>
                    <img
                      src={getImageUrl(listing.image_url)}
                      alt={listing.title}
                      onError={e => {
                        e.target.onerror = null
                        e.target.src = 'https://placehold.co/400x250/e5e7eb/9ca3af?text=GB+Tourism'
                      }}
                      style={{
                        width:'100%', height:'200px',
                        objectFit:'cover', display:'block'
                      }}
                    />
                    <span style={{
                      position:'absolute', top:'12px', left:'12px',
                      background:badge.bg, color:'white',
                      padding:'4px 10px', borderRadius:'999px',
                      fontSize:'0.75rem', fontWeight:700
                    }}>
                      {badge.label}
                    </span>
                    {listing.average_rating > 0 && (
                      <span style={{
                        position:'absolute',
                        top:'12px', right:'12px',
                        background:'rgba(0,0,0,0.65)',
                        color:'white', padding:'4px 10px',
                        borderRadius:'999px',
                        fontSize:'0.75rem', fontWeight:700
                      }}>
                        ⭐ {listing.average_rating?.toFixed(1)}
                      </span>
                    )}
                  </div>
                  <div style={{padding:'16px'}}>
                    <h3 style={{
                      margin:'0 0 6px', fontWeight:700,
                      fontSize:'1rem', color:'var(--text-primary)',
                      whiteSpace:'nowrap', overflow:'hidden',
                      textOverflow:'ellipsis'
                    }}>
                      {listing.title}
                    </h3>
                    <p style={{
                      margin:'0 0 12px', fontSize:'0.85rem',
                      color:'var(--text-secondary)'
                    }}>
                      📍 {listing.location}
                    </p>
                    {listing.description && (
                      <p style={{
                        margin:'0 0 12px', fontSize:'0.825rem',
                        color:'var(--text-muted)',
                        display:'-webkit-box',
                        WebkitLineClamp:2,
                        WebkitBoxOrient:'vertical',
                        overflow:'hidden'
                      }}>
                        {listing.description}
                      </p>
                    )}
                    <div style={{
                      display:'flex',
                      justifyContent:'space-between',
                      alignItems:'center'
                    }}>
                      <div>
                        <span style={{
                          fontSize:'1.15rem', fontWeight:800,
                          color:'var(--accent)'
                        }}>
                          PKR {listing.price_per_night
                            ?.toLocaleString('en-PK')}
                        </span>
                        <span style={{
                          fontSize:'0.8rem',
                          color:'var(--text-muted)'
                        }}>
                          {' '}/night
                        </span>
                      </div>
                      <span style={{
                        fontSize:'0.75rem',
                        color:'var(--text-muted)'
                      }}>
                        {listing.review_count > 0
                          ? `${listing.review_count} review${listing.review_count > 1 ? 's' : ''}`
                          : 'No reviews yet'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

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

  const containerStyle = {
    background: 'var(--bg-primary)',
    minHeight: '100vh',
  }

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

  const getServiceBadge = (serviceType) => {
    switch (serviceType) {
      case 'hotel':
        return { bg: '#2563eb', label: '🏨 Hotel' }
      case 'tour':
        return { bg: '#16a34a', label: '🏔️ Tour' }
      case 'transport':
        return { bg: '#d97706', label: '🚐 Transport' }
      case 'activity':
        return { bg: '#7c3aed', label: '🎯 Activity' }
      default:
        return { bg: '#6b7280', label: serviceType }
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
        <p style={{ textAlign: 'center', color: '#6b7280' }}>Loading stays & experiences...</p>
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
            No stays found
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
              <option value="">All Types</option>
              <option value="hotel">🏨 Hotel</option>
              <option value="tour">🏔️ Tour</option>
              <option value="transport">🚐 Transport</option>
              <option value="activity">🎯 Activity</option>
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
            No stays found
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
            const { bg, label } = getServiceBadge(listing.service_type)

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
                      backgroundColor: bg,
                      color: '#ffffff',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: '20px',
                      textTransform: 'capitalize',
                    }}
                  >
                    {label}
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
