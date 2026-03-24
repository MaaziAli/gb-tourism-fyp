import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import useWindowSize from '../hooks/useWindowSize'
import RecentlyViewed from '../components/RecentlyViewed'

const FEATURES = [
  { emoji: '🏨', title: 'Hotels & Stays',
    desc: 'Budget guesthouses to luxury resorts',
    color: '#2563eb' },
  { emoji: '🏔️', title: 'Tours & Treks',
    desc: 'Guided mountain & glacier experiences',
    color: '#16a34a' },
  { emoji: '🚐', title: 'Transport',
    desc: 'Jeep rides & private transfers',
    color: '#d97706' },
  { emoji: '🎯', title: 'Activities',
    desc: 'Fishing, polo, jeep safaris & more',
    color: '#7c3aed' },
]

function getCategoryColor(cat) {
  const colors = {
    'Music & Cultural Festival': '#7c3aed',
    'Polo & Horse Events': '#0369a1',
    'Guided Trek & Expedition': '#16a34a',
    'Art & Photography': '#d97706',
    'Local Festival & Fair': '#e11d48',
    'Sports Event': '#2563eb',
    'Food & Dining Event': '#f97316',
    'Community Gathering': '#0891b2',
    'Horse Riding & Adventure': '#92400e',
  }
  return colors[cat] || '#7c3aed'
}

function formatEventDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString(
    'en-PK', {
      weekday: 'short', day: 'numeric',
      month: 'short'
    }
  )
}

function formatEventTime(timeStr) {
  if (!timeStr) return ''
  const [h, m] = timeStr.split(':')
  const hour = parseInt(h)
  return `${hour % 12 || 12}:${m} ${
    hour >= 12 ? 'PM' : 'AM'
  }`
}

const DESTINATIONS = [
  { name: 'Hunza Valley', desc: 'Cherry blossoms & forts', emoji: '🌸', color: '#fdf2f8' },
  { name: 'Skardu', desc: 'Gateway to K2', emoji: '🏔️', color: '#f0f9ff' },
  { name: 'Gilgit', desc: 'Cultural capital', emoji: '🌆', color: '#f0fdf4' },
  { name: 'Nagar', desc: 'Glaciers & villages', emoji: '🧊', color: '#eff6ff' },
  { name: 'Astore', desc: 'Remote scenic valleys', emoji: '🛣️', color: '#fefce8' },
  { name: 'Ghizer', desc: 'Phander Lake & forests', emoji: '🌲', color: '#f0fdf4' },
]

