import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import useWindowSize from '../hooks/useWindowSize'
import LoyaltyInput from '../components/LoyaltyInput'
import Toast from '../components/Toast'
import AddonSelector from '../components/AddonSelector'

export default function Checkout() {
  const { bookingId } = useParams()
  const navigate = useNavigate()
  const { isMobile } = useWindowSize()

  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [selectedAddons, setSelectedAddons] = useState([])
  const [addonsTotal, setAddonsTotal] = useState(0)
  const [timeLeft, setTimeLeft] = useState(null)
  const timerRef = useRef(null)

  // Loyalty state
  const [loyaltyDiscount, setLoyaltyDiscount] = useState(0)
  const [loyaltyPointsUsed, setLoyaltyPointsUsed] = useState(0)
  const [loyaltyToast, setLoyaltyToast] = useState(null) // { points, discount }
  const handleLoyaltyChange = useCallback(({ points, discount }) => {
    setLoyaltyPointsUsed(points)
    setLoyaltyDiscount(discount)
  }, [])

  const handleAddonsChange = useCallback(({ addons, total }) => {
    setSelectedAddons(addons || [])
    setAddonsTotal(total || 0)
  }, [])

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

  // ── Pay (mock — no real gateway) ─────────────────────────────────────────
  async function handlePayment() {
    if (timeLeft === 0) {
      setError('Hold expired. Please start the booking again.')
      return
    }
    setProcessing(true)
    setError('')
    try {
      await new Promise(r => setTimeout(r, 1500)) // simulated processing delay
      const res = await api.post(
        `/payments/mock/confirm/${bookingId}`,
        {
          loyalty_points_used: loyaltyPointsUsed,
          addons: selectedAddons,
        },
      )
      // Show loyalty toast before navigating
      if ((res.data.loyalty_points_used ?? 0) > 0) {
        setLoyaltyToast({
          points: res.data.loyalty_points_used,
          discount: res.data.loyalty_discount,
        })
        await new Promise(r => setTimeout(r, 1800))
      }
      navigate(`/voucher/${bookingId}`)
    } catch (err) {
      setError(err.response?.data?.detail || 'Payment failed. Please try again.')
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

  // grandTotal is what the user owes: booking base + add-ons - loyalty discount
  const baseTotal = (booking?.total_price || 0) + addonsTotal
  const grandTotal = Math.max(0, baseTotal - loyaltyDiscount)

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
              Add-ons for This Booking
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Pricing updates automatically by nights, guests, and quantity.
            </p>
            <AddonSelector
              listingId={booking?.listing_id}
              roomTypeId={booking?.room_type_id}
              checkIn={booking?.check_in}
              checkOut={booking?.check_out}
              guests={booking?.group_size || 1}
              onAddonsChange={handleAddonsChange}
            />
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
              Prototype demo — payment is simulated. No card details are required.
            </p>
          </div>

          {/* Demo mode note */}
          <div style={{
            marginBottom: 10, padding: '8px 14px',
            background: 'var(--bg-secondary)',
            border: '1px dashed var(--border-color)',
            borderRadius: 8, textAlign: 'center',
            fontSize: '0.72rem', color: 'var(--text-muted)',
          }}>
            Demo mode — no real payment will be processed. Click Pay to simulate a successful booking.
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
              loyaltyDiscount > 0
        ? `Pay PKR ${grandTotal.toLocaleString('en-PK')} (save ${loyaltyDiscount.toLocaleString('en-PK')})`
        : `Pay PKR ${grandTotal.toLocaleString('en-PK')}`
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
                  ...selectedAddons.map(a => ({
                    label: `${a.name}${(a.quantity || 1) > 1 ? ` x${a.quantity}` : ''}`,
                    value: a.total ?? a.price,
                  })),
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

                {/* Loyalty discount row */}
                {loyaltyDiscount > 0 && (
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    marginBottom: 6, fontSize: '0.85rem',
                  }}>
                    <span style={{ color: '#a16207' }}>
                      ⭐ {loyaltyPointsUsed.toLocaleString()} pts
                    </span>
                    <span style={{ fontWeight: 700, color: '#a16207' }}>
                      − PKR {loyaltyDiscount.toLocaleString('en-PK')}
                    </span>
                  </div>
                )}

                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '12px 0 0', borderTop: '2px solid var(--border-color)', marginTop: 6,
                }}>
                  <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>Total</span>
                  <span style={{ fontWeight: 800, color: 'var(--accent)', fontSize: '1.15rem' }}>
                    PKR {grandTotal.toLocaleString('en-PK')}
                  </span>
                </div>

                {/* Loyalty input — placed after the total so the discount
                    row above updates in real-time as the user applies points */}
                <div style={{ marginTop: 14 }}>
                  <LoyaltyInput
                    key={`checkout-loyalty-${baseTotal}`}
                    subtotal={baseTotal}
                    onPointsChange={handleLoyaltyChange}
                  />
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

      {/* Loyalty points success toast */}
      {loyaltyToast && (
        <Toast
          title={`You saved PKR ${loyaltyToast.discount.toLocaleString('en-PK')}!`}
          message={`${loyaltyToast.points.toLocaleString()} loyalty points redeemed on this booking.`}
          type="success"
          duration={5000}
          onClose={() => setLoyaltyToast(null)}
        />
      )}
    </div>
  )
}
