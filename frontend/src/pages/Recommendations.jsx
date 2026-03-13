import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { getImageUrl } from '../utils/image'

function Recommendations() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    api
      .get('/recommendations')
      .then((res) => {
        setItems(res.data || [])
      })
      .catch((err) => {
        console.error('Failed to load recommendations', {
          message: err.message,
          status: err.response?.status,
          data: err.response?.data,
        })
        setError('Failed to load recommendations.')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const containerStyle = {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '20px',
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

  const hasHistoryBasedReasons = items.some(
    (item) => item.recommendation_reason !== 'Trending in Gilgit-Baltistan',
  )

  if (loading) {
    return (
      <div
        className="page-container"
        style={{ ...containerStyle, background: 'var(--bg-primary)', minHeight: '100vh' }}
      >
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
          Finding the best listings for you...
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div
        className="page-container"
        style={{ ...containerStyle, background: 'var(--bg-primary)', minHeight: '100vh' }}
      >
        <p style={{ color: 'var(--danger)' }}>{error}</p>
      </div>
    )
  }

  if (!items.length) {
    return (
      <div
        className="page-container"
        style={{ ...containerStyle, background: 'var(--bg-primary)', minHeight: '100vh' }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: '2rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: '4px',
          }}
        >
          Recommended for You
        </h1>
        <p
          style={{
            marginTop: '4px',
            fontSize: '0.9rem',
            color: 'var(--text-secondary)',
            marginBottom: '24px',
          }}
        >
          Popular listings in Gilgit-Baltistan
        </p>
        <p
          style={{
            marginTop: '16px',
            fontSize: '0.9rem',
            color: 'var(--text-secondary)',
          }}
        >
          No recommendations available right now. Try booking a listing to get
          personalized suggestions!
        </p>
      </div>
    )
  }

  return (
    <div
      className="page-container"
      style={{ ...containerStyle, background: 'var(--bg-primary)', minHeight: '100vh' }}
    >
      <h1
        style={{
          margin: 0,
          fontSize: '2rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: '4px',
        }}
      >
        Recommended for You
      </h1>
      <p
        style={{
          marginTop: '4px',
          fontSize: '0.9rem',
          color: 'var(--text-secondary)',
          marginBottom: '24px',
        }}
      >
        {hasHistoryBasedReasons
          ? 'Based on your travel history'
          : 'Popular listings in Gilgit-Baltistan'}
      </p>

      <div style={gridStyle}>
        {items.map((item) => {
          const priceText = formatPrice(item.price_per_night)
          return (
            <div
              key={item.id}
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
                  background: 'var(--accent-light)',
                  borderBottom: '1px solid var(--accent)',
                  padding: '8px 12px',
                  fontSize: '0.8rem',
                  color: 'var(--accent)',
                  fontWeight: 500,
                }}
              >
                ✨ {item.recommendation_reason}
              </div>
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '200px',
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
                <span
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    backgroundColor: getServiceBadgeColor(item.service_type),
                    color: '#ffffff',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: '20px',
                    textTransform: 'capitalize',
                  }}
                >
                  {item.service_type}
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
                  {item.title}
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
                  <span>{item.location}</span>
                </div>
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
                  }}
                >
                  <button
                    type="button"
                    onClick={() => navigate(`/booking/${item.id}`)}
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
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Recommendations

