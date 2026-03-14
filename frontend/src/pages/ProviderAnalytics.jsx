import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { getImageUrl } from '../utils/image'
import useWindowSize from '../hooks/useWindowSize'

export default function ProviderAnalytics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { isMobile } = useWindowSize()

  useEffect(() => {
    api
      .get('/bookings/provider/analytics')
      .then((r) => setData(r.data))
      .catch((e) =>
        setError(e.response?.data?.detail || 'Failed to load'),
      )
      .finally(() => setLoading(false))
  }, [])

  function Stars({ count }) {
    return (
      <span>
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            style={{
              color:
                i <= Math.round(count || 0)
                  ? '#f59e0b'
                  : 'var(--border-color)',
              fontSize: '1rem',
            }}
          >
            ★
          </span>
        ))}
      </span>
    )
  }

  if (loading)
    return (
      <div
        style={{
          background: 'var(--bg-primary)',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-secondary)',
          fontSize: '1rem',
        }}
      >
        Loading analytics...
      </div>
    )

  if (error)
    return (
      <div
        style={{
          background: 'var(--bg-primary)',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            padding: '24px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--danger-bg)',
            color: 'var(--danger)',
          }}
        >
          {error}
        </div>
      </div>
    )

  const statCards = [
    {
      icon: '🏨',
      label: 'Total Services',
      value: data.total_listings,
      color: '#6366f1',
    },
    {
      icon: '📅',
      label: 'Active Bookings',
      value: data.active_bookings,
      color: '#0ea5e9',
    },
    {
      icon: '💰',
      label: 'Total Revenue',
      value: `PKR ${(data.total_revenue || 0).toLocaleString('en-PK')}`,
      color: '#10b981',
    },
    {
      icon: '⭐',
      label: 'Average Rating',
      value:
        data.average_rating > 0
          ? `${data.average_rating} / 5`
          : 'No reviews',
      color: '#f59e0b',
    },
    {
      icon: '✍️',
      label: 'Total Reviews',
      value: data.total_reviews,
      color: '#8b5cf6',
    },
    {
      icon: '❌',
      label: 'Cancelled',
      value: data.cancelled_bookings,
      color: '#ef4444',
    },
  ]

  return (
    <div
      style={{
        background: 'var(--bg-primary)',
        minHeight: '100vh',
        padding: '32px 16px',
      }}
    >
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '32px',
          }}
        >
          <div>
            <h1
              style={{
                margin: '0 0 6px',
                fontSize: '1.8rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
              }}
            >
              📊 Analytics Dashboard
            </h1>
            <p
              style={{
                margin: 0,
                color: 'var(--text-secondary)',
              }}
            >
              Your services performance overview
            </p>
          </div>
          <button
            className="btn-primary"
            onClick={() => navigate('/add-listing')}
          >
            + List Your Service
          </button>
        </div>

        {/* Stat Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
            marginBottom: '32px',
          }}
        >
          {statCards.map((s, i) => (
            <div
              key={i}
              style={{
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 'var(--radius-sm)',
                  background: `${s.color}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  flexShrink: 0,
                }}
              >
                {s.icon}
              </div>
              <div>
                <div
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '4px',
                  }}
                >
                  {s.label}
                </div>
                <div
                  style={{
                    fontSize: '1.4rem',
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                  }}
                >
                  {s.value}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Listings Performance */}
        <div style={{ marginTop: '32px' }}>
          <h2
            style={{
              margin: '0 0 20px',
              fontSize: '1.2rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
            }}
          >
            🏆 Services Performance
          </h2>

          {data.listings_analytics?.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '40px',
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
              }}
            >
              <div style={{ fontSize: '3rem' }}>🏨</div>
              <p>No services yet</p>
              <button
                className="btn-primary"
                onClick={() => navigate('/add-listing')}
                style={{ marginTop: '12px' }}
              >
                List Your Service
              </button>
            </div>
          ) : isMobile ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {data.listings_analytics?.map((listing, idx) => (
                <div
                  key={listing.id}
                  style={{
                    background: 'var(--bg-card)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow-sm)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '3px',
                      background:
                        idx === 0
                          ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                          : idx === 1
                            ? 'linear-gradient(90deg, #94a3b8, #64748b)'
                            : 'linear-gradient(90deg, #0ea5e9, #6366f1)',
                    }}
                  />
                  <div style={{ padding: '14px 16px' }}>
                    <div
                      style={{
                        display: 'flex',
                        gap: '10px',
                        alignItems: 'flex-start',
                        marginBottom: '12px',
                      }}
                    >
                      <span style={{ fontSize: '1.3rem' }}>
                        {idx === 0
                          ? '🥇'
                          : idx === 1
                            ? '🥈'
                            : idx === 2
                              ? '🥉'
                              : `#${idx + 1}`}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: '0.95rem',
                            color: 'var(--text-primary)',
                            marginBottom: '2px',
                          }}
                        >
                          {listing.title}
                        </div>
                        <div
                          style={{
                            fontSize: '0.8rem',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          📍 {listing.location}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '8px',
                      }}
                    >
                      <div
                        style={{
                          background: 'var(--bg-secondary)',
                          borderRadius: '8px',
                          padding: '10px 12px',
                        }}
                      >
                        <div
                          style={{
                            fontSize: '0.7rem',
                            color: 'var(--text-muted)',
                            marginBottom: '3px',
                          }}
                        >
                          Bookings
                        </div>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: '1rem',
                            color: 'var(--accent)',
                          }}
                        >
                          {listing.total_bookings || 0}
                        </div>
                      </div>
                      <div
                        style={{
                          background: 'var(--bg-secondary)',
                          borderRadius: '8px',
                          padding: '10px 12px',
                        }}
                      >
                        <div
                          style={{
                            fontSize: '0.7rem',
                            color: 'var(--text-muted)',
                            marginBottom: '3px',
                          }}
                        >
                          Revenue
                        </div>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            color: '#10b981',
                          }}
                        >
                          PKR {(listing.total_revenue || 0).toLocaleString(
                            'en-PK',
                          )}
                        </div>
                      </div>
                      <div
                        style={{
                          background: 'var(--bg-secondary)',
                          borderRadius: '8px',
                          padding: '10px 12px',
                        }}
                      >
                        <div
                          style={{
                            fontSize: '0.7rem',
                            color: 'var(--text-muted)',
                            marginBottom: '3px',
                          }}
                        >
                          Reviews
                        </div>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: '1rem',
                            color: 'var(--text-primary)',
                          }}
                        >
                          {listing.total_reviews || 0}
                        </div>
                      </div>
                      <div
                        style={{
                          background: 'var(--bg-secondary)',
                          borderRadius: '8px',
                          padding: '10px 12px',
                        }}
                      >
                        <div
                          style={{
                            fontSize: '0.7rem',
                            color: 'var(--text-muted)',
                            marginBottom: '3px',
                          }}
                        >
                          Rating
                        </div>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: '1rem',
                            color: '#f59e0b',
                          }}
                        >
                          {listing.average_rating > 0
                            ? listing.average_rating.toFixed(1) + ' ★'
                            : '—'}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        navigate(`/edit-listing/${listing.id}`)
                      }
                      style={{
                        marginTop: '12px',
                        width: '100%',
                        padding: '8px 14px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                      }}
                    >
                      ✏️ Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div
                style={{
                  padding: '20px 24px',
                  borderBottom: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                  }}
                >
                  🏆 Services Performance
                </h2>
                <span
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)',
                  }}
                >
                  Sorted by revenue
                </span>
              </div>
              <div>
                {data.listings_analytics.map((l, idx) => (
                  <div
                    key={l.id}
                    style={{
                      display: 'flex',
                      gap: '16px',
                      padding: '20px 24px',
                      alignItems: 'center',
                      borderBottom:
                        idx < data.listings_analytics.length - 1
                          ? '1px solid var(--border-color)'
                          : 'none',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--bg-secondary)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background:
                          idx === 0
                            ? '#fef3c7'
                            : idx === 1
                              ? '#f1f5f9'
                              : idx === 2
                                ? '#fef3c7'
                                : 'var(--bg-secondary)',
                        color:
                          idx === 0
                            ? '#d97706'
                            : idx === 1
                              ? '#64748b'
                              : idx === 2
                                ? '#b45309'
                                : 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '0.9rem',
                        flexShrink: 0,
                      }}
                    >
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                    </div>
                    <img
                      src={getImageUrl(l.image_url)}
                      alt={l.title}
                      onError={(e) => {
                        e.target.onerror = null
                        e.target.src =
                          'https://placehold.co/60x60/e5e7eb/9ca3af?text=GB'
                      }}
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: 'var(--radius-sm)',
                        objectFit: 'cover',
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                          fontSize: '0.95rem',
                          marginBottom: '2px',
                          cursor: 'pointer',
                        }}
                        onClick={() => navigate(`/listing/${l.id}`)}
                      >
                        {l.title}
                      </div>
                      <div
                        style={{
                          fontSize: '0.8rem',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        📍 {l.location} · PKR{' '}
                        {l.price_per_night?.toLocaleString('en-PK')}/night
                      </div>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        gap: '24px',
                        alignItems: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <div style={{ textAlign: 'center' }}>
                        <div
                          style={{
                            fontSize: '1.1rem',
                            fontWeight: 800,
                            color: 'var(--text-primary)',
                          }}
                        >
                          {l.active_bookings}
                        </div>
                        <div
                          style={{
                            fontSize: '0.72rem',
                            color: 'var(--text-muted)',
                            textTransform: 'uppercase',
                          }}
                        >
                          Bookings
                        </div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div
                          style={{
                            fontSize: '1.1rem',
                            fontWeight: 800,
                            color: '#10b981',
                          }}
                        >
                          PKR{' '}
                          {(l.total_revenue || 0).toLocaleString('en-PK')}
                        </div>
                        <div
                          style={{
                            fontSize: '0.72rem',
                            color: 'var(--text-muted)',
                            textTransform: 'uppercase',
                          }}
                        >
                          Revenue
                        </div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '3px',
                          }}
                        >
                          {l.average_rating > 0 ? (
                            <>
                              <span style={{ color: '#f59e0b' }}>★</span>
                              <span
                                style={{
                                  fontWeight: 700,
                                  fontSize: '0.875rem',
                                  color: 'var(--text-primary)',
                                }}
                              >
                                {l.average_rating?.toFixed(1)}
                              </span>
                              <span
                                style={{
                                  fontSize: '0.75rem',
                                  color: 'var(--text-muted)',
                                }}
                              >
                                ({l.total_reviews})
                              </span>
                            </>
                          ) : (
                            <span
                              style={{
                                fontSize: '0.78rem',
                                color: 'var(--text-muted)',
                              }}
                            >
                              —
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/edit-listing/${l.id}`)}
                        style={{
                          background: 'var(--bg-secondary)',
                          color: 'var(--text-secondary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '8px',
                          padding: '6px 14px',
                          cursor: 'pointer',
                          fontSize: '0.82rem',
                          fontWeight: 500,
                        }}
                      >
                        ✏️ Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Total Revenue Summary */}
        {data.total_listings > 0 && (
          <div
            style={{
              marginTop: '16px',
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              padding: '20px 24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                color: 'var(--text-secondary)',
                fontWeight: 600,
              }}
            >
              Total Revenue across all listings
            </span>
            <span
              style={{
                fontSize: '1.4rem',
                fontWeight: 800,
                color: '#10b981',
              }}
            >
              PKR {(data.total_revenue || 0).toLocaleString('en-PK')}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

