import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import useWindowSize from '../hooks/useWindowSize'

const AVAILABLE_ADDONS = [
  { name: 'Breakfast', price: 500, icon: '🍳', description: 'Per day' },
  { name: 'Airport Pickup', price: 2000, icon: '🚗', description: 'One-time' },
  { name: 'Tour Guide', price: 1500, icon: '🧭', description: 'Per day' },
  { name: 'Travel Insurance', price: 800, icon: '🛡️', description: 'Per booking' },
]

export default function Checkout() {
  const { bookingId } = useParams()
  const navigate = useNavigate()
  const { isMobile } = useWindowSize()

  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [selectedAddons, setSelectedAddons] = useState([])
  const [timeLeft, setTimeLeft] = useState(null) // seconds remaining on hold
  const timerRef = useRef(null)

  // ── Fetch booking & create hold ──────────────────────────────────────────
  useEffect(() => {
    async function init() {
      try {
        // 1. Fetch booking details from /bookings/me
        const bookingsRes = await api.get('/bookings/me')
        const found = bookingsRes.data.find(b => b.id === parseInt(bookingId))
        if (!found) {
          navigate('/my-bookings')
          return
        }
        setBooking(found)

        // 2. Place 10-minute hold
        const holdRes = await api.post(`/payments/xpay/create-hold/${bookingId}`)
        const expiry = new Date(holdRes.data.hold_expires_at)

        // 3. Start countdown timer
        const tick = () => {
          const remaining = Math.max(0, Math.floor((expiry - new Date()) / 1000))
          setTimeLeft(remaining)
          if (remaining === 0) {
            clearInterval(timerRef.current)
            setError('Your 10-minute hold has expired. Please start the booking again.')
          }
        }
        tick()
        timerRef.current = setInterval(tick, 1000)
      } catch (err) {
        const detail = err.response?.data?.detail || 'Failed to load checkout'
        if (detail.includes('already confirmed') || detail.includes('already paid')) {
          navigate(`/voucher/${bookingId}`)
        } else {
          setError(detail)
        }
      } finally {
        setLoading(false)
      }
    }

    init()
    return () => clearInterval(timerRef.current)
  }, [bookingId, navigate])

  // ── Add-on toggle ────────────────────────────────────────────────────────
  function toggleAddon(addon) {
    setSelectedAddons(prev =>
      prev.find(a => a.name === addon.name)
        ? prev.filter(a => a.name !== addon.name)
        : [...prev, addon],
    )
  }

  // ── Pay ──────────────────────────────────────────────────────────────────
  async function handlePayment() {
    if (timeLeft === 0) {
      setError('Hold expired. Please start the booking again.')
      return
    }
    setProcessing(true)
    setError('')
    try {
      const res = await api.post('/payments/xpay/create-payment-intent', {
        booking_id: parseInt(bookingId),
        addons: selectedAddons,
      })
      // Redirect to XPay hosted checkout page
      window.location.href = res.data.iframe_url
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to initiate payment. Please try again.')
      setProcessing(false)
    }
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: 'var(--bg-primary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--text-secondary)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: 12 }}>⏳</div>
          <div>Preparing your checkout…</div>
        </div>
      </div>
    )
  }

  const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0)
  const grandTotal = (booking?.total_price || 0) + addonsTotal

  const minutes = timeLeft !== null ? Math.floor(timeLeft / 60) : 10
  const seconds = timeLeft !== null ? timeLeft % 60 : 0
  const holdExpired = timeLeft === 0

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingBottom: 48 }}>

      {/* ── Hero banner ──────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a5f 0%, #0ea5e9 100%)',
        padding: '32px 16px 80px',
      }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'white', borderRadius: 8, padding: '7px 16px',
              cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
              marginBottom: 20,
            }}
          >
            Back
          </button>
          <h1 style={{ color: 'white', margin: '0 0 6px', fontSize: '1.7rem', fontWeight: 800 }}>
            Complete Your Booking
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', margin: 0, fontSize: '0.9rem' }}>
            Review add-ons and pay securely via XPay
          </p>
        </div>
      </div>

      {/* ── Main content ────────────────────────────────────────────── */}
      <div style={{
        maxWidth: 720, margin: '-48px auto 0', padding: '0 16px',
        display: isMobile ? 'flex' : 'grid',
        flexDirection: isMobile ? 'column' : undefined,
        gridTemplateColumns: isMobile ? undefined : '1fr 280px',
        gap: 20, alignItems: 'start',
      }}>

        {/* ── LEFT: Hold timer + Add-ons + Pay button ───────────────── */}
        <div>

          {/* Hold countdown */}
          {timeLeft !== null && (
            <div style={{
              background: holdExpired ? 'var(--danger-bg, #fef2f2)' : '#fef3c7',
              border: `1px solid ${holdExpired ? 'var(--danger, #ef4444)' : '#f59e0b'}`,
              borderRadius: 12, padding: '14px 18px', marginBottom: 16,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ fontSize: '1.4rem' }}>{holdExpired ? '' : ''}</span>
              <div>
                <div style={{
                  fontWeight: 700, fontSize: '0.9rem',
                  color: holdExpired ? 'var(--danger, #b91c1c)' : '#92400e',
                }}>
                  {holdExpired
                    ? 'Hold expired — please go back and rebook'
                    : `Hold expires in ${minutes}:${String(seconds).padStart(2, '0')}`}
                </div>
                {!holdExpired && (
                  <div style={{ fontSize: '0.78rem', color: '#a16207', marginTop: 2 }}>
                    Your room is reserved while you complete payment
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              background: 'var(--danger-bg, #fef2f2)',
              color: 'var(--danger, #b91c1c)',
              border: '1px solid var(--danger, #ef4444)',
              borderRadius: 10, padding: '12px 16px', marginBottom: 16,
              fontSize: '0.875rem', fontWeight: 600,
            }}>
              {error}
            </div>
          )}

          {/* Add-ons */}
          <div style={{
            background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)',
            padding: 24, marginBottom: 16,
          }}>
            <h3 style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Enhance Your Stay (Optional)
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Select add-ons to include with your booking
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {AVAILABLE_ADDONS.map(addon => {
                const isSelected = selectedAddons.some(a => a.name === addon.name)
                return (
                  <label
                    key={addon.name}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '14px 16px', borderRadius: 10, cursor: 'pointer',
                      border: isSelected
                        ? '2px solid var(--accent, #2563eb)'
                        : '2px solid var(--border-color)',
                      background: isSelected
                        ? 'var(--accent-light, #eff6ff)'
                        : 'var(--bg-secondary)',
                      transition: 'all 0.15s',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleAddon(addon)}
                      style={{ width: 18, height: 18, accentColor: 'var(--accent, #2563eb)', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '1.5rem' }}>{addon.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                        {addon.name}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {addon.description}
                      </div>
                    </div>
                    <div style={{
                      fontWeight: 700, fontSize: '0.9rem',
                      color: isSelected ? 'var(--accent, #2563eb)' : 'var(--text-secondary)',
                      whiteSpace: 'nowrap',
                    }}>
                      + PKR {addon.price.toLocaleString('en-PK')}
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Payment methods note */}
          <div style={{
            background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            padding: '16px 20px', marginBottom: 16,
          }}>
            <h4 style={{ margin: '0 0 10px', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Accepted Payment Methods
            </h4>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {[
                { label: 'Credit / Debit Card', icon: '' },
                { label: 'Mobile Wallets', icon: '' },
                { label: 'Bank Transfer', icon: '' },
              ].map(m => (
                <span key={m.label} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: 'var(--bg-secondary)', padding: '6px 12px',
                  borderRadius: 999, fontSize: '0.78rem', fontWeight: 600,
                  color: 'var(--text-secondary)', border: '1px solid var(--border-color)',
                }}>
                  {m.icon} {m.label}
                </span>
              ))}
            </div>
            <p style={{ margin: '10px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              You will be redirected to XPay's secure hosted checkout page to complete your payment.
            </p>
          </div>

          {/* Pay button */}
          <button
            onClick={handlePayment}
            disabled={processing || holdExpired || !booking}
            style={{
              width: '100%', padding: '16px 20px', borderRadius: 12,
              border: 'none', fontSize: '1rem', fontWeight: 800,
              cursor: (processing || holdExpired) ? 'not-allowed' : 'pointer',
              background: (processing || holdExpired)
                ? '#9ca3af'
                : 'linear-gradient(135deg, #1e3a5f, #0ea5e9)',
              color: 'white', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            }}
          >
            {processing ? (
              <>
                <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span>
                Redirecting to XPay…
              </>
            ) : holdExpired ? (
              'Hold Expired — Go Back to Rebook'
            ) : (
              <>
                Pay PKR {grandTotal.toLocaleString('en-PK')} via XPay
              </>
            )}
          </button>
        </div>

        {/* ── RIGHT: Order summary ──────────────────────────────────── */}
        <div style={{ position: 'sticky', top: 20 }}>
          <div style={{
            background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)',
            padding: 20,
          }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Order Summary
            </h3>

            {booking && (
              <>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: 4 }}>
                  {booking.listing_title}
                </div>
                {booking.location && (
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                    {booking.location}
                  </div>
                )}
                {booking.room_type_name && (
                  <div style={{
                    display: 'inline-block', background: 'var(--accent-light)',
                    color: 'var(--accent)', padding: '2px 10px', borderRadius: 999,
                    fontSize: '0.78rem', fontWeight: 600, marginBottom: 10,
                  }}>
                    {booking.room_type_name}
                  </div>
                )}
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.8 }}>
                  <div>Check-in: {booking.check_in}</div>
                  <div>Check-out: {booking.check_out}</div>
                </div>

                <div style={{ height: 1, background: 'var(--border-color)', margin: '8px 0' }} />

                {/* Price rows */}
                {[
                  { label: 'Room subtotal', value: booking.total_price },
                  ...selectedAddons.map(a => ({ label: a.name, value: a.price })),
                ].map(row => (
                  <div key={row.label} style={{
                    display: 'flex', justifyContent: 'space-between',
                    marginBottom: 6, fontSize: '0.85rem',
                  }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{row.label}</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                      PKR {row.value.toLocaleString('en-PK')}
                    </span>
                  </div>
                ))}

                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '12px 0 0', borderTop: '2px solid var(--border-color)', marginTop: 6,
                }}>
                  <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>Total</span>
                  <span style={{ fontWeight: 800, color: 'var(--accent)', fontSize: '1.15rem' }}>
                    PKR {grandTotal.toLocaleString('en-PK')}
                  </span>
                </div>
              </>
            )}

            <div style={{
              marginTop: 16, padding: '10px 14px',
              background: 'var(--bg-secondary)', borderRadius: 8,
              fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center',
            }}>
              Your payment is protected by 256-bit SSL encryption
            </div>
          </div>
        </div>

      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
