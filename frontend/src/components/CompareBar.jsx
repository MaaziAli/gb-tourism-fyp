import { useNavigate } from 'react-router-dom'
import { useCompare } from '../context/CompareContext'
import { getImageUrl } from '../utils/image'

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

export default function CompareBar() {
  const { compareList, removeFromCompare, clearCompare } =
    useCompare()
  const navigate = useNavigate()

  if (compareList.length === 0) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'var(--bg-card)',
        borderTop: '2px solid #2563eb',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.15)',
        zIndex: 500,
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexWrap: 'wrap',
      }}
    >
      <div
        style={{
          fontWeight: 700,
          fontSize: '0.85rem',
          color: '#2563eb',
          flexShrink: 0,
        }}
      >
        ⚖️ Compare
        <span
          style={{
            background: '#2563eb',
            color: 'white',
            borderRadius: '999px',
            padding: '1px 7px',
            marginLeft: '6px',
            fontSize: '0.75rem',
            fontWeight: 800,
          }}
        >
          {compareList.length}/3
        </span>
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
        }}
      >
        {compareList.map((item) => {
          const color =
            SERVICE_COLORS[item.service_type] || '#6b7280'
          return (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: color + '12',
                border: `1px solid ${color}33`,
                borderRadius: '8px',
                padding: '5px 10px',
                fontSize: '0.8rem',
              }}
            >
              {item.image_url ? (
                <img
                  src={getImageUrl(item.image_url)}
                  alt={item.title}
                  onError={(e) => {
                    e.target.style.display = 'none'
                  }}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '4px',
                    objectFit: 'cover',
                    flexShrink: 0,
                  }}
                />
              ) : (
                <span style={{ fontSize: '0.9rem' }}>🏢</span>
              )}
              <span
                style={{
                  fontWeight: 600,
                  color,
                  maxWidth: 120,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {item.title}
              </span>
              <button
                type="button"
                onClick={() => removeFromCompare(item.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color,
                  fontSize: '1rem',
                  lineHeight: 1,
                  padding: '0 2px',
                }}
              >
                ×
              </button>
            </div>
          )
        })}

        {Array.from({ length: 3 - compareList.length }).map(
          (_, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'var(--bg-secondary)',
                border: '1px dashed var(--border-color)',
                borderRadius: '8px',
                padding: '5px 14px',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
              }}
            >
              + Add service
            </div>
          ),
        )}
      </div>

      <div
        style={{
          display: 'flex',
          gap: '8px',
          flexShrink: 0,
        }}
      >
        {compareList.length >= 2 && (
          <button
            type="button"
            onClick={() => {
              const ids = compareList.map((l) => l.id).join(',')
              navigate(`/compare?ids=${ids}`)
            }}
            style={{
              padding: '9px 20px',
              borderRadius: '10px',
              border: 'none',
              background:
                'linear-gradient(135deg, #2563eb, #1d4ed8)',
              color: 'white',
              fontWeight: 700,
              fontSize: '0.875rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(37,99,235,0.4)',
            }}
          >
            ⚖️ Compare Now →
          </button>
        )}
        <button
          type="button"
          onClick={clearCompare}
          style={{
            padding: '9px 14px',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)',
            color: 'var(--text-secondary)',
            fontWeight: 600,
            fontSize: '0.82rem',
            cursor: 'pointer',
          }}
        >
          Clear
        </button>
      </div>
    </div>
  )
}
