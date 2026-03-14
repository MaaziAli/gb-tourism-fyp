import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { getImageUrl } from '../utils/image'

function getServiceBadge(type) {
  switch(type) {
    case 'hotel': return { bg: '#2563eb', label: '🏨 Hotel' }
    case 'tour': return { bg: '#16a34a', label: '🏔️ Tour' }
    case 'transport': return { bg: '#d97706', label: '🚐 Transport' }
    case 'activity': return { bg: '#7c3aed', label: '🎯 Activity' }
    default: return { bg: '#0ea5e9', label: type }
  }
}

const FEATURES = [
  {
    emoji: '🏨',
    title: 'Hotels & Stays',
    desc: 'From budget guesthouses to luxury resorts across all of Gilgit-Baltistan'
  },
  {
    emoji: '🏔️',
    title: 'Tours & Treks',
    desc: 'Guided mountain tours, glacier treks, and cultural experiences'
  },
  {
    emoji: '🚐',
    title: 'Transport',
    desc: 'Jeep rides, shared vans, and private transfers between destinations'
  },
  {
    emoji: '🎯',
    title: 'Activities',
    desc: 'Fishing, jeep safaris, polo matches, and local adventure sports'
  },
]

const DESTINATIONS = [
  { name: 'Hunza Valley', desc: 'Cherry blossoms & Karimabad Fort', emoji: '🌸' },
  { name: 'Skardu', desc: 'Gateway to K2 & Deosai Plains', emoji: '🏔️' },
  { name: 'Gilgit', desc: 'Capital city & cultural hub', emoji: '🌆' },
  { name: 'Nagar', desc: 'Glaciers & traditional villages', emoji: '🧊' },
  { name: 'Astore', desc: 'Remote valleys & scenic drives', emoji: '🛣️' },
  { name: 'Ghizer', desc: 'Phander Lake & pine forests', emoji: '🌲' },
]

