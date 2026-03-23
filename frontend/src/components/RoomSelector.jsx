import { getImageUrl } from '../utils/image'

const BED_ICONS = {
  'single': '🛏️',
  'double': '🛏️',
  'twin': '🛛',
  'queen': '👑',
  'king': '👑',
  'suite': '🏰',
  'dormitory': '🏘️',
  'bunk': '🪜',
}

const DEFAULT_AMENITIES = {
  hotel: ['WiFi', 'AC', 'TV', 'Hot Water'],
  suite: ['WiFi', 'AC', 'TV', 'Minibar',
          'Balcony', 'Jacuzzi'],
  deluxe: ['WiFi', 'AC', 'TV', 'Minibar',
           'Room Service'],
}

function parseAmenities(raw) {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed
    return []
  } catch {
    if (typeof raw === 'string') {
      return raw.split(',')
        .map(s => s.trim())
        .filter(Boolean)
    }
    return []
  }
}

function getBedIcon(bedType) {
  if (!bedType) return '🛏️'
  const key = bedType.toLowerCase()
  for (const [k, v] of Object.entries(BED_ICONS)) {
    if (key.includes(k)) return v
  }
  return '🛏️'
}

export default function RoomSelector({
  rooms = [],
  selectedRoom = null,
  onSelectRoom,
  nights = 1,
  isMobile = false
}) {
  if (!rooms || rooms.length === 0) return null

  return (
    <div style={{marginBottom: '20px'}}>
      {/* Section header */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '14px'
      }}>
        <h3 style={{
          margin: 0, fontSize: '1rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
          display: 'flex', alignItems: 'center',
          gap: '8px'
        }}>
          🛏️ Select Room Type
          <span style={{
            background: '#dbeafe', color: '#1d4ed8',
            fontSize: '0.72rem', fontWeight: 700,
            padding: '2px 8px', borderRadius: '999px'
          }}>
            {rooms.length} option{rooms.length > 1
              ? 's' : ''}
          </span>
        </h3>
        {selectedRoom && (
          <span style={{
            fontSize: '0.78rem',
            color: '#16a34a', fontWeight: 600
          }}>
            ✓ Selected
          </span>
        )}
      </div>

      {/* Room cards grid */}
      <div style={{
        display: 'flex', flexDirection: 'column',
        gap: '10px'
      }}>
        {rooms.map(room => {
          const isSelected =
            selectedRoom?.id === room.id
          const amenities = parseAmenities(
            room.amenities
          )
          const totalPrice = room.price_per_night
            * nights
          const isUnavailable = !room.is_available
            || room.available_count === 0

          return (
            <div
              key={room.id}
              onClick={() => {
                if (!isUnavailable)
                  onSelectRoom(
                    isSelected ? null : room
                  )
              }}
              style={{
                borderRadius: 'var(--radius-lg)',
                border: isSelected
                  ? '2px solid #0ea5e9'
                  : '1px solid var(--border-color)',
                background: isSelected
                  ? '#f0f9ff'
                  : 'var(--bg-card)',
                overflow: 'hidden',
                cursor: isUnavailable
                  ? 'not-allowed' : 'pointer',
                opacity: isUnavailable ? 0.5 : 1,
                transition:
                  'border-color 0.15s, background 0.15s',
                boxShadow: isSelected
                  ? '0 0 0 3px #bae6fd'
                  : 'var(--shadow-sm)'
              }}
              onMouseEnter={e => {
                if (!isSelected && !isUnavailable)
                  e.currentTarget.style.borderColor
                    = '#7dd3fc'
              }}
              onMouseLeave={e => {
                if (!isSelected)
                  e.currentTarget.style.borderColor
                    = 'var(--border-color)'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'stretch'
              }}>
                {/* Room image */}
                <div style={{
                  width: isMobile ? 90 : 130,
                  flexShrink: 0,
                  background: '#e0f2fe',
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  {room.image_url ? (
                    <img
                      src={getImageUrl(
                        room.image_url
                      )}
                      alt={room.name}
                      onError={e => {
                        e.target.onerror = null
                        e.target.style.display =
                          'none'
                        e.target.parentNode
                          .querySelector('.fallback')
                          .style.display = 'flex'
                      }}
                      style={{
                        width: '100%', height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                        minHeight: isMobile ? 90 : 110
                      }}
                    />
                  ) : null}
                  <div
                    className="fallback"
                    style={{
                      display: room.image_url
                        ? 'none' : 'flex',
                      width: '100%', height: '100%',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: isMobile ? 90 : 110,
                      fontSize: '2rem',
                      background: isSelected
                        ? '#bae6fd' : '#e0f2fe'
                    }}
                  >
                    {getBedIcon(room.bed_type)}
                  </div>

                  {/* Selected check overlay */}
                  {isSelected && (
                    <div style={{
                      position: 'absolute',
                      top: '6px', right: '6px',
                      width: 22, height: 22,
                      borderRadius: '50%',
                      background: '#0ea5e9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      boxShadow:
                        '0 2px 6px rgba(14,165,233,0.4)'
                    }}>
                      ✓
                    </div>
                  )}

                  {/* Unavailable badge */}
                  {isUnavailable && (
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(0,0,0,0.45)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '0.72rem',
                      fontWeight: 700
                    }}>
                      Unavailable
                    </div>
                  )}
                </div>

                {/* Room info */}
                <div style={{
                  flex: 1, padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minWidth: 0
                }}>
                  <div>
                    {/* Room name + bed type */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px', marginBottom: '4px',
                      flexWrap: 'wrap'
                    }}>
                      <h4 style={{
                        margin: 0,
                        fontSize: '0.95rem',
                        fontWeight: 700,
                        color: isSelected
                          ? '#0369a1'
                          : 'var(--text-primary)'
                      }}>
                        {room.name}
                      </h4>
                      {room.bed_type && (
                        <span style={{
                          fontSize: '0.7rem',
                          background: '#f3f4f6',
                          color: '#6b7280',
                          padding: '1px 7px',
                          borderRadius: '999px'
                        }}>
                          {getBedIcon(room.bed_type)}
                          {' '}{room.bed_type}
                        </span>
                      )}
                      {room.capacity && (
                        <span style={{
                          fontSize: '0.7rem',
                          background: '#f3f4f6',
                          color: '#6b7280',
                          padding: '1px 7px',
                          borderRadius: '999px'
                        }}>
                          👥 {room.capacity} guests
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    {room.description && (
                      <p style={{
                        margin: '0 0 6px',
                        fontSize: '0.78rem',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.5,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {room.description}
                      </p>
                    )}

                    {/* Amenities pills */}
                    {(amenities.length > 0 ? amenities : DEFAULT_AMENITIES.hotel).length > 0 && (
                      <div style={{
                        display: 'flex',
                        gap: '4px', flexWrap: 'wrap',
                        marginBottom: '6px'
                      }}>
                        {(amenities.length > 0 ? amenities : DEFAULT_AMENITIES.hotel).slice(0, isMobile
                          ? 3 : 5
                        ).map((a, i) => (
                          <span key={i} style={{
                            fontSize: '0.68rem',
                            background: isSelected
                              ? '#e0f2fe' : '#f9fafb',
                            color: isSelected
                              ? '#0369a1' : '#6b7280',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            border: '1px solid',
                            borderColor: isSelected
                              ? '#bae6fd' : '#e5e7eb'
                          }}>
                            {a}
                          </span>
                        ))}
                        {(amenities.length > 0 ? amenities : DEFAULT_AMENITIES.hotel).length >
                          (isMobile ? 3 : 5) && (
                          <span style={{
                            fontSize: '0.68rem',
                            color: 'var(--text-muted)'
                          }}>
                            +{(amenities.length > 0 ? amenities : DEFAULT_AMENITIES.hotel).length -
                              (isMobile ? 3 : 5)} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Price row */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end'
                  }}>
                    <div>
                      {room.available_count > 0 &&
                       room.available_count <= 3 && (
                        <div style={{
                          fontSize: '0.72rem',
                          color: '#dc2626',
                          fontWeight: 600,
                          marginBottom: '3px'
                        }}>
                          🔥 Only{' '}
                          {room.available_count} left!
                        </div>
                      )}
                      {isUnavailable && (
                        <div style={{
                          fontSize: '0.72rem',
                          color: '#dc2626',
                          fontWeight: 600
                        }}>
                          Not available
                        </div>
                      )}
                    </div>

                    <div style={{
                      textAlign: 'right'
                    }}>
                      <div style={{
                        fontSize: isMobile
                          ? '1rem' : '1.15rem',
                        fontWeight: 800,
                        color: isSelected
                          ? '#0369a1' : '#0ea5e9',
                        lineHeight: 1
                      }}>
                        PKR {room.price_per_night
                          ?.toLocaleString('en-PK')}
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 400,
                          color: 'var(--text-muted)',
                          marginLeft: '3px'
                        }}>
                          /night
                        </span>
                      </div>
                      {nights > 1 && (
                        <div style={{
                          fontSize: '0.72rem',
                          color: 'var(--text-secondary)',
                          marginTop: '2px'
                        }}>
                          PKR {totalPrice
                            .toLocaleString('en-PK')}
                          {' '}for {nights} nights
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* No room selected warning */}
      {!selectedRoom && rooms.length > 0 && (
        <div style={{
          marginTop: '10px',
          fontSize: '0.78rem',
          color: '#d97706',
          display: 'flex', alignItems: 'center',
          gap: '5px'
        }}>
          <span>⚠️</span>
          Please select a room type to continue
        </div>
      )}
    </div>
  )
}
