import { useState, useEffect, useRef } from 'react'
import api from '../api/axios'

/**
 * LoyaltyInput – lets the user apply loyalty points as a discount
 * during booking creation.
 *
 * Props:
 *   subtotal      {number}   Booking subtotal BEFORE any discounts (nights × rate).
 *   onPointsChange {function} Called with { points, discount } whenever selection
 *                             changes.  discount is the PKR value to subtract.
 */
export default function LoyaltyInput({ subtotal, onPointsChange }) {
  const [account, setAccount] = useState(null)
  const [inputValue, setInputValue] = useState('')   // raw string in the text field
  const [points, setPoints] = useState(0)            // validated integer
  const [discount, setDiscount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [applied, setApplied] = useState(false)
  const debounceTimer = useRef(null)

  // ── Fetch user account once on mount ──────────────────────────────────
  useEffect(() => {
    api.get('/loyalty/my-account')
      .then(res => setAccount(res.data))
      .catch(() => {})
  }, [])

  // ── Recalculate discount whenever points or subtotal changes ──────────
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)

    if (!points || points <= 0 || !subtotal) {
      setDiscount(0)
      setError('')
      onPointsChange({ points: 0, discount: 0 })
      return
    }

    debounceTimer.current = setTimeout(async () => {
      setLoading(true)
      setError('')
      try {
        const res = await api.post('/loyalty/calculate-redeem', {
          points,
          booking_amount: subtotal,
        })
        const { points_to_use, discount_amount } = res.data
        setDiscount(discount_amount)
        onPointsChange({ points: points_to_use, discount: discount_amount })
      } catch (e) {
        const msg = e.response?.data?.detail || 'Could not calculate discount'
        setError(msg)
        setDiscount(0)
        onPointsChange({ points: 0, discount: 0 })
      } finally {
        setLoading(false)
      }
    }, 350)       // 350 ms debounce – avoids hammering the server on slider drag

    return () => clearTimeout(debounceTimer.current)
  }, [points, subtotal])

  // ── Reset when subtotal changes (dates changed) ───────────────────────
  useEffect(() => {
    handleRemove()
  }, [subtotal])

  if (!account || account.total_points === 0) return null

  // Maximum points that can yield a 50% discount on subtotal
  const maxPoints = Math.min(
    account.total_points,
    Math.floor((subtotal * 0.5) / 0.001),   // 1000 points = PKR 1 → PKR = pts * 0.001
  )

  function applyPreset(preset) {
    const clamped = Math.min(preset, maxPoints)
    setPoints(clamped)
    setInputValue(String(clamped))
    setApplied(false)
  }

  function handleInputChange(e) {
    const raw = e.target.value.replace(/[^0-9]/g, '')
    setInputValue(raw)
    const parsed = parseInt(raw, 10)
    if (!raw || isNaN(parsed)) {
      setPoints(0)
    } else {
      setPoints(Math.min(parsed, maxPoints))
    }
    setApplied(false)
  }

  function handleRemove() {
    setPoints(0)
    setInputValue('')
    setDiscount(0)
    setError('')
    setApplied(false)
    onPointsChange({ points: 0, discount: 0 })
  }

  const presets = [1000, 5000, 10000, 25000].filter(p => p <= maxPoints)

  // ── Applied state (discount confirmed) ────────────────────────────────
  if (applied && discount > 0) {
    return (
      <div style={{
        background: '#fefce8',
        borderRadius: '10px',
        border: '1px solid #fde047',
        padding: '12px 16px',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <div style={{
              display: 'flex', alignItems: 'center',
              gap: '8px', marginBottom: '3px',
            }}>
              <span style={{
                fontWeight: 800, color: '#a16207',
                fontSize: '0.95rem',
              }}>
                ⭐ {points.toLocaleString()} points
              </span>
              <span style={{
                background: '#ca8a04',
                color: 'white', padding: '1px 8px',
                borderRadius: '999px',
                fontSize: '0.68rem', fontWeight: 700,
              }}>
                Applied
              </span>
            </div>
            <div style={{
              fontSize: '0.82rem', color: '#a16207',
              fontWeight: 600,
            }}>
              PKR {discount.toLocaleString('en-PK')} discount!
            </div>
            <div style={{
              fontSize: '0.72rem', color: '#ca8a04', marginTop: '2px',
            }}>
              {(account.total_points - points).toLocaleString()} points remaining
            </div>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            style={{
              background: 'transparent',
              border: 'none', cursor: 'pointer',
              fontSize: '1.3rem', color: '#a16207',
              lineHeight: 1,
            }}
            aria-label="Remove loyalty discount"
          >
            ×
          </button>
        </div>
      </div>
    )
  }

  // ── Input state ────────────────────────────────────────────────────────
  return (
    <div style={{
      background: 'var(--bg-secondary)',
      borderRadius: '10px',
      border: '1px solid var(--border-color)',
      padding: '14px 16px',
    }}>
      {/* Header row */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '10px',
        gap: '8px',
      }}>
        <div>
          <div style={{
            fontWeight: 700, fontSize: '0.85rem',
            color: 'var(--text-primary)',
            marginBottom: '2px',
          }}>
            ⭐ Use Loyalty Points
          </div>
          <div style={{
            fontSize: '0.75rem', color: 'var(--text-muted)',
          }}>
            You have{' '}
            <strong style={{ color: '#ca8a04' }}>
              {account.total_points.toLocaleString()}
            </strong>{' '}
            pts · worth PKR {account.pkr_value?.toLocaleString('en-PK')}
          </div>
        </div>
        <div style={{
          textAlign: 'right', flexShrink: 0,
        }}>
          <div style={{
            fontSize: '0.65rem',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontWeight: 600,
          }}>
            {account.tier_emoji} {account.tier_label}
          </div>
        </div>
      </div>

      {/* Preset buttons */}
      {presets.length > 0 && (
        <div style={{
          display: 'flex', gap: '6px',
          flexWrap: 'wrap', marginBottom: '10px',
        }}>
          {presets.map(p => (
            <button
              key={p}
              type="button"
              onClick={() => applyPreset(p)}
              style={{
                padding: '4px 10px',
                borderRadius: '999px',
                border: points === p
                  ? '1.5px solid #ca8a04'
                  : '1px solid var(--border-color)',
                background: points === p
                  ? '#fefce8' : 'var(--bg-card)',
                color: points === p
                  ? '#a16207' : 'var(--text-secondary)',
                fontSize: '0.72rem',
                fontWeight: points === p ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {p.toLocaleString()}
            </button>
          ))}
          <button
            type="button"
            onClick={() => applyPreset(maxPoints)}
            style={{
              padding: '4px 10px',
              borderRadius: '999px',
              border: points === maxPoints && maxPoints > 0
                ? '1.5px solid #ca8a04'
                : '1px solid var(--border-color)',
              background: points === maxPoints && maxPoints > 0
                ? '#fefce8' : 'var(--bg-card)',
              color: points === maxPoints && maxPoints > 0
                ? '#a16207' : 'var(--text-secondary)',
              fontSize: '0.72rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            Max ({maxPoints.toLocaleString()})
          </button>
        </div>
      )}

      {/* Manual input + Apply button */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          inputMode="numeric"
          placeholder="Enter points (e.g. 5000)"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={e => {
            if (e.key === 'Enter' && discount > 0) {
              e.preventDefault()
              setApplied(true)
            }
          }}
          style={{
            flex: 1, padding: '10px 12px',
            borderRadius: '8px',
            border: error
              ? '1px solid var(--danger)'
              : '1px solid var(--border-color)',
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            fontSize: '0.9rem', outline: 'none',
            fontWeight: 600,
          }}
        />
        <button
          type="button"
          onClick={() => {
            if (discount > 0) setApplied(true)
          }}
          disabled={loading || discount <= 0}
          style={{
            padding: '10px 16px',
            borderRadius: '8px', border: 'none',
            background: discount > 0 && !loading
              ? 'linear-gradient(135deg, #ca8a04, #a16207)'
              : 'var(--border-color)',
            color: discount > 0 && !loading
              ? 'white' : 'var(--text-muted)',
            fontWeight: 700, fontSize: '0.875rem',
            cursor: discount > 0 && !loading
              ? 'pointer' : 'not-allowed',
            whiteSpace: 'nowrap',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? '…' : 'Apply'}
        </button>
      </div>

      {/* Live discount preview */}
      {discount > 0 && !error && (
        <div style={{
          marginTop: '8px',
          background: '#fefce8',
          border: '1px solid #fde047',
          borderRadius: '8px',
          padding: '7px 12px',
          fontSize: '0.82rem',
          color: '#a16207', fontWeight: 700,
          display: 'flex', justifyContent: 'space-between',
        }}>
          <span>⭐ Discount</span>
          <span>PKR {discount.toLocaleString('en-PK')}</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <p style={{
          margin: '6px 0 0', fontSize: '0.8rem',
          color: 'var(--danger)', fontWeight: 600,
        }}>
          ❌ {error}
        </p>
      )}
    </div>
  )
}
