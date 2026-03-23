import { useState } from 'react'
import { getImageUrl } from '../utils/image'

const PLACEHOLDER =
  'https://placehold.co/800x500/1e3a5f/ffffff?text=GB+Tourism'

export default function PhotoGallery({
  mainImage,
  extraImages = [],
  title = '',
  isMobile = false,
  onViewAll
}) {
  const [activeIdx, setActiveIdx] = useState(0)

  // Build image list
  const allImages = [
    mainImage,
    ...extraImages.map(img =>
      img.image_url || img
    )
  ].filter(Boolean)

  if (allImages.length === 0) {
    return (
      <div style={{
        height: isMobile ? 220 : 400,
        background:
          'linear-gradient(135deg, #1e3a5f22, #0ea5e922)',
        borderRadius: isMobile ? 0 : '12px',
        display: 'flex', alignItems: 'center',
        justifyContent: 'center',
        fontSize: '3rem'
      }}>
        🏔️
      </div>
    )
  }

  // Mobile: single image with dots
  if (isMobile) {
    return (
      <div style={{
        position: 'relative',
        height: 240, overflow: 'hidden'
      }}>
        <img
          src={getImageUrl(allImages[activeIdx])}
          alt={title}
          onError={e => {
            e.target.onerror = null
            e.target.src = PLACEHOLDER
          }}
          style={{
            width: '100%', height: '100%',
            objectFit: 'cover', display: 'block'
          }}
        />
        {/* Nav arrows */}
        {allImages.length > 1 && (
          <>
            <button
              onClick={() => setActiveIdx(
                i => (i - 1 + allImages.length)
                  % allImages.length
              )}
              style={{
                position: 'absolute',
                left: '10px', top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(0,0,0,0.45)',
                border: 'none', color: 'white',
                borderRadius: '50%',
                width: 32, height: 32,
                cursor: 'pointer', fontSize: '1rem'
              }}
            >‹</button>
            <button
              onClick={() => setActiveIdx(
                i => (i + 1) % allImages.length
              )}
              style={{
                position: 'absolute',
                right: '10px', top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(0,0,0,0.45)',
                border: 'none', color: 'white',
                borderRadius: '50%',
                width: 32, height: 32,
                cursor: 'pointer', fontSize: '1rem'
              }}
            >›</button>
          </>
        )}
        {/* Dots */}
        {allImages.length > 1 && (
          <div style={{
            position: 'absolute',
            bottom: '10px', left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex', gap: '4px'
          }}>
            {allImages.map((_, i) => (
              <div key={i}
                onClick={() => setActiveIdx(i)}
                style={{
                  width: i === activeIdx ? 16 : 6,
                  height: 6, borderRadius: '3px',
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
        {/* Count badge */}
        {allImages.length > 1 && (
          <div style={{
            position: 'absolute',
            top: '10px', right: '10px',
            background: 'rgba(0,0,0,0.55)',
            color: 'white', fontSize: '0.72rem',
            padding: '3px 8px', borderRadius: '999px',
            fontWeight: 600
          }}>
            {activeIdx + 1}/{allImages.length}
          </div>
        )}
      </div>
    )
  }

  // Desktop: Booking.com style grid
  // Main large image left + 4 thumbnails right
  const mainImg = allImages[0]
  const thumbs = allImages.slice(1, 5)
  const remaining = allImages.length - 5

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '4px', borderRadius: '12px',
      overflow: 'hidden', height: 420
    }}>
      {/* Main large image */}
      <div
        onClick={() => {
          setActiveIdx(0)
          onViewAll && onViewAll()
        }}
        style={{
          cursor: 'pointer', overflow: 'hidden',
          position: 'relative'
        }}
      >
        <img
          src={getImageUrl(mainImg)}
          alt={title}
          onError={e => {
            e.target.onerror = null
            e.target.src = PLACEHOLDER
          }}
          style={{
            width: '100%', height: '100%',
            objectFit: 'cover', display: 'block',
            transition: 'transform 0.3s'
          }}
          onMouseEnter={e =>
            e.target.style.transform =
              'scale(1.03)'
          }
          onMouseLeave={e =>
            e.target.style.transform = 'scale(1)'
          }
        />
      </div>

      {/* Right: 2x2 thumbnail grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: '1fr 1fr',
        gap: '4px'
      }}>
        {[0,1,2,3].map(ti => {
          const img = thumbs[ti]
          const isLast = ti === 3 &&
            remaining > 0

          return (
            <div key={ti}
              onClick={() => {
                if (img) {
                  setActiveIdx(ti + 1)
                  onViewAll && onViewAll()
                }
              }}
              style={{
                position: 'relative',
                overflow: 'hidden',
                cursor: img ? 'pointer' : 'default',
                background: '#f3f4f6'
              }}
            >
              {img ? (
                <>
                  <img
                    src={getImageUrl(img)}
                    alt={`Photo ${ti + 2}`}
                    onError={e => {
                      e.target.onerror = null
                      e.target.src =
                        'https://placehold.co/400x210/e5e7eb/9ca3af?text=Photo'
                    }}
                    style={{
                      width: '100%', height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                      transition: 'transform 0.3s'
                    }}
                    onMouseEnter={e =>
                      e.target.style.transform =
                        'scale(1.05)'
                    }
                    onMouseLeave={e =>
                      e.target.style.transform =
                        'scale(1)'
                    }
                  />
                  {isLast && remaining > 0 && (
                    <div
                      onClick={e => {
                        e.stopPropagation()
                        onViewAll && onViewAll()
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
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{
                        fontSize: '1.4rem',
                        fontWeight: 800
                      }}>
                        +{remaining + 1}
                      </div>
                      <div style={{
                        fontSize: '0.72rem',
                        opacity: 0.85
                      }}>
                        View all photos
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div style={{
                  width: '100%', height: '100%',
                  background: '#f9fafb',
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
