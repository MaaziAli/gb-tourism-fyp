import { useState } from 'react'

const GROUP_TIERS = [
  { min: 1, max: 4, label: 'Individual/Small',
    emoji: '👤', discount: 0 },
  { min: 5, max: 9, label: 'Small Group',
    emoji: '👥', discount: 5 },
  { min: 10, max: 14, label: 'Medium Group',
    emoji: '👨‍👩‍👧‍👦', discount: 10 },
  { min: 15, max: 19, label: 'Large Group',
    emoji: '🏫', discount: 15 },
  { min: 20, max: 29, label: 'Event Group',
    emoji: '🎪', discount: 20 },
  { min: 30, max: 49, label: 'Big Event',
    emoji: '🎭', discount: 25 },
  { min: 50, max: 999, label: 'Mass Event',
    emoji: '🏟️', discount: 30 },
]

function getTierForSize(size) {
  return GROUP_TIERS.find(
    t => size >= t.min && size <= t.max
  ) || GROUP_TIERS[0]
}

export default function GroupSizeSelector({
  value = 1,
  onChange,
  basePrice = 0,
  nights = 1,
}) {
  const [showTiers, setShowTiers] = useState(false)
  const tier = getTierForSize(value)
  const discount = tier.discount
  const discountAmount = Math.round(
    basePrice * nights * discount / 100
  )
  const totalPrice = basePrice * nights
    - discountAmount
  const perPerson = value > 0
    ? Math.round(totalPrice / value)
    : totalPrice

  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center',
        gap: '12px', marginBottom: '12px',
      }}>
        <button
          type="button"
          onClick={() =>
            onChange(Math.max(1, value - 1))
          }
          style={{
            width: 36, height: 36,
            borderRadius: '50%',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            cursor: 'pointer', fontWeight: 700,
            fontSize: '1.2rem', display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          −
        </button>

        <div style={{
          flex: 1, textAlign: 'center',
          background: 'var(--bg-secondary)',
          borderRadius: '10px', padding: '10px',
          border: '1px solid var(--border-color)',
        }}>
          <div style={{
            fontSize: '1.8rem', lineHeight: 1,
          }}>
            {tier.emoji}
          </div>
          <div style={{
            fontSize: '1.4rem', fontWeight: 800,
            color: 'var(--text-primary)',
          }}>
            {value}
          </div>
          <div style={{
            fontSize: '0.72rem',
            color: discount > 0
              ? '#16a34a' : 'var(--text-muted)',
            fontWeight: discount > 0 ? 700 : 400,
          }}>
            {tier.label}
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            onChange(Math.min(500, value + 1))
          }
          style={{
            width: 36, height: 36,
            borderRadius: '50%',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            cursor: 'pointer', fontWeight: 700,
            fontSize: '1.2rem', display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          +
        </button>
      </div>

      <div style={{
        display: 'flex', gap: '6px',
        flexWrap: 'wrap', marginBottom: '12px',
      }}>
        {[1, 2, 5, 10, 15, 20, 30, 50].map(n => (
          <button key={n}
            type="button"
            onClick={() => onChange(n)}
            style={{
              padding: '5px 10px',
              borderRadius: '999px',
              border: value === n
                ? '2px solid var(--accent)'
                : '1px solid var(--border-color)',
              background: value === n
                ? 'var(--accent-light)'
                : 'var(--bg-secondary)',
              color: value === n
                ? 'var(--accent)'
                : 'var(--text-secondary)',
              cursor: 'pointer', fontWeight: 600,
              fontSize: '0.8rem',
            }}
          >
            {n}
          </button>
        ))}
      </div>

      {discount > 0 && basePrice > 0 && (
        <div style={{
          background: '#dcfce7',
          border: '1px solid #86efac',
          borderRadius: '10px', padding: '12px 14px',
          marginBottom: '12px',
        }}>
          <div style={{
            fontWeight: 700, color: '#16a34a',
            fontSize: '0.9rem', marginBottom: '4px',
          }}>
            🎉 {discount}% Group Discount Applied!
          </div>
          <div style={{
            fontSize: '0.8rem', color: '#15803d',
          }}>
            Saving PKR {discountAmount
              .toLocaleString('en-PK')} ·
            PKR {perPerson.toLocaleString('en-PK')}
            /person
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowTiers(p => !p)}
        style={{
          background: 'transparent',
          border: 'none', cursor: 'pointer',
          fontSize: '0.78rem',
          color: 'var(--accent)', fontWeight: 600,
          padding: 0,
        }}
      >
        {showTiers ? '▲' : '▼'} View all group
        discount tiers
      </button>

      {showTiers && (
        <div style={{
          marginTop: '10px',
          background: 'var(--bg-secondary)',
          borderRadius: '10px',
          border: '1px solid var(--border-color)',
          padding: '12px', fontSize: '0.78rem',
        }}>
          {GROUP_TIERS.filter(
            t => t.discount > 0
          ).map(t => (
            <div key={t.min} style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '4px 0',
              color: value >= t.min
                ? '#16a34a'
                : 'var(--text-secondary)',
              fontWeight: value >= t.min
                ? 700 : 400,
            }}>
              <span>
                {t.emoji} {t.min}+ people
              </span>
              <span>
                {value >= t.min ? '✓ ' : ''}
                {t.discount}% off
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
