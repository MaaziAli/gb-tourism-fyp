import { useState } from 'react'

const PLACEHOLDER =
  'https://placehold.co/800x500/1e3a5f/ffffff?text=GB+Tourism'

function getImgUrl(raw) {
  if (!raw) return PLACEHOLDER
  if (raw.startsWith('http')) return raw
  return `http://127.0.0.1:8000/uploads/${raw}`
}

export default function PhotoGallery({
  mainImage = null,
  extraImages = [],
  title = '',
  isMobile = false,
  onImageClick
}) {
  const [activeIdx, setActiveIdx] = useState(0)

  // Build unified image list
  const allImgs = [
    mainImage,
    ...extraImages.map(img =>
      typeof img === 'string'
        ? img
        : img?.image_url || null
    )
  ].filter(Boolean)

  function handleClick(img) {
    if (onImageClick) onImageClick(img)
  }

  // -- Empty state --
  if (allImgs.length === 0) {
    return (
      <div style={{
        height: isMobile ? 220 : 400,
        background:
          'linear-gradient(135deg, #1e3a5f18, #0ea5e918)',
        borderRadius: isMobile ? 0 : '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <div style={{fontSize: '3rem'}}>🏔️</div>
        <div style={{fontSize: '0.85rem'}}>
          No photos yet
        </div>
      </div>
    )
  }

  // -- Mobile: slider with dots --
  if (isMobile) {
    const prev = () => setActiveIdx(
      i => (i - 1 + allImgs.length)
        % allImgs.length
    )
    const next = () => setActiveIdx(
      i => (i + 1) % allImgs.length
    )

    return (
      <div style={{
        position: 'relative',
        height: 250,
        overflow: 'hidden',
        background: '#f3f4f6'
      }}>
        <img
          src={getImgUrl(allImgs[activeIdx])}
          alt={`${title} photo ${activeIdx + 1}`}
          onClick={() =>
            handleClick(allImgs[activeIdx])
          }
          onError={e => {
            e.target.onerror = null
            e.target.src = PLACEHOLDER
          }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            cursor: 'pointer'
          }}
        />

        {/* Prev / Next arrows */}
        {allImgs.length > 1 && (
          <>
            <button
              onClick={e => {
                e.stopPropagation()
                prev()
              }}
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(0,0,0,0.45)',
                border: 'none',
                color: 'white',
                borderRadius: '50%',
                width: 34, height: 34,
                cursor: 'pointer',
                fontSize: '1.1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >‹</button>
            <button
              onClick={e => {
                e.stopPropagation()
                next()
              }}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(0,0,0,0.45)',
                border: 'none',
                color: 'white',
                borderRadius: '50%',
                width: 34, height: 34,
                cursor: 'pointer',
                fontSize: '1.1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >›</button>
          </>
        )}

        {/* Dot indicators */}
        {allImgs.length > 1 && (
          <div style={{
            position: 'absolute',
            bottom: '12px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '5px'
          }}>
            {allImgs.map((_, i) => (
              <div
                key={i}
                onClick={() => setActiveIdx(i)}
                style={{
                  width: i === activeIdx ? 18 : 6,
                  height: 6,
                  borderRadius: '3px',
                  background: i === activeIdx
                    ? 'white'
                    : 'rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                  transition: 'width 0.2s'
                }}
              />
            ))}
          </div>
        )}

        {/* Photo count badge */}
        <div style={{
          position: 'absolute',
          bottom: '12px',
          right: '12px',
          background: 'rgba(0,0,0,0.55)',
          color: 'white',
          fontSize: '0.72rem',
          padding: '3px 8px',
          borderRadius: '999px',
          fontWeight: 600
        }}>
          {activeIdx + 1} / {allImgs.length}
        </div>
      </div>
    )
  }

  // -- Desktop: Booking.com grid --
  // Left: 1 large | Right: 2x2 grid
  const main = allImgs[0]
  const thumbs = allImgs.slice(1, 5)
  const extra = allImgs.length - 5

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '4px',
      height: 420,
      borderRadius: '12px',
      overflow: 'hidden',
      background: '#e5e7eb'
    }}>
      {/* Main large image */}
      <div
        onClick={() => handleClick(main)}
        style={{
          overflow: 'hidden',
          cursor: 'pointer',
          position: 'relative'
        }}
      >
        <img
          src={getImgUrl(main)}
          alt={title}
          onError={e => {
            e.target.onerror = null
            e.target.src = PLACEHOLDER
          }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            transition: 'transform 0.3s ease'
          }}
          onMouseEnter={e =>
            e.target.style.transform = 'scale(1.04)'
          }
          onMouseLeave={e =>
            e.target.style.transform = 'scale(1)'
          }
        />
        {/* Photo count on main */}
        {allImgs.length > 1 && (
          <div style={{
            position: 'absolute',
            bottom: '14px',
            left: '14px',
            background: 'rgba(0,0,0,0.6)',
            color: 'white',
            fontSize: '0.75rem',
            padding: '4px 10px',
            borderRadius: '999px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            📷 {allImgs.length} photo
            {allImgs.length > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Right 2x2 thumbnail grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: '1fr 1fr',
        gap: '4px'
      }}>
        {[0, 1, 2, 3].map(ti => {
          const img = thumbs[ti]
          const isLastSlot = ti === 3
          const hasMore = extra > 0

          return (
            <div
              key={ti}
              onClick={() => img &&
                handleClick(img)
              }
              style={{
                overflow: 'hidden',
                cursor: img ? 'pointer' : 'default',
                background: '#e5e7eb',
                position: 'relative'
              }}
            >
              {img ? (
                <>
                  <img
                    src={getImgUrl(img)}
                    alt={`Photo ${ti + 2}`}
                    onError={e => {
                      e.target.onerror = null
                      e.target.src =
                        'https://placehold.co/400x200/e5e7eb/9ca3af?text=Photo'
                    }}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                      transition:
                        'transform 0.3s ease'
                    }}
                    onMouseEnter={e =>
                      e.target.style.transform =
                        'scale(1.06)'
                    }
                    onMouseLeave={e =>
                      e.target.style.transform =
                        'scale(1)'
                    }
                  />
                  {/* "See all" overlay on slot 3 */}
                  {isLastSlot && hasMore && (
                    <div
                      onClick={e => {
                        e.stopPropagation()
                        handleClick(img)
                      }}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background:
                          'rgba(0,0,0,0.55)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        cursor: 'pointer',
                        gap: '3px'
                      }}
                    >
                      <div style={{
                        fontSize: '1.5rem',
                        fontWeight: 900
                      }}>
                        +{extra + 1}
                      </div>
                      <div style={{
                        fontSize: '0.72rem',
                        opacity: 0.9
                      }}>
                        See all photos
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div style={{
                  width: '100%',
                  height: '100%',
                  background: '#f3f4f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#d1d5db',
                  fontSize: '1.5rem'
                }}>
                  📷
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