export default function Home() {
  const [featuredListings, setFeaturedListings] = useState([])
  const [stats, setStats] = useState({
    listings: 0, locations: 0
  })
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/listings').then(res => {
      const data = res.data || []
      setFeaturedListings(data.slice(0, 6))
      const locations = new Set(
        data.map(l => l.location?.split(',')[0]?.trim())
      ).size
      setStats({ listings: data.length, locations })
    }).catch(() => {})
  }, [])

  return (
    <div style={{
      background: 'var(--bg-primary)',
      minHeight: '100vh'
    }}>

      {/* ============ HERO ============ */}
      <div style={{
        background:
          'linear-gradient(135deg, #0f2340 0%, #1e3a5f 50%, #0ea5e9 100%)',
        padding: '80px 16px 100px',
        position: 'relative', overflow: 'hidden'
      }}>
        {/* Decorative circles */}
        <div style={{
          position: 'absolute', top: '-80px', right: '-80px',
          width: 320, height: 320, borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute', bottom: '-60px', left: '-60px',
          width: 240, height: 240, borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)',
          pointerEvents: 'none'
        }} />

        <div style={{
          maxWidth: '720px', margin: '0 auto',
          textAlign: 'center', position: 'relative'
        }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center',
            gap: '8px',
            background: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '999px',
            padding: '7px 18px', marginBottom: '24px',
            fontSize: '0.85rem', fontWeight: 600,
            color: 'white'
          }}>
            🏔️ Gilgit-Baltistan Travel Platform
          </div>

          {/* Headline */}
          <h1 style={{
            color: 'white', margin: '0 0 20px',
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            fontWeight: 800, lineHeight: 1.2,
            letterSpacing: '-0.03em'
          }}>
            Discover the Roof
            <br />
            <span style={{
              background:
                'linear-gradient(90deg, #7dd3fc, #38bdf8)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              of the World
            </span>
          </h1>

          <p style={{
            color: 'rgba(255,255,255,0.75)',
            margin: '0 0 36px',
            fontSize: '1.1rem', lineHeight: 1.7,
            maxWidth: '520px', marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            Book hotels, tours, transport and activities
            across Gilgit-Baltistan — all in one place.
          </p>

          {/* CTA buttons */}
          <div style={{
            display: 'flex', gap: '12px',
            justifyContent: 'center', flexWrap: 'wrap'
          }}>
            <button
              onClick={() => navigate('/listings')}
              style={{
                background: 'white',
                color: '#1e3a5f',
                border: 'none', borderRadius: '12px',
                padding: '14px 32px',
                fontWeight: 800, fontSize: '1rem',
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={e =>
                e.target.style.transform = 'translateY(-2px)'
              }
              onMouseLeave={e =>
                e.target.style.transform = 'translateY(0)'
              }
            >
              Explore Stays →
            </button>
            <button
              onClick={() => navigate('/map')}
              style={{
                background: 'rgba(255,255,255,0.15)',
                color: 'white',
                border: '2px solid rgba(255,255,255,0.3)',
                borderRadius: '12px',
                padding: '14px 32px',
                fontWeight: 700, fontSize: '1rem',
                cursor: 'pointer',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={e =>
                e.target.style.transform = 'translateY(-2px)'
              }
              onMouseLeave={e =>
                e.target.style.transform = 'translateY(0)'
              }
            >
              📍 View Map
            </button>
          </div>

          {/* Stats row */}
          <div style={{
            display: 'flex', gap: '32px',
            justifyContent: 'center',
            marginTop: '48px', flexWrap: 'wrap'
          }}>
            {[
              { value: stats.listings + '+', label: 'Services Listed' },
              { value: stats.locations + '+', label: 'Locations' },
              { value: '4', label: 'Service Types' },
            ].map(stat => (
              <div key={stat.label} style={{
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '1.8rem', fontWeight: 800,
                  color: 'white', lineHeight: 1
                }}>
                  {stat.value}
                </div>
                <div style={{
                  fontSize: '0.8rem',
                  color: 'rgba(255,255,255,0.65)',
                  marginTop: '4px'
                }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ============ FEATURES ============ */}
      <div style={{
        maxWidth: '1000px', margin: '0 auto',
        padding: '64px 16px'
      }}>
        <div style={{textAlign: 'center', marginBottom: '40px'}}>
          <h2 style={{
            margin: '0 0 10px', fontSize: '1.7rem',
            fontWeight: 800, color: 'var(--text-primary)',
            letterSpacing: '-0.02em'
          }}>
            Everything You Need
          </h2>
          <p style={{
            margin: 0, color: 'var(--text-secondary)',
            fontSize: '0.95rem'
          }}>
            One platform for your entire GB journey
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px'
        }}>
          {FEATURES.map(f => (
            <div key={f.title}
              onClick={() => navigate('/listings')}
              style={{
                padding: '24px',
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-sm)',
                cursor: 'pointer',
                transition: 'transform 0.18s, box-shadow 0.18s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform =
                  'translateY(-4px)'
                e.currentTarget.style.boxShadow =
                  '0 8px 24px rgba(0,0,0,0.1)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform =
                  'translateY(0)'
                e.currentTarget.style.boxShadow =
                  'var(--shadow-sm)'
              }}
            >
              <div style={{
                fontSize: '2rem', marginBottom: '12px'
              }}>
                {f.emoji}
              </div>
              <h3 style={{
                margin: '0 0 8px', fontWeight: 700,
                fontSize: '1rem',
                color: 'var(--text-primary)'
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

      {/* ============ FEATURED LISTINGS ============ */}
      {featuredListings.length > 0 && (
        <div style={{
          background: 'var(--bg-secondary)',
          padding: '64px 16px'
        }}>
          <div style={{
            maxWidth: '1100px', margin: '0 auto'
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: '32px',
              flexWrap: 'wrap', gap: '12px'
            }}>
              <div>
                <h2 style={{
                  margin: '0 0 6px', fontSize: '1.7rem',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em'
                }}>
                  Featured Services
                </h2>
                <p style={{
                  margin: 0,
                  color: 'var(--text-secondary)',
                  fontSize: '0.9rem'
                }}>
                  Handpicked stays and experiences
                </p>
              </div>
              <button
                onClick={() => navigate('/listings')}
                style={{
                  background: 'var(--bg-card)',
                  color: 'var(--accent)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  padding: '10px 20px',
                  cursor: 'pointer', fontWeight: 700,
                  fontSize: '0.875rem'
                }}
              >
                View All →
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '20px'
            }}>
              {featuredListings.map(listing => {
                const badge =
                  getServiceBadge(listing.service_type)
                return (
                  <div key={listing.id}
                    onClick={() =>
                      navigate(`/listing/${listing.id}`)
                    }
                    style={{
                      background: 'var(--bg-card)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      overflow: 'hidden', cursor: 'pointer',
                      boxShadow: 'var(--shadow-sm)',
                      transition:
                        'transform 0.18s, box-shadow 0.18s'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform =
                        'translateY(-4px)'
                      e.currentTarget.style.boxShadow =
                        '0 12px 32px rgba(0,0,0,0.1)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform =
                        'translateY(0)'
                      e.currentTarget.style.boxShadow =
                        'var(--shadow-sm)'
                    }}
                  >
                    <div style={{position: 'relative'}}>
                      <img
                        src={getImageUrl(listing.image_url)}
                        alt={listing.title}
                        onError={e => {
                          e.target.onerror = null
                          e.target.src =
                            'https://placehold.co/400x220/e5e7eb/9ca3af?text=GB+Tourism'
                        }}
                        style={{
                          width: '100%', height: '200px',
                          objectFit: 'cover', display: 'block'
                        }}
                      />
                      <span style={{
                        position: 'absolute',
                        top: '12px', left: '12px',
                        background: badge.bg, color: 'white',
                        padding: '4px 10px',
                        borderRadius: '999px',
                        fontSize: '0.72rem', fontWeight: 700
                      }}>
                        {badge.label}
                      </span>
                      {listing.average_rating > 0 && (
                        <span style={{
                          position: 'absolute',
                          top: '12px', right: '12px',
                          background: 'rgba(0,0,0,0.6)',
                          color: 'white',
                          padding: '4px 10px',
                          borderRadius: '999px',
                          fontSize: '0.72rem', fontWeight: 700
                        }}>
                          ⭐ {listing.average_rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                    <div style={{padding: '16px'}}>
                      <h3 style={{
                        margin: '0 0 6px', fontWeight: 700,
                        fontSize: '1rem',
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {listing.title}
                      </h3>
                      <p style={{
                        margin: '0 0 12px',
                        fontSize: '0.85rem',
                        color: 'var(--text-secondary)'
                      }}>
                        📍 {listing.location}
                      </p>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span style={{
                          fontSize: '1.1rem', fontWeight: 800,
                          color: 'var(--accent)'
                        }}>
                          PKR {listing.price_per_night
                            ?.toLocaleString('en-PK')}
                          <span style={{
                            fontSize: '0.78rem',
                            fontWeight: 400,
                            color: 'var(--text-muted)'
                          }}>
                            {' '}/night
                          </span>
                        </span>
                        <span style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-muted)'
                        }}>
                          {listing.review_count > 0
                            ? `${listing.review_count} reviews`
                            : 'No reviews'
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ============ DESTINATIONS ============ */}
      <div style={{
        maxWidth: '1000px', margin: '0 auto',
        padding: '64px 16px'
      }}>
        <div style={{textAlign: 'center', marginBottom: '40px'}}>
          <h2 style={{
            margin: '0 0 10px', fontSize: '1.7rem',
            fontWeight: 800, color: 'var(--text-primary)',
            letterSpacing: '-0.02em'
          }}>
            Popular Destinations
          </h2>
        <p style={{
            margin: 0, color: 'var(--text-secondary)',
            fontSize: '0.95rem'
          }}>
            Explore the most beautiful valleys in the world
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fill, minmax(160px, 1fr))',
          gap: '12px'
        }}>
          {DESTINATIONS.map(d => (
            <div key={d.name}
              onClick={() => navigate('/listings')}
              style={{
                padding: '20px 16px',
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                textAlign: 'center', cursor: 'pointer',
                transition: 'all 0.18s',
                boxShadow: 'var(--shadow-sm)'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform =
                  'translateY(-3px)'
                e.currentTarget.style.borderColor =
                  'var(--accent)'
                e.currentTarget.style.boxShadow =
                  '0 8px 20px rgba(14,165,233,0.15)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform =
                  'translateY(0)'
                e.currentTarget.style.borderColor =
                  'var(--border-color)'
                e.currentTarget.style.boxShadow =
                  'var(--shadow-sm)'
              }}
            >
              <div style={{
                fontSize: '1.8rem', marginBottom: '8px'
              }}>
                {d.emoji}
              </div>
              <div style={{
                fontWeight: 700, fontSize: '0.9rem',
                color: 'var(--text-primary)',
                marginBottom: '4px'
              }}>
                {d.name}
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.4
              }}>
                {d.desc}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ============ CTA BANNER ============ */}
      <div style={{
        background:
          'linear-gradient(135deg, #1e3a5f 0%, #0ea5e9 100%)',
        padding: '64px 16px', textAlign: 'center'
      }}>
        <h2 style={{
          color: 'white', margin: '0 0 12px',
          fontSize: '1.8rem', fontWeight: 800,
          letterSpacing: '-0.02em'
        }}>
          Ready to Explore GB?
        </h2>
        <p style={{
          color: 'rgba(255,255,255,0.8)',
          margin: '0 0 32px', fontSize: '1rem'
        }}>
          Join thousands of travelers discovering
          Gilgit-Baltistan
        </p>
        <div style={{
          display: 'flex', gap: '12px',
          justifyContent: 'center', flexWrap: 'wrap'
        }}>
          <button
            onClick={() => navigate('/register')}
            style={{
              background: 'white', color: '#1e3a5f',
              border: 'none', borderRadius: '12px',
              padding: '14px 32px',
              fontWeight: 800, fontSize: '1rem',
              cursor: 'pointer'
            }}
          >
            Get Started Free →
          </button>
          <button
            onClick={() => navigate('/listings')}
            style={{
              background: 'rgba(255,255,255,0.15)',
              color: 'white',
              border: '2px solid rgba(255,255,255,0.3)',
              borderRadius: '12px',
              padding: '14px 32px',
              fontWeight: 700, fontSize: '1rem',
              cursor: 'pointer'
            }}
          >
            Browse Without Account
          </button>
        </div>
      </div>

      {/* ============ FOOTER ============ */}
      <div style={{
        background: '#0f2340',
        padding: '32px 16px', textAlign: 'center'
      }}>
        <div style={{
          fontSize: '1.3rem', fontWeight: 800,
          color: 'white', marginBottom: '8px'
        }}>
          🏔️ GB Tourism
        </div>
        <p style={{
          color: 'rgba(255,255,255,0.5)',
          margin: '0 0 16px', fontSize: '0.85rem'
        }}>
          Your complete travel companion for Gilgit-Baltistan
        </p>
        <div style={{
          display: 'flex', gap: '20px',
          justifyContent: 'center', flexWrap: 'wrap'
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
                color: 'rgba(255,255,255,0.6)',
                cursor: 'pointer', fontSize: '0.85rem',
                fontWeight: 500,
                transition: 'color 0.15s'
              }}
              onMouseEnter={e =>
                e.target.style.color = 'white'
              }
              onMouseLeave={e =>
                e.target.style.color =
                  'rgba(255,255,255,0.6)'
              }
            >
              {l.label}
            </span>
          ))}
        </div>
        <p style={{
          color: 'rgba(255,255,255,0.3)',
          margin: '16px 0 0', fontSize: '0.75rem'
        }}>
          © 2025 GB Tourism. Built for Gilgit-Baltistan.
        </p>
      </div>

    </div>
  )
}

