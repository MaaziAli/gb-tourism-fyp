import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { getImageUrl } from '../utils/image'

export default function ProviderAnalytics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

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
      label: 'Total Stays & Experiences',
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
              Your stays & experiences performance overview
            </p>
          </div>
          <button
            className="btn-primary"
            onClick={() => navigate('/add-listing')}
          >
            + Add Stay
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

        {/* Listings Performance Table */}
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
                  🏆 Stays & Experiences Performance
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

          {data.listings_analytics.length === 0 ? (
            <div
              style={{
                padding: '48px',
                textAlign: 'center',
                color: 'var(--text-secondary)',
              }}
            >
              <div style={{ fontSize: '3rem' }}>🏨</div>
              <p>No stays or experiences yet. Add your first stay!</p>
              <button
                className="btn-primary"
                onClick={() => navigate('/add-listing')}
              >
                Add Stay
              </button>
            </div>
          ) : (
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
                    e.currentTarget.style.background =
                      'var(--bg-secondary)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  {/* Rank */}
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
                    {idx === 0
                      ? '🥇'
                      : idx === 1
                      ? '🥈'
                      : idx === 2
                      ? '🥉'
                      : idx + 1}
                  </div>

                  {/* Image */}
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

                  {/* Info */}
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
                      {l.price_per_night?.toLocaleString('en-PK')}
                      /night
                    </div>
                  </div>

                  {/* Stats */}
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
                      <div style={{ marginBottom: '2px' }}>
                        <Stars count={l.average_rating} />
                      </div>
                      <div
                        style={{
                          fontSize: '0.72rem',
                          color: 'var(--text-muted)',
                          textTransform: 'uppercase',
                        }}
                      >
                        {l.total_reviews} review
                        {l.total_reviews !== 1 ? 's' : ''}
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        navigate(`/edit-listing/${l.id}`)
                      }
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

