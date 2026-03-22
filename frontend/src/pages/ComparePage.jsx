import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useCompare } from '../context/CompareContext'
import useWindowSize from '../hooks/useWindowSize'

const SERVICE_COLORS = {
  hotel: '#2563eb',
  tour: '#16a34a',
  transport: '#d97706',
  activity: '#7c3aed',
  restaurant: '#e11d48',
  car_rental: '#0369a1',
  bike_rental: '#0891b2',
  jeep_safari: '#92400e',
  boat_trip: '#1d4ed8',
  horse_riding: '#7c2d12',
  guide: '#059669',
  camping: '#15803d',
  medical: '#dc2626',
}

const SERVICE_LABELS = {
  hotel: '🏨 Hotel',
  tour: '🏔️ Tour',
  transport: '🚐 Transport',
  activity: '🎯 Activity',
  restaurant: '🍽️ Restaurant',
  car_rental: '🚗 Car Rental',
  bike_rental: '🚲 Bike',
  jeep_safari: '🚙 Jeep Safari',
  boat_trip: '🚢 Boat Trip',
  horse_riding: '🐴 Horse Riding',
  guide: '🧭 Guide',
  camping: '🏕️ Camping',
  medical: '🏥 Medical',
}

function StarRating({ rating, size = 14 }) {
  return (
    <span style={{ fontSize: size }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          style={{
            color: s <= Math.round(rating) ? '#f59e0b' : '#e5e7eb',
          }}
        >
          ★
        </span>
      ))}
    </span>
  )
}

function WinnerBadge({ label, color }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        background: color + '18',
        border: `1px solid ${color}44`,
        color: color,
        borderRadius: '999px',
        padding: '2px 10px',
        fontSize: '0.7rem',
        fontWeight: 700,
        marginBottom: '6px',
      }}
    >
      {label}
    </div>
  )
}

function CompareRow({
  label,
  values,
  formatter,
  highlight,
  icon,
}) {
  const formatted = values.map((v, i) =>
    formatter ? formatter(v, i) : v,
  )

  let bestIdx = -1
  if (highlight === 'high') {
    const nums = values.map((v) => parseFloat(v) || 0)
    const max = Math.max(...nums)
    if (max > 0) bestIdx = nums.indexOf(max)
  } else if (highlight === 'low') {
    const nums = values.map((v) => parseFloat(v) || 0)
    const positive = nums.filter((n) => n > 0)
    if (positive.length > 0) {
      const min = Math.min(...positive)
      bestIdx = values.findIndex(
        (v) => parseFloat(v) === min && parseFloat(v) > 0,
      )
    }
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `160px repeat(${values.length}, 1fr)`,
        borderBottom: '1px solid var(--border-color)',
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          fontSize: '0.82rem',
          color: 'var(--text-secondary)',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'var(--bg-secondary)',
        }}
      >
        {icon && (
          <span style={{ fontSize: '0.9rem' }}>{icon}</span>
        )}
        {label}
      </div>

      {formatted.map((val, i) => (
        <div
          key={i}
          style={{
            padding: '12px 16px',
            fontSize: '0.875rem',
            fontWeight: i === bestIdx ? 700 : 400,
            color:
              i === bestIdx
                ? highlight === 'low'
                  ? '#16a34a'
                  : '#2563eb'
                : 'var(--text-primary)',
            background:
              i === bestIdx
                ? highlight === 'low'
                  ? '#dcfce7'
                  : '#dbeafe'
                : 'var(--bg-card)',
            display: 'flex',
            alignItems: 'center',
            borderLeft: '1px solid var(--border-color)',
          }}
        >
          {i === bestIdx && (
            <span style={{ marginRight: '5px', fontSize: '0.8rem' }}>
              {highlight === 'low' ? '💚' : '🏆'}
            </span>
          )}
          {val || '—'}
        </div>
      ))}
    </div>
  )
}

