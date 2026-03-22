import { useState } from 'react'
import api from '../api/axios'

export default function CouponInput({
  listingId,
  bookingAmount,
  onApply,
  onRemove,
}) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [applied, setApplied] = useState(null)

  async function handleApply() {
    if (!code.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/coupons/validate', {
        code: code.toUpperCase().trim(),
        listing_id: listingId || null,
        booking_amount: bookingAmount,
      })
      setApplied(res.data)
      if (onApply) onApply(res.data)
    } catch (e) {
      setError(
        e.response?.data?.detail ||
          'Invalid coupon code'
      )
      setApplied(null)
    } finally {
      setLoading(false)
    }
  }

  function handleRemove() {
    setApplied(null)
    setCode('')
    setError('')
    if (onRemove) onRemove()
  }

  if (applied) {
    return (
      <div style={{
        background: '#dcfce7',
        borderRadius: '10px',
        border: '1px solid #86efac',
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
                fontFamily: 'monospace',
                fontWeight: 800, color: '#16a34a',
                fontSize: '0.95rem',
              }}>
                {applied.code}
              </span>
              <span style={{
                background: '#16a34a',
                color: 'white', padding: '1px 8px',
                borderRadius: '999px',
                fontSize: '0.68rem', fontWeight: 700,
              }}>
                ✅ Applied
              </span>
            </div>
            <div style={{
              fontSize: '0.82rem', color: '#16a34a',
              fontWeight: 600,
            }}>
              🎉 PKR {applied.discount_amount
                ?.toLocaleString('en-PK')} discount!
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: '#15803d',
            }}>
              {applied.title}
            </div>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            style={{
              background: 'transparent',
              border: 'none', cursor: 'pointer',
              fontSize: '1.2rem',
              color: '#16a34a',
            }}
          >
            ×
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <label style={{
        display: 'block', fontSize: '0.85rem',
        fontWeight: 700,
        color: 'var(--text-secondary)',
        marginBottom: '8px',
      }}>
        🎟️ Have a coupon code?
      </label>
      <div style={{
        display: 'flex', gap: '8px',
      }}>
        <input
          type="text"
          placeholder="Enter code (e.g. MAAZ10)"
          value={code}
          onChange={(e) =>
            setCode(e.target.value.toUpperCase())
          }
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleApply()
          }}
          style={{
            flex: 1, padding: '10px 12px',
            borderRadius: '8px',
            border: error
              ? '1px solid var(--danger)'
              : '1px solid var(--border-color)',
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            fontSize: '0.9rem', outline: 'none',
            fontFamily: 'monospace',
            fontWeight: 600, letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
        />
        <button
          type="button"
          onClick={handleApply}
          disabled={loading || !code.trim()}
          style={{
            padding: '10px 18px',
            borderRadius: '8px', border: 'none',
            background:
              !code.trim()
                ? 'var(--border-color)'
                : 'linear-gradient(135deg, #f59e0b, #d97706)',
            color: !code.trim()
              ? 'var(--text-muted)' : 'white',
            fontWeight: 700, cursor: !code.trim()
              ? 'not-allowed' : 'pointer',
            fontSize: '0.875rem',
            opacity: loading ? 0.7 : 1,
            whiteSpace: 'nowrap',
          }}
        >
          {loading ? '...' : 'Apply'}
        </button>
      </div>
      {error && (
        <p style={{
          margin: '6px 0 0', fontSize: '0.82rem',
          color: 'var(--danger)', fontWeight: 600,
        }}>
          ❌ {error}
        </p>
      )}
    </div>
  )
}