export default function Home() {
  const [featuredListings, setFeaturedListings] = useState([])
  const [upcomingEvents, setUpcomingEvents] =
    useState([])
  const [stats, setStats] = useState({
    listings: 0, locations: 0, events: 0
  })
  const [homeSearch, setHomeSearch] = useState('')
  const navigate = useNavigate()
  const { isMobile, isTablet } = useWindowSize()

  useEffect(() => {
    api.get('/listings').then(res => {
      const data = res.data || []
      const sorted = [...data].sort((a, b) => {
        if (a.is_featured && !b.is_featured) return -1
        if (!a.is_featured && b.is_featured) return 1
        return (b.average_rating || 0) - (a.average_rating || 0)
      })
      setFeaturedListings(sorted.slice(0, 6))
      const locs = new Set(
        data.map(l =>
          l.location?.split(',')[0]?.trim()
        )
      ).size
      setStats(prev => ({
        ...prev,
        listings: data.length,
        locations: locs
      }))
    }).catch(() => {})

    api.get('/events/').then(res => {
      const data = res.data || []
      setStats(prev => ({
        ...prev, events: data.length
      }))
      const sorted = data
        .filter(e => e.status === 'active')
        .sort((a, b) =>
          new Date(a.event_date) -
          new Date(b.event_date)
        )
        .slice(0, 4)
      setUpcomingEvents(sorted)
    }).catch(() => {})
  }, [])

  return (
    <div style={{
      background: 'var(--bg-primary)',
      minHeight: '100vh', fontFamily: 'var(--font-primary)'
    }}>

      {/* ══════════════════════════════════════
          HERO — Full dark immersive section
      ══════════════════════════════════════ */}
      <div style={{
        background: 'linear-gradient(160deg, #0a0f1e 0%, #0f2340 40%, #0c3460 70%, #0ea5e9 100%)',
        padding: isMobile ? '48px 16px 72px' : '72px 16px 120px',
        position: 'relative', overflow: 'hidden'
      }}>
        {/* Glowing orbs */}
        <div style={{
          position: 'absolute', top: '10%', right: '8%',
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(14,165,233,0.18) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute', bottom: '5%', left: '5%',
          width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{
          maxWidth: '760px', margin: '0 auto',
          textAlign: 'center', position: 'relative', zIndex: 1
        }}>
          {/* Pill badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center',
            gap: '8px',
            background: 'rgba(14,165,233,0.15)',
            border: '1px solid rgba(14,165,233,0.35)',
            borderRadius: '999px',
            padding: '8px 20px', marginBottom: '28px',
            fontSize: '0.82rem', fontWeight: 700,
            color: '#7dd3fc', letterSpacing: '0.05em',
            textTransform: 'uppercase'
          }}>
            ✦ Pakistan's #1 GB Travel Platform
          </div>

          {/* Main headline */}
          <h1 style={{
            margin: '0 0 22px',
            fontSize: 'clamp(2.2rem, 6vw, 3.6rem)',
            fontWeight: 800, lineHeight: 1.15,
            letterSpacing: '-0.03em'
          }}>
            <span style={{ color: 'white' }}>
              Discover the
            </span>
            <br />
            <span style={{
              background: 'linear-gradient(90deg, #38bdf8, #818cf8, #38bdf8)',
              backgroundSize: '200%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Roof of the World
            </span>
          </h1>

          <p style={{
            color: 'rgba(255,255,255,0.6)',
            margin: '0 auto 40px',
            fontSize: '1.1rem', lineHeight: 1.75,
            maxWidth: '520px'
          }}>
            Book hotels, tours, transport & activities across
            Gilgit-Baltistan. Your complete journey,
            planned in minutes.
          </p>

          {/* Hero Search Bar */}
          <div
            style={{
              maxWidth: '600px',
              margin: '0 auto 24px',
              display: 'flex',
              gap: '8px',
              flexDirection: isMobile ? 'column' : 'row',
              alignItems: isMobile ? 'stretch' : 'center',
            }}
          >
            <div style={{ flex: 1, position: 'relative' }}>
              <span
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '1.1rem',
                  pointerEvents: 'none',
                }}
              >
                🔍
              </span>
              <input
                type="text"
                placeholder="Search hotels, tours, activities..."
                value={homeSearch}
                onChange={(e) => setHomeSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && homeSearch.trim()) {
                    navigate(`/search?q=${encodeURIComponent(homeSearch.trim())}`)
                  }
                }}
                style={{
                  width: '100%',
                  padding: '14px 14px 14px 44px',
                  borderRadius: '12px',
                  border: 'none',
                  fontSize: '0.95rem',
                  outline: 'none',
                  background: 'rgba(255,255,255,0.95)',
                  color: '#111827',
                  boxSizing: 'border-box',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                }}
              />
            </div>
            <button
              type="button"
              onClick={() => {
                if (homeSearch.trim()) {
                  navigate(`/search?q=${encodeURIComponent(homeSearch.trim())}`)
                } else {
                  navigate('/search')
                }
              }}
              style={{
                padding: '14px 20px',
                borderRadius: '12px',
                border: 'none',
                background: '#f59e0b',
                color: 'white',
                fontWeight: 800,
                cursor: 'pointer',
                fontSize: '0.9rem',
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 12px rgba(245,158,11,0.4)',
              }}
            >
              Search
            </button>
          </div>

          {/* CTA buttons */}
          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'stretch' : 'center',
            gap: '14px',
            justifyContent: 'center', flexWrap: 'wrap',
            marginBottom: '56px'
          }}>
            <button
              onClick={() => navigate('/listings')}
              style={{
                background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
                color: 'white', border: 'none',
                borderRadius: '14px',
                padding: '15px 36px',
                fontWeight: 800, fontSize: '1rem',
                cursor: 'pointer',
                boxShadow: '0 8px 32px rgba(14,165,233,0.35)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                letterSpacing: '-0.01em'
              }}
              onMouseEnter={e => {
                e.target.style.transform = 'translateY(-2px)'
                e.target.style.boxShadow =
                  '0 12px 40px rgba(14,165,233,0.5)'
              }}
              onMouseLeave={e => {
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow =
                  '0 8px 32px rgba(14,165,233,0.35)'
              }}
            >
              Explore Stays & Experiences →
            </button>
            <button
              onClick={() => navigate('/map')}
              style={{
                background: 'rgba(255,255,255,0.07)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '14px',
                padding: '15px 28px',
                fontWeight: 600, fontSize: '1rem',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={e =>
                e.target.style.background =
                  'rgba(255,255,255,0.12)'
              }
              onMouseLeave={e =>
                e.target.style.background =
                  'rgba(255,255,255,0.07)'
              }
            >
              📍 View on Map
            </button>
          </div>

          {/* Stats */}
          <div style={{
            display: 'inline-flex', gap: '0',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            overflow: isMobile ? 'auto' : 'hidden'
          }}>
            {[
              { v: stats.listings + '+', l: 'Services' },
              { v: stats.locations + '+', l: 'Locations' },
              { v: stats.events + '+', l: 'Events' },
              { v: '4', l: 'Categories' },
              { v: '100%', l: 'GB Coverage' },
            ].map((s, i, arr) => (
              <div key={s.l} style={{
                padding: '16px 28px', textAlign: 'center',
                borderRight: i < arr.length - 1
                  ? '1px solid rgba(255,255,255,0.08)'
                  : 'none'
              }}>
                <div style={{
                  fontSize: '1.4rem', fontWeight: 800,
                  color: 'white', lineHeight: 1
                }}>
                  {s.v}
                </div>
                <div style={{
                  fontSize: '0.72rem',
                  color: 'rgba(255,255,255,0.45)',
                  marginTop: '4px', fontWeight: 500
                }}>
                  {s.l}
                </div>
              </div>
            ))}
          </div>

          <div
            onClick={() => navigate('/deals')}
            style={{
              maxWidth: '900px', margin: '20px auto 0',
              padding: '0 16px',
            }}
          >
            <div style={{
              background: 'linear-gradient(135deg, #f59e0b22, #d9770622)',
              border: '1px solid #f59e0b44',
              borderRadius: 'var(--radius-md)',
              padding: '14px 20px', cursor: 'pointer',
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', gap: '12px',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center',
                gap: '10px',
              }}>
                <span style={{ fontSize: '1.5rem' }}>🎟️</span>
                <div>
                  <div style={{
                    fontWeight: 700, fontSize: '0.9rem',
                    color: '#d97706',
                  }}>
                    Exclusive Deals Available!
                  </div>
                  <div style={{
                    fontSize: '0.78rem',
                    color: 'var(--text-secondary)',
                  }}>
                    Use coupon codes for discounts on
                    hotels, tours & events
                  </div>
                </div>
              </div>
              <span style={{
                color: '#d97706', fontWeight: 700,
                fontSize: '0.875rem', whiteSpace: 'nowrap',
              }}>
                View Deals →
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          SERVICE CATEGORIES
      ══════════════════════════════════════ */}
      <div style={{
        background: 'var(--bg-secondary)',
        padding: '80px 16px'
      }}>
        <div style={{
          maxWidth: '1000px', margin: '0 auto'
        }}>
          <div style={{
            textAlign: 'center', marginBottom: '48px'
          }}>
            <h2 style={{
              margin: '0 0 12px',
              fontSize: '1.9rem', fontWeight: 800,
              color: 'var(--text-primary)', letterSpacing: '-0.02em'
            }}>
              Everything You Need
            </h2>
            <p style={{
              margin: 0,
              color: 'var(--text-secondary)',
              fontSize: '1rem'
            }}>
              One platform for your entire GB journey
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile
              ? '1fr 1fr' : 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px'
          }}>
            {FEATURES.map(f => (
              <div key={f.title}
                onClick={() => navigate('/listings')}
                style={{
                  padding: '28px 24px',
                  background: 'var(--bg-card)',
                  borderRadius: '20px',
                  border: '1px solid var(--border-color)',
                  cursor: 'pointer',
                  transition: 'all 0.22s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background =
                    'rgba(255,255,255,0.08)'
                  e.currentTarget.style.transform =
                    'translateY(-4px)'
                  e.currentTarget.style.borderColor =
                    f.color + '66'
                  e.currentTarget.style.boxShadow =
                    '0 16px 40px rgba(0,0,0,0.3)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background =
                    'var(--bg-card)'
                  e.currentTarget.style.transform =
                    'translateY(0)'
                  e.currentTarget.style.borderColor =
                    'var(--border-color)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div style={{
                  width: 52, height: 52,
                  borderRadius: '14px',
                  background: f.color + '22',
                  border: '1px solid ' + f.color + '44',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem', marginBottom: '16px'
                }}>
                  {f.emoji}
                </div>
                <h3 style={{
                  margin: '0 0 8px', fontWeight: 700,
                  fontSize: '1rem', color: 'var(--text-primary)'
                }}>
                  {f.title}
                </h3>
                <p style={{
                  margin: 0, fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6
                }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '0 16px',
      }}>
        <RecentlyViewed />
      </div>

      {/* ══════════════════════════════════════
          FEATURED LISTINGS
      ══════════════════════════════════════ */}
      {featuredListings.length > 0 && (
        <div style={{
          background: 'var(--bg-primary)',
          padding: '80px 16px'
        }}>
          <div style={{
            maxWidth: '1100px', margin: '0 auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              marginBottom: '40px',
              flexWrap: 'wrap', gap: '16px'
            }}>
              <div>
                <p style={{
                  margin: '0 0 8px', fontSize: '0.8rem',
                  color: 'var(--accent)', fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase'
                }}>
                  ✦ Handpicked for you
                </p>
                <h2 style={{
                  margin: 0, fontSize: '1.9rem',
                  fontWeight: 800, color: 'var(--text-primary)',
                  letterSpacing: '-0.02em'
                }}>
                  ⭐ Featured Services
                </h2>
              </div>
              <button
                onClick={() => navigate('/listings')}
                style={{
                  background: 'transparent',
                  color: 'var(--accent)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  padding: '10px 22px',
                  cursor: 'pointer', fontWeight: 600,
                  fontSize: '0.875rem',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => {
                  e.target.style.background =
                    'rgba(56,189,248,0.08)'
                  e.target.style.borderColor =
                    'rgba(56,189,248,0.6)'
                }}
                onMouseLeave={e => {
                  e.target.style.background = 'transparent'
                  e.target.style.borderColor =
                    'var(--border-color)'
                }}
              >
                View All →
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr'
                : isTablet ? 'repeat(2, 1fr)'
                  : 'repeat(3, 1fr)',
              gap: '16px'
            }}>
              {featuredListings.map(listing => {
                return (
                  <div key={listing.id} style={{marginBottom:'0'}}>
                    <div
                      onClick={() => navigate('/listing/' + listing.id)}
                      style={{
                        background:'var(--bg-card)',
                        borderRadius:'var(--radius-lg)',
                        border:'1px solid var(--border-color)',
                        overflow:'hidden',cursor:'pointer',
                        transition:'all 0.2s ease',
                        boxShadow:'var(--shadow-sm)'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.transform = 'translateY(-4px)'
                        e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.12)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
                      }}
                    >
                      <div style={{
                        height:'200px',overflow:'hidden',
                        position:'relative',background:'#e0f2fe'
                      }}>
                        <img
                          src={
                            listing.image_url
                              ? (listing.image_url.startsWith('http')
                                  ? listing.image_url
                                  : 'http://127.0.0.1:8000/uploads/' + listing.image_url)
                              : 'https://placehold.co/400x200/1e3a5f/ffffff?text=Hotel'
                          }
                          alt={listing.title || 'Hotel'}
                          onError={e => {
                            e.target.onerror = null
                            e.target.src = 'https://placehold.co/400x200/1e3a5f/ffffff?text=Hotel'
                          }}
                          style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}
                        />
                        <div style={{
                          position:'absolute',top:'10px',left:'10px',
                          background:'#0ea5e9',color:'white',
                          padding:'3px 9px',borderRadius:'999px',
                          fontSize:'0.68rem',fontWeight:'700'
                        }}>
                          {(listing.service_type || '').replace(/_/g,' ')}
                        </div>
                        {listing.is_featured ? (
                          <div style={{
                            position:'absolute',top:'10px',right:'10px',
                            background:'#f59e0b',color:'white',
                            padding:'3px 8px',borderRadius:'999px',
                            fontSize:'0.65rem',fontWeight:'700'
                          }}>Featured</div>
                        ) : null}
                        {listing.average_rating > 0 ? (
                          <div style={{
                            position:'absolute',bottom:'10px',left:'10px',
                            background:'#16a34a',color:'white',
                            padding:'3px 9px',borderRadius:'6px',
                            fontSize:'0.75rem',fontWeight:'700'
                          }}>
                            {Number(listing.average_rating).toFixed(1)}
                          </div>
                        ) : null}
                      </div>
                      <div style={{padding:'14px 16px'}}>
                        <h3 style={{
                          margin:'0 0 4px 0',fontWeight:'700',
                          fontSize:'0.95rem',color:'var(--text-primary)',
                          overflow:'hidden',textOverflow:'ellipsis',
                          whiteSpace:'nowrap'
                        }}>
                          {listing.title}
                        </h3>
                        <div style={{
                          fontSize:'0.78rem',
                          color:'var(--text-secondary)',marginBottom:'10px'
                        }}>
                          {listing.location}
                        </div>
                        <div style={{
                          display:'flex',
                          justifyContent:'space-between',
                          alignItems:'center'
                        }}>
                          <div>
                            <div style={{
                              fontSize:'0.65rem',
                              color:'var(--text-muted)',marginBottom:'1px'
                            }}>from</div>
                            <div style={{
                              fontSize:'1.1rem',fontWeight:'800',
                              color:'#0ea5e9',lineHeight:'1'
                            }}>
                              PKR {(listing.price_per_night || 0).toLocaleString('en-PK')}
                              <span style={{
                                fontSize:'0.68rem',fontWeight:'400',
                                color:'var(--text-muted)',marginLeft:'3px'
                              }}>/night</span>
                            </div>
                          </div>
                          <button
                            onClick={e => {
                              e.stopPropagation()
                              navigate('/listing/' + listing.id)
                            }}
                            style={{
                              padding:'7px 14px',borderRadius:'8px',
                              border:'none',
                              background:'linear-gradient(135deg,#1e3a5f,#0ea5e9)',
                              color:'white',fontWeight:'700',
                              cursor:'pointer',fontSize:'0.8rem'
                            }}
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          UPCOMING EVENTS SECTION
      ══════════════════════════════════════ */}
      {upcomingEvents.length > 0 && (
        <div style={{
          background: 'var(--bg-primary)',
          padding: '80px 16px'
        }}>
          <div style={{
            maxWidth: '1100px', margin: '0 auto'
          }}>

            {/* Section header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              marginBottom: '32px',
              flexWrap: 'wrap', gap: '12px'
            }}>
              <div>
                <p style={{
                  margin: '0 0 8px',
                  fontSize: '0.8rem',
                  color: '#7c3aed', fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase'
                }}>
                  ✦ Happening in GB
                </p>
                <h2 style={{
                  margin: '0 0 6px',
                  fontSize: '1.9rem', fontWeight: 800,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em'
                }}>
                  Upcoming Events
                </h2>
                <p style={{
                  margin: 0,
                  color: 'var(--text-secondary)',
                  fontSize: '0.9rem'
                }}>
                  Polo, music, treks, festivals & more
                </p>
              </div>
              <button
                onClick={() => navigate('/events')}
                style={{
                  background: 'transparent',
                  color: '#7c3aed',
                  border:
                    '1px solid rgba(124,58,237,0.3)',
                  borderRadius: '10px',
                  padding: '10px 22px',
                  cursor: 'pointer', fontWeight: 600,
                  fontSize: '0.875rem',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => {
                  e.target.style.background =
                    'rgba(124,58,237,0.08)'
                  e.target.style.borderColor =
                    'rgba(124,58,237,0.6)'
                }}
                onMouseLeave={e => {
                  e.target.style.background =
                    'transparent'
                  e.target.style.borderColor =
                    'rgba(124,58,237,0.3)'
                }}
              >
                All Events →
              </button>
            </div>

            {/* Events grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '20px'
            }}>
              {upcomingEvents.map(event => {
                const color =
                  getCategoryColor(event.category)
                const isFree = event.is_free
                const spotsLeft = event.spots_remaining
                const isSoldOut = spotsLeft <= 0

                return (
                  <div key={event.id}
                    onClick={() =>
                      navigate(`/events/${event.id}`)
                    }
                    style={{
                      background: 'var(--bg-card)',
                      borderRadius: 'var(--radius-lg)',
                      border:
                        '1px solid var(--border-color)',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      boxShadow: 'var(--shadow-sm)',
                      transition: 'transform 0.18s, box-shadow 0.18s'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform =
                        'translateY(-6px)'
                      e.currentTarget.style.boxShadow =
                        `0 16px 40px ${color}22`
                      e.currentTarget.style.borderColor =
                        color + '44'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform =
                        'translateY(0)'
                      e.currentTarget.style.boxShadow =
                        'var(--shadow-sm)'
                      e.currentTarget.style.borderColor =
                        'var(--border-color)'
                    }}
                  >
                    {/* Event image / color block */}
                    <div style={{
                      position: 'relative',
                      height: '160px',
                      background: color + '22',
                      overflow: 'hidden'
                    }}>
                      {event.image_url ? (
                        <img
                          src={`http://127.0.0.1:8000/uploads/${event.image_url}`}
                          alt={event.title}
                          onError={e => {
                            e.target.style.display = 'none'
                          }}
                          style={{
                            width: '100%', height: '100%',
                            objectFit: 'cover',
                            display: 'block'
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '100%', height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '3.5rem'
                        }}>
                          🎪
                        </div>
                      )}

                      {/* Gradient overlay */}
                      <div style={{
                        position: 'absolute', inset: 0,
                        background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)'
                      }} />

                      {/* Category badge */}
                      <div style={{
                        position: 'absolute',
                        top: '10px', left: '10px',
                        background: color,
                        color: 'white',
                        padding: '3px 10px',
                        borderRadius: '999px',
                        fontSize: '0.7rem', fontWeight: 700
                      }}>
                        {event.category}
                      </div>

                      {/* Free / Sold Out badge */}
                      <div style={{
                        position: 'absolute',
                        top: '10px', right: '10px',
                        display: 'flex', gap: '4px'
                      }}>
                        {isFree && (
                          <span style={{
                            background: '#16a34a',
                            color: 'white',
                            padding: '3px 8px',
                            borderRadius: '999px',
                            fontSize: '0.68rem',
                            fontWeight: 700
                          }}>
                            FREE
                          </span>
                        )}
                        {isSoldOut && (
                          <span style={{
                            background: '#dc2626',
                            color: 'white',
                            padding: '3px 8px',
                            borderRadius: '999px',
                            fontSize: '0.68rem',
                            fontWeight: 700
                          }}>
                            SOLD OUT
                          </span>
                        )}
                      </div>

                      {/* Date on image */}
                      <div style={{
                        position: 'absolute',
                        bottom: '8px', left: '10px',
                        color: 'white', fontSize: '0.78rem',
                        fontWeight: 600,
                        textShadow:
                          '0 1px 4px rgba(0,0,0,0.5)'
                      }}>
                        📅 {formatEventDate(event.event_date)}
                        {' · '}
                        {formatEventTime(event.event_time)}
                      </div>
                    </div>

                    {/* Card body */}
                    <div style={{padding: '14px 16px'}}>
                      <h3 style={{
                        margin: '0 0 5px',
                        fontWeight: 700, fontSize: '0.95rem',
                        color: 'var(--text-primary)',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {event.title}
                      </h3>

                      <p style={{
                        margin: '0 0 10px',
                        fontSize: '0.8rem',
                        color: 'var(--text-secondary)'
                      }}>
                        📍 {event.venue}, {event.location}
                      </p>

                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div style={{
                          fontWeight: 800,
                          fontSize: '1rem',
                          color: isFree ? '#16a34a' : color
                        }}>
                          {isFree ? 'FREE'
                            : event.starting_price === 0
                            ? 'FREE'
                            : `PKR ${event.starting_price
                                ?.toLocaleString('en-PK')}+`
                          }
                        </div>
                        <div style={{
                          fontSize: '0.72rem',
                          color: spotsLeft <= 10
                            ? '#dc2626'
                            : 'var(--text-muted)'
                        }}>
                          {isSoldOut
                            ? '❌ Sold Out'
                            : spotsLeft <= 10
                            ? `🔥 ${spotsLeft} left`
                            : `${spotsLeft} spots`
                          }
                        </div>
                      </div>
                    </div>

                    {/* Bottom action bar */}
                    <div style={{
                      padding: '10px 16px',
                      borderTop:
                        '1px solid var(--border-color)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'var(--bg-secondary)'
                    }}>
                      <span style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)'
                      }}>
                        By {event.organizer_name}
                      </span>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 600, color: color
                      }}>
                        Get Tickets →
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Bottom CTA */}
            <div style={{
              marginTop: '32px', textAlign: 'center'
            }}>
              <button
                onClick={() => navigate('/events')}
                style={{
                  background: 'linear-gradient(135deg, #4c1d95, #7c3aed)',
                  color: 'white', border: 'none',
                  borderRadius: '12px',
                  padding: '13px 36px',
                  cursor: 'pointer', fontWeight: 700,
                  fontSize: '0.95rem',
                  boxShadow: '0 8px 24px rgba(124,58,237,0.3)',
                  transition: 'transform 0.2s'
                }}
                onMouseEnter={e =>
                  e.target.style.transform =
                    'translateY(-2px)'
                }
                onMouseLeave={e =>
                  e.target.style.transform =
                    'translateY(0)'
                }
              >
                🎪 Explore All Events
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          DESTINATIONS
      ══════════════════════════════════════ */}
      <div style={{
        background: 'var(--bg-secondary)',
        padding: '80px 16px'
      }}>
        <div style={{
          maxWidth: '1000px', margin: '0 auto'
        }}>
          <div style={{
            textAlign: 'center', marginBottom: '48px'
          }}>
            <p style={{
              margin: '0 0 10px', fontSize: '0.8rem',
              color: 'var(--accent)', fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase'
            }}>
              ✦ Explore GB
            </p>
            <h2 style={{
              margin: '0 0 12px', fontSize: '1.9rem',
              fontWeight: 800, color: 'var(--text-primary)',
              letterSpacing: '-0.02em'
            }}>
              Popular Destinations
            </h2>
            <p style={{
              margin: 0,
              color: 'var(--text-secondary)',
              fontSize: '0.95rem'
            }}>
              The most breathtaking valleys on Earth
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile
              ? '1fr 1fr' : 'repeat(auto-fill, minmax(155px, 1fr))',
            gap: '12px'
          }}>
            {DESTINATIONS.map(d => (
              <div key={d.name}
                onClick={() => navigate('/listings')}
                style={{
                  padding: '22px 16px',
                  background: 'var(--bg-card)',
                  borderRadius: '18px',
                  border: '1px solid var(--border-color)',
                  textAlign: 'center', cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background =
                    'var(--accent-light)'
                  e.currentTarget.style.borderColor =
                    'var(--accent)'
                  e.currentTarget.style.transform =
                    'translateY(-4px)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background =
                    'var(--bg-card)'
                  e.currentTarget.style.borderColor =
                    'var(--border-color)'
                  e.currentTarget.style.transform =
                    'translateY(0)'
                }}
              >
                <div style={{
                  fontSize: '1.8rem', marginBottom: '10px'
                }}>
                  {d.emoji}
                </div>
                <div style={{
                  fontWeight: 700, fontSize: '0.875rem',
                  color: 'var(--text-primary)', marginBottom: '5px'
                }}>
                  {d.name}
                </div>
                <div style={{
                  fontSize: '0.72rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.4
                }}>
                  {d.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          CTA SECTION
      ══════════════════════════════════════ */}
      <div style={{
        background: 'linear-gradient(135deg, #0c1a35 0%, #0f2d5a 50%, #0369a1 100%)',
        padding: '80px 16px', textAlign: 'center',
        position: 'relative', overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at center, rgba(14,165,233,0.15) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />
        <div style={{position: 'relative', zIndex: 1}}>
          <div style={{
            display: 'inline-block',
            background: 'rgba(14,165,233,0.15)',
            border: '1px solid rgba(14,165,233,0.3)',
            borderRadius: '999px',
            padding: '7px 20px', marginBottom: '24px',
            fontSize: '0.82rem', fontWeight: 700,
            color: '#7dd3fc'
          }}>
            🚀 Start Your Journey Today
          </div>
          <h2 style={{
            color: 'white', margin: '0 0 14px',
            fontSize: 'clamp(1.6rem, 4vw, 2.4rem)',
            fontWeight: 800, letterSpacing: '-0.02em'
          }}>
            Ready to Explore GB?
          </h2>
          <p style={{
            color: 'rgba(255,255,255,0.55)',
            margin: '0 auto 36px',
            fontSize: '1rem', maxWidth: '420px'
          }}>
            Join travelers discovering the world's most
            spectacular mountain destination
          </p>
          <div style={{
            display: 'flex', gap: '14px',
            justifyContent: 'center', flexWrap: 'wrap'
          }}>
            <button
              onClick={() => navigate('/register')}
              style={{
                background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
                color: 'white', border: 'none',
                borderRadius: '14px',
                padding: '15px 36px',
                fontWeight: 800, fontSize: '1rem',
                cursor: 'pointer',
                boxShadow: '0 8px 32px rgba(14,165,233,0.4)',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={e =>
                e.target.style.transform = 'translateY(-2px)'
              }
              onMouseLeave={e =>
                e.target.style.transform = 'translateY(0)'
              }
            >
              Create Free Account →
            </button>
            <button
              onClick={() => navigate('/listings')}
              style={{
                background: 'rgba(255,255,255,0.07)',
                color: 'rgba(255,255,255,0.85)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '14px',
                padding: '15px 28px',
                fontWeight: 600, fontSize: '1rem',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={e =>
                e.target.style.background =
                  'rgba(255,255,255,0.12)'
              }
              onMouseLeave={e =>
                e.target.style.background =
                  'rgba(255,255,255,0.07)'
              }
            >
              Browse Without Signing Up
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          FOOTER
      ══════════════════════════════════════ */}
      <div style={{
        background: 'var(--bg-secondary)',
        padding: '40px 16px',
        borderTop: '1px solid var(--border-color)'
      }}>
        <div style={{
          maxWidth: '900px', margin: '0 auto',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: 'center', flexWrap: 'wrap',
          gap: isMobile ? '16px' : '20px',
          textAlign: isMobile ? 'center' : 'left'
        }}>
          <div style={{ textAlign: isMobile ? 'center' : 'left' }}>
            <div style={{
              fontSize: '1.2rem', fontWeight: 800,
              color: 'var(--text-primary)', marginBottom: '4px'
            }}>
              🏔️ GB Tourism
            </div>
            <p style={{
              color: 'var(--text-muted)',
              margin: 0, fontSize: '0.8rem'
            }}>
              © 2026 GB Tourism. Built for Gilgit-Baltistan.
            </p>
          </div>
          <div style={{
            display: 'flex', gap: '24px', flexWrap: 'wrap'
          }}>
            {[
              { label: 'Explore', path: '/listings' },
              { label: 'Map View', path: '/map' },
              { label: 'Register', path: '/register' },
              { label: 'Login', path: '/login' },
            ].map(l => (
              <span key={l.path}
                onClick={() => navigate(l.path)}
                style={{
                  color: 'var(--text-secondary)',
                  cursor: 'pointer', fontSize: '0.875rem',
                  fontWeight: 500,
                  transition: 'color 0.15s'
                }}
                onMouseEnter={e =>
                  e.target.style.color = 'var(--text-primary)'
                }
                onMouseLeave={e =>
                  e.target.style.color =
                    'var(--text-secondary)'
                }
              >
                {l.label}
              </span>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}