export default function ComparePage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { isMobile } = useWindowSize()
  const { clearCompare } = useCompare()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const ids = searchParams.get('ids') || ''

  useEffect(() => {
    if (!ids) {
      setError('No services selected')
      setLoading(false)
      return
    }
    api
      .get(`/listings/compare?ids=${encodeURIComponent(ids)}`)
      .then((r) => setData(r.data))
      .catch((e) => {
        setError(
          e.response?.data?.detail ||
            'Failed to load comparison',
        )
      })
      .finally(() => setLoading(false))
  }, [ids])

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--bg-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{ fontSize: '2.5rem', marginBottom: '12px' }}
          >
            ⚖️
          </div>
          Comparing services...
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--bg-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem' }}>😕</div>
          <p style={{ color: 'var(--text-secondary)' }}>
            {error || 'Nothing to compare'}
          </p>
          <button
            type="button"
            onClick={() => navigate('/listings')}
            style={{
              background: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              padding: '10px 24px',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            Browse Services
          </button>
        </div>
      </div>
    )
  }

  const { listings } = data
  const count = listings.length

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        paddingBottom: '80px',
      }}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, #1e3a5f, #2563eb)',
          padding: '28px 16px 70px',
        }}
      >
        <div
          style={{
            maxWidth: '1100px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <button
              type="button"
              onClick={() => navigate(-1)}
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'white',
                borderRadius: '8px',
                padding: '7px 14px',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600,
                marginBottom: '14px',
              }}
            >
              ← Back
            </button>
            <h1
              style={{
                color: 'white',
                margin: '0 0 6px',
                fontSize: isMobile ? '1.4rem' : '1.8rem',
                fontWeight: 800,
              }}
            >
              ⚖️ Compare Services
            </h1>
            <p
              style={{
                color: 'rgba(255,255,255,0.7)',
                margin: 0,
                fontSize: '0.9rem',
              }}
            >
              Comparing {count} service{count > 1 ? 's' : ''} side by
              side
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => {
                clearCompare()
                navigate('/listings')
              }}
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'white',
                borderRadius: '10px',
                padding: '9px 16px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.875rem',
              }}
            >
              + Add More
            </button>
          </div>
        </div>
      </div>

      <div
        style={{
          maxWidth: '1100px',
          margin: '-48px auto 0',
          padding: '0 16px',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `160px repeat(${count}, 1fr)`,
            gap: '0',
            marginBottom: '0',
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-md)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              background: 'var(--bg-secondary)',
              borderRight: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px 10px',
              fontSize: '1.5rem',
            }}
          >
            ⚖️
          </div>

          {listings.map((listing, i) => {
            const color =
              SERVICE_COLORS[listing.service_type] || '#2563eb'

            return (
              <div
                key={listing.id}
                style={{
                  padding: '16px',
                  borderLeft:
                    i > 0 ? '1px solid var(--border-color)' : 'none',
                  position: 'relative',
                  borderTop: `4px solid ${color}`,
                }}
              >
                <div style={{ minHeight: '22px' }}>
                  {listing.highlights.best_value && (
                    <WinnerBadge
                      label="💚 Best Value"
                      color="#16a34a"
                    />
                  )}
                  {listing.highlights.most_popular && (
                    <WinnerBadge
                      label="🔥 Most Popular"
                      color="#d97706"
                    />
                  )}
                  {listing.highlights.top_rated && (
                    <WinnerBadge
                      label="⭐ Top Rated"
                      color="#2563eb"
                    />
                  )}
                </div>

                <div
                  style={{
                    height: '140px',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    marginBottom: '12px',
                    background: color + '18',
                  }}
                >
                  {listing.image_url ? (
                    <img
                      src={`http://127.0.0.1:8000/uploads/${listing.image_url}`}
                      alt={listing.title}
                      onError={(e) => {
                        e.target.onerror = null
                        e.target.src = `https://placehold.co/300x140/${color.replace('#', '')}/ffffff?text=${listing.service_type}`
                      }}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '3rem',
                      }}
                    >
                      {SERVICE_LABELS[listing.service_type]?.split(
                        ' ',
                      )[0] || '🏢'}
                    </div>
                  )}
                </div>

                <div
                  style={{
                    display: 'inline-block',
                    background: color + '18',
                    color,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    marginBottom: '6px',
                  }}
                >
                  {SERVICE_LABELS[listing.service_type] ||
                    listing.service_type}
                </div>

                <h3
                  style={{
                    margin: '0 0 4px',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {listing.title}
                </h3>

                <div
                  style={{
                    fontSize: '0.78rem',
                    color: 'var(--text-secondary)',
                    marginBottom: '10px',
                  }}
                >
                  📍 {listing.location}
                </div>

                <div
                  style={{
                    fontSize: '1.3rem',
                    fontWeight: 800,
                    color,
                    marginBottom: '10px',
                  }}
                >
                  PKR{' '}
                  {listing.price_per_night?.toLocaleString('en-PK')}
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 400,
                      marginLeft: '3px',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {listing.price_label}
                  </span>
                </div>

                {listing.average_rating > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      marginBottom: '12px',
                    }}
                  >
                    <StarRating rating={listing.average_rating} />
                    <span
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                      }}
                    >
                      {listing.average_rating}
                    </span>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        color: 'var(--text-muted)',
                      }}
                    >
                      ({listing.review_count})
                    </span>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/listing/${listing.id}`)
                    }
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '8px',
                      border: 'none',
                      background: color,
                      color: 'white',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                    }}
                  >
                    {listing.service_type === 'restaurant'
                      ? '🍽️ Reserve'
                      : '📅 Book Now'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)',
            overflow: 'hidden',
            marginTop: '16px',
          }}
        >
          <div
            style={{
              background: '#1e3a5f',
              padding: '10px 16px',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'rgba(255,255,255,0.8)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            💰 Pricing
          </div>

          <CompareRow
            label="Base Price"
            icon="💵"
            values={listings.map((l) => l.price_per_night)}
            formatter={(v, i) =>
              `PKR ${Number(v || 0).toLocaleString('en-PK')}${
                listings[i]?.price_label || '/night'
              }`
            }
            highlight="low"
          />

          <div
            style={{
              background: '#1e3a5f',
              padding: '10px 16px',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'rgba(255,255,255,0.8)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            ⭐ Ratings & Reviews
          </div>

          <CompareRow
            label="Avg Rating"
            icon="⭐"
            values={listings.map((l) => l.average_rating)}
            formatter={(v) =>
              v > 0 ? `${v}/5` : 'No reviews'
            }
            highlight="high"
          />

          <CompareRow
            label="Total Reviews"
            icon="💬"
            values={listings.map((l) => l.review_count)}
            formatter={(v) => `${v || 0} reviews`}
            highlight="high"
          />

          <CompareRow
            label="Total Bookings"
            icon="📅"
            values={listings.map((l) => l.total_bookings)}
            formatter={(v) => `${v || 0} bookings`}
            highlight="high"
          />

          <div
            style={{
              background: '#1e3a5f',
              padding: '10px 16px',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'rgba(255,255,255,0.8)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            📋 Details
          </div>

          <CompareRow
            label="Location"
            icon="📍"
            values={listings.map((l) => l.location)}
          />

          <CompareRow
            label="Service Type"
            icon="🏷️"
            values={listings.map(
              (l) =>
                SERVICE_LABELS[l.service_type] || l.service_type,
            )}
          />

          <CompareRow
            label="Featured"
            icon="⭐"
            values={listings.map((l) =>
              l.is_featured ? 'Yes' : 'No',
            )}
          />

          <div
            style={{
              background: '#1e3a5f',
              padding: '10px 16px',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'rgba(255,255,255,0.8)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            📊 Rating Distribution
          </div>

          {[5, 4, 3, 2, 1].map((star) => (
            <CompareRow
              key={star}
              label={`${star} ★`}
              icon={star === 5 ? '🌟' : star >= 3 ? '⭐' : ''}
              values={listings.map(
                (l) =>
                  l.rating_distribution?.[String(star)] || 0,
              )}
              formatter={(v) => `${v} reviews`}
              highlight="high"
            />
          ))}

          {listings.some(
            (l) =>
              l.service_type === 'hotel' &&
              l.room_types?.length > 0,
          ) && (
            <>
              <div
                style={{
                  background: '#1e3a5f',
                  padding: '10px 16px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'rgba(255,255,255,0.8)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}
              >
                🛏️ Room Types
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: `160px repeat(${count}, 1fr)`,
                  borderBottom: '1px solid var(--border-color)',
                }}
              >
                <div
                  style={{
                    padding: '12px 16px',
                    background: 'var(--bg-secondary)',
                    fontSize: '0.82rem',
                    color: 'var(--text-secondary)',
                    fontWeight: 600,
                  }}
                >
                  🛏️ Rooms
                </div>
                {listings.map((l, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '12px 16px',
                      borderLeft: '1px solid var(--border-color)',
                      fontSize: '0.8rem',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {l.room_types?.length > 0 ? (
                      l.room_types.map((r, ri) => (
                        <div key={ri} style={{ marginBottom: '4px' }}>
                          <span style={{ fontWeight: 600 }}>
                            {r.name}
                          </span>
                          <span
                            style={{
                              color: 'var(--text-muted)',
                              marginLeft: '6px',
                              fontSize: '0.75rem',
                            }}
                          >
                            PKR{' '}
                            {r.price?.toLocaleString('en-PK')}
                            /night · {r.capacity} guests
                          </span>
                        </div>
                      ))
                    ) : (
                      <span
                        style={{
                          color: 'var(--text-muted)',
                          fontSize: '0.78rem',
                        }}
                      >
                        N/A
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          <div
            style={{
              background: '#1e3a5f',
              padding: '10px 16px',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'rgba(255,255,255,0.8)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            ℹ️ About
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `160px repeat(${count}, 1fr)`,
              borderBottom: '1px solid var(--border-color)',
            }}
          >
            <div
              style={{
                padding: '14px 16px',
                background: 'var(--bg-secondary)',
                fontSize: '0.82rem',
                color: 'var(--text-secondary)',
                fontWeight: 600,
              }}
            >
              ℹ️ Description
            </div>
            {listings.map((l, i) => (
              <div
                key={i}
                style={{
                  padding: '14px 16px',
                  borderLeft: '1px solid var(--border-color)',
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                }}
              >
                {l.description ? (
                  l.description.slice(0, 150) +
                  (l.description.length > 150 ? '...' : '')
                ) : (
                  <span
                    style={{
                      color: 'var(--text-muted)',
                      fontStyle: 'italic',
                    }}
                  >
                    No description
                  </span>
                )}
              </div>
            ))}
          </div>

          <div
            style={{
              background: '#1e3a5f',
              padding: '10px 16px',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'rgba(255,255,255,0.8)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            💬 Recent Reviews
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `160px repeat(${count}, 1fr)`,
            }}
          >
            <div
              style={{
                padding: '14px 16px',
                background: 'var(--bg-secondary)',
                fontSize: '0.82rem',
                color: 'var(--text-secondary)',
                fontWeight: 600,
              }}
            >
              💬 Reviews
            </div>
            {listings.map((l, i) => (
              <div
                key={i}
                style={{
                  padding: '14px 16px',
                  borderLeft: '1px solid var(--border-color)',
                }}
              >
                {l.recent_reviews?.length > 0 ? (
                  l.recent_reviews.map((r, ri) => (
                    <div
                      key={ri}
                      style={{
                        marginBottom: '10px',
                        paddingBottom: '10px',
                        borderBottom:
                          ri < l.recent_reviews.length - 1
                            ? '1px solid var(--border-color)'
                            : 'none',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          marginBottom: '4px',
                        }}
                      >
                        <StarRating rating={r.rating} size={11} />
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: 'var(--text-secondary)',
                          }}
                        >
                          {r.reviewer_name}
                        </span>
                      </div>
                      {r.comment && (
                        <p
                          style={{
                            margin: 0,
                            fontSize: '0.75rem',
                            color: 'var(--text-secondary)',
                            lineHeight: 1.5,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          &ldquo;{r.comment}&rdquo;
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <span
                    style={{
                      color: 'var(--text-muted)',
                      fontSize: '0.78rem',
                      fontStyle: 'italic',
                    }}
                  >
                    No reviews yet
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)',
            padding: '24px',
            marginTop: '16px',
          }}
        >
          <h3
            style={{
              margin: '0 0 16px',
              fontSize: '1rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}
          >
            🏆 Our Verdict
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile
                ? '1fr'
                : `repeat(${count}, 1fr)`,
              gap: '12px',
            }}
          >
            {listings.map((l, i) => {
              const color =
                SERVICE_COLORS[l.service_type] || '#2563eb'
              const hasHighlight = Object.values(
                l.highlights,
              ).some(Boolean)
              return (
                <div
                  key={i}
                  style={{
                    padding: '16px',
                    background: hasHighlight
                      ? color + '10'
                      : 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-md)',
                    border: hasHighlight
                      ? `2px solid ${color}44`
                      : '1px solid var(--border-color)',
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      color: 'var(--text-primary)',
                      marginBottom: '8px',
                      display: '-webkit-box',
                      WebkitLineClamp: 1,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {l.title}
                  </div>
                  {l.highlights.best_value && (
                    <div
                      style={{
                        fontSize: '0.78rem',
                        color: '#16a34a',
                        fontWeight: 600,
                        marginBottom: '4px',
                      }}
                    >
                      💚 Most affordable option
                    </div>
                  )}
                  {l.highlights.top_rated && (
                    <div
                      style={{
                        fontSize: '0.78rem',
                        color: '#2563eb',
                        fontWeight: 600,
                        marginBottom: '4px',
                      }}
                    >
                      ⭐ Highest rated by guests
                    </div>
                  )}
                  {l.highlights.most_popular && (
                    <div
                      style={{
                        fontSize: '0.78rem',
                        color: '#d97706',
                        fontWeight: 600,
                        marginBottom: '4px',
                      }}
                    >
                      🔥 Most booked by travelers
                    </div>
                  )}
                  {!hasHighlight && (
                    <div
                      style={{
                        fontSize: '0.78rem',
                        color: 'var(--text-muted)',
                        fontStyle: 'italic',
                      }}
                    >
                      A solid choice worth considering
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => navigate(`/listing/${l.id}`)}
                    style={{
                      marginTop: '10px',
                      width: '100%',
                      padding: '8px',
                      borderRadius: '8px',
                      border: 'none',
                      background: color,
                      color: 'white',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontSize: '0.82rem',
                    }}
                  >
                    View Details →
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
