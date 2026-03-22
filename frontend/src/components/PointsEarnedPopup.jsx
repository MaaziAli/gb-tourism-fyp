import { useState, useEffect } from 'react'

export default function PointsEarnedPopup({
  points,
  description,
  tierUpgraded = false,
  newTier,
  onClose,
}) {
  const [visible, setVisible] = useState(true)
  const [animateIn, setAnimateIn] = useState(false)

  useEffect(() => {
    setTimeout(() => setAnimateIn(true), 50)
    const timer = setTimeout(() => {
      setAnimateIn(false)
      setTimeout(() => {
        setVisible(false)
        if (onClose) onClose()
      }, 300)
    }, 4000)
    return () => clearTimeout(timer)
  }, [])

  if (!visible) return null

  const TIER_COLORS = {
    bronze: '#92400e',
    silver: '#6b7280',
    gold: '#d97706',
    platinum: '#7c3aed',
  }
  const TIER_EMOJI = {
    bronze: '🥉',
    silver: '🥈',
    gold: '🥇',
    platinum: '💎',
  }

  const color = tierUpgraded
    ? TIER_COLORS[newTier] || '#d97706'
    : '#16a34a'

  const formatPts = (p) => {
    if (p >= 1000000) return `${(p / 1000000).toFixed(1)}M`
    if (p >= 1000)
      return `${(p / 1000).toFixed(p % 1000 === 0 ? 0 : 1)}K`
    return String(p)
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '20px',
        zIndex: 9999,
        transform: animateIn
          ? 'translateY(0) scale(1)'
          : 'translateY(80px) scale(0.8)',
        opacity: animateIn ? 1 : 0,
        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '16px',
          boxShadow:
            '0 20px 60px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.1)',
          overflow: 'hidden',
          minWidth: '280px',
          maxWidth: '320px',
          border: `2px solid ${color}44`,
        }}
      >
        <div
          style={{
            background: `linear-gradient(135deg, ${color}, ${color}cc)`,
            padding: '16px 20px',
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.6rem',
              flexShrink: 0,
              animation: 'spin 0.5s ease-out',
            }}
          >
            {tierUpgraded ? TIER_EMOJI[newTier] : '⭐'}
          </div>
          <div>
            <div
              style={{
                color: 'white',
                fontWeight: 800,
                fontSize: tierUpgraded ? '0.95rem' : '1.3rem',
                lineHeight: 1,
              }}
            >
              {tierUpgraded
                ? `🎉 ${newTier?.toUpperCase()} TIER!`
                : `+${formatPts(points)} pts`}
            </div>
            <div
              style={{
                color: 'rgba(255,255,255,0.85)',
                fontSize: '0.78rem',
                marginTop: '3px',
              }}
            >
              {tierUpgraded
                ? `You reached ${TIER_EMOJI[newTier]} ${newTier} tier!`
                : 'Points Earned!'}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setAnimateIn(false)
              setTimeout(() => {
                setVisible(false)
                if (onClose) onClose()
              }, 200)
            }}
            style={{
              marginLeft: 'auto',
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: 'white',
              borderRadius: '50%',
              width: 24,
              height: 24,
              cursor: 'pointer',
              fontSize: '0.8rem',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: '14px 20px' }}>
          <p
            style={{
              margin: '0 0 10px',
              fontSize: '0.82rem',
              color: '#374151',
            }}
          >
            {description || 'Points earned on your booking!'}
          </p>

          <div
            style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
              background: color + '10',
              borderRadius: '8px',
              padding: '8px 12px',
              marginBottom: '8px',
            }}
          >
            <span style={{ fontSize: '1.1rem' }}>⭐</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.72rem', color: '#6b7280' }}>
                Points Earned
              </div>
              <div
                style={{
                  fontWeight: 800,
                  fontSize: '1rem',
                  color: color,
                }}
              >
                +{formatPts(points)} coins
              </div>
            </div>
            <div
              style={{
                fontSize: '0.72rem',
                color: '#6b7280',
                textAlign: 'right',
              }}
            >
              <div>Value</div>
              <div style={{ fontWeight: 700, color: color }}>
                PKR{' '}
                {(points * 0.001).toFixed(points >= 1000 ? 0 : 2)}
              </div>
            </div>
          </div>

          <div
            style={{
              height: '3px',
              background: '#e5e7eb',
              borderRadius: '2px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                background: color,
                borderRadius: '2px',
                animation: 'shrink 4s linear forwards',
              }}
            />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(-20deg) scale(0.8); }
          100% { transform: rotate(0) scale(1); }
        }
        @keyframes shrink {
          0% { width: 100%; }
          100% { width: 0%; }
        }
      `}</style>
    </div>
  )
}
