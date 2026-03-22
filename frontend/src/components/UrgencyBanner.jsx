import { useState } from 'react'

export default function UrgencyBanner({
  roomsLeft = null,
  message = null
}) {
  const [visible, setVisible] = useState(true)

  if (!visible) return null
  if (!roomsLeft && !message) return null
  if (roomsLeft > 5) return null

  const isLow = roomsLeft !== null &&
    roomsLeft <= 3
  const text = message ||
    (roomsLeft === 1
      ? '🔥 Only 1 room left!'
      : roomsLeft === 0
      ? '❌ Fully booked'
      : `🔥 Only ${roomsLeft} rooms left!`
    )

  return (
    <div style={{
      background: isLow ? '#fee2e2' : '#fef3c7',
      border: `1px solid ${
        isLow ? '#fca5a5' : '#fcd34d'
      }`,
      borderRadius: '10px',
      padding: '10px 14px',
      display: 'flex', alignItems: 'center',
      gap: '8px', marginBottom: '12px',
      animation: 'pulse 2s infinite'
    }}>
      <span style={{fontSize: '1.1rem'}}>
        {isLow ? '🔥' : '⚠️'}
      </span>
      <div style={{flex: 1}}>
        <div style={{
          fontWeight: 700, fontSize: '0.875rem',
          color: isLow ? '#dc2626' : '#d97706'
        }}>
          {text}
        </div>
        <div style={{
          fontSize: '0.72rem',
          color: isLow ? '#b91c1c' : '#92400e'
        }}>
          Book now to secure your spot
        </div>
      </div>
      <button
        type="button"
        onClick={() => setVisible(false)}
        style={{
          background: 'transparent', border: 'none',
          cursor: 'pointer', fontSize: '1rem',
          color: isLow ? '#dc2626' : '#d97706',
          opacity: 0.7
        }}
      >×</button>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.85; }
        }
      `}</style>
    </div>
  )
}
