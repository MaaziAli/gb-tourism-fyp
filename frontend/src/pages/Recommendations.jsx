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
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
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
      <div style={containerStyle}>
        <p style={{ textAlign: 'center', color: '#6b7280' }}>
          Finding the best listings for you...
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={containerStyle}>
        <p style={{ color: 'red' }}>{error}</p>
      </div>
    )
  }

  if (!items.length) {
    return (
      <div style={containerStyle}>
        <h1
          style={{
            margin: 0,
            fontSize: '2rem',
            fontWeight: 700,
            color: '#111827',
            marginBottom: '4px',
          }}
        >
          Recommended for You
        </h1>
        <p
          style={{
            marginTop: '4px',
            fontSize: '0.9rem',
            color: '#6b7280',
            marginBottom: '24px',
          }}
        >
          Popular listings in Gilgit-Baltistan
        </p>
        <p
          style={{
            marginTop: '16px',
            fontSize: '0.9rem',
            color: '#6b7280',
          }}
        >
          No recommendations available right now. Try booking a listing to get
          personalized suggestions!
        </p>
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      <h1
        style={{
          margin: 0,
          fontSize: '2rem',
          fontWeight: 700,
          color: '#111827',
          marginBottom: '4px',
        }}
      >
        Recommended for You
      </h1>
      <p
        style={{
          marginTop: '4px',
          fontSize: '0.9rem',
          color: '#6b7280',
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
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)'
              }}
            >
              <div
                style={{
                  background: '#eff6ff',
                  borderBottom: '1px solid #bfdbfe',
                  padding: '8px 12px',
                  fontSize: '0.8rem',
                  color: '#1e40af',
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
                    e.target.src = 'https://placehold.co/400x250?text=No+Image'
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
                    color: '#111827',
                  }}
                >
                  {item.title}
                </h2>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '0.85rem',
                    color: '#6b7280',
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
                    color: '#111827',
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
                      backgroundColor: '#2563eb',
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

