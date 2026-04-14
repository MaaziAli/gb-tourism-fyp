/**
 * PaymentSuccess — shown after Stripe redirects back on successful payment.
 *
 * URL: /payment/success?session_id=cs_xxx&booking_id=42
 *
 * 1. Calls  GET /payments/stripe/verify?session_id=…&booking_id=…
 * 2. Backend confirms the Stripe session, marks booking confirmed + payment paid.
 * 3. Shows a success summary with booking details.
 */
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../api/axios'
import Toast from '../components/Toast'

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const sessionId = searchParams.get('session_id')
  const bookingId = searchParams.get('booking_id')

  const [status, setStatus]   = useState('verifying') // verifying | success | error
  const [data, setData]       = useState(null)
  const [errMsg, setErrMsg]   = useState('')
  const [loyaltyToast, setLoyaltyToast] = useState(null)

  useEffect(() => {
    if (!sessionId || !bookingId) {
      setStatus('error')
      setErrMsg('Missing session or booking information.')
      return
    }

    let isActive = true

    ;(async () => {
      try {
        const res = await api.get('/payments/stripe/verify', {
          params: { session_id: sessionId, booking_id: parseInt(bookingId) },
        })
        if (!isActive) return

        setData(res.data)
        setStatus('success')

        let pointsUsed = Number(res.data?.loyalty_points_used || 0)
        let loyaltyDiscount = Number(res.data?.loyalty_discount_applied || 0)

        // Fallback: if verify payload does not include loyalty fields,
        // fetch booking details and read them from the booking record.
        if (pointsUsed <= 0 || loyaltyDiscount <= 0) {
          const bookingsRes = await api.get('/bookings/me')
          if (!isActive) return
          const b = bookingsRes.data.find(
            item => item.id === Number(res.data?.booking_id || bookingId),
          )
          pointsUsed = Number(b?.loyalty_points_used || pointsUsed || 0)
          loyaltyDiscount = Number(
            b?.loyalty_discount_applied || loyaltyDiscount || 0,
          )
        }

        if (pointsUsed > 0 && loyaltyDiscount > 0) {
          setLoyaltyToast({
            points: pointsUsed,
            discount: loyaltyDiscount,
          })
        }
      } catch (err) {
        if (!isActive) return
        setErrMsg(
          err.response?.data?.detail ||
            'Could not verify payment. Please contact support.'
        )
        setStatus('error')
      }
    })()

    return () => {
      isActive = false
    }
  }, [sessionId, bookingId])

  // ── Verifying spinner ───────────────────────────────────────────────────
  if (status === 'verifying') {
    return (
      <div style={centerStyle}>
        <div style={{
          background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)', padding: '48px 32px',
          textAlign: 'center', maxWidth: 400,
        }}>
          <div style={{ fontSize: '3rem', marginBottom: 16, animation: 'spin 1.2s linear infinite', display: 'inline-block' }}>⏳</div>
          <h2 style={{ color: 'var(--text-primary)', margin: '0 0 8px' }}>Verifying Payment</h2>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            Please wait while we confirm your payment with Stripe…
          </p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // ── Error state ─────────────────────────────────────────────────────────
  if (status === 'error') {
    return (
      <div style={centerStyle}>
        <div style={{
          background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)', overflow: 'hidden',
          maxWidth: 460, width: '100%',
        }}>
          <div style={{ background: 'linear-gradient(135deg,#dc2626,#b91c1c)', padding: '40px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: 12 }}>❌</div>
            <h2 style={{ color: 'white', margin: '0 0 6px', fontWeight: 800 }}>Verification Failed</h2>
          </div>
          <div style={{ padding: '28px 24px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>{errMsg}</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => navigate('/my-bookings')} style={btnPrimary}>
                My Bookings
              </button>
              <button onClick={() => navigate('/')} style={btnSecondary}>
                Home
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Success state ────────────────────────────────────────────────────────
  const nights = (() => {
    if (!data?.check_in || !data?.check_out) return 1
    const ms = new Date(data.check_out) - new Date(data.check_in)
    return Math.max(1, Math.round(ms / 86400000))
  })()

  return (
    <div style={centerStyle}>
      <div style={{
        background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)',
        overflow: 'hidden', maxWidth: 500, width: '100%',
      }}>
        {/* Green header */}
        <div style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)', padding: '40px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: 12 }}>🎉</div>
          <h2 style={{ color: 'white', margin: '0 0 6px', fontSize: '1.6rem', fontWeight: 800 }}>
            Payment Successful!
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0, fontSize: '0.9rem' }}>
            Your booking is confirmed and paid
          </p>
        </div>

        <div style={{ padding: '28px 24px' }}>
          {/* Details card */}
          <div style={{
            background: 'var(--bg-secondary)', borderRadius: 10,
            padding: 16, marginBottom: 20,
          }}>
            {[
              { label: 'Hotel',       value: data?.listing_title },
              { label: 'Check-in',    value: data?.check_in },
              { label: 'Check-out',   value: data?.check_out },
              { label: 'Nights',      value: nights },
              { label: 'Amount Paid', value: `PKR ${(data?.amount || 0).toLocaleString('en-PK')}` },
              { label: 'Booking ID',  value: `#${data?.booking_id}` },
              { label: 'Stripe Ref',  value: data?.transaction_id?.slice(0, 20) + '…' },
            ].filter(r => r.value).map(row => (
              <div key={row.label} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '8px 0', borderBottom: '1px solid var(--border-color)',
                fontSize: '0.875rem',
              }}>
                <span style={{ color: 'var(--text-secondary)' }}>{row.label}</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          {/* Confirmation note */}
          <div style={{
            background: 'var(--bg-secondary)', borderRadius: 8,
            padding: '10px 14px', marginBottom: 20,
            fontSize: '0.8rem', color: 'var(--text-secondary)',
          }}>
            📧 A confirmation email has been sent by Stripe. You can also view your booking voucher below.
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => navigate(`/voucher/${data?.booking_id}`)}
              style={btnPrimary}
            >
              View Voucher
            </button>
            <button onClick={() => navigate('/my-bookings')} style={btnSecondary}>
              My Bookings
            </button>
          </div>
        </div>
      </div>
      {loyaltyToast && (
        <Toast
          title="⭐ Loyalty Points Used!"
          message={`You used ${loyaltyToast.points.toLocaleString()} points and saved PKR ${loyaltyToast.discount.toLocaleString('en-PK')}!`}
          type="success"
          duration={5000}
          onClose={() => setLoyaltyToast(null)}
        />
      )}
    </div>
  )
}

const centerStyle = {
  minHeight: '100vh',
  background: 'var(--bg-primary)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 20,
}

const btnPrimary = {
  flex: 1, padding: '12px', borderRadius: 10, border: 'none',
  background: 'linear-gradient(135deg,#1e3a5f,#0ea5e9)',
  color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem',
}

const btnSecondary = {
  flex: 1, padding: '12px', borderRadius: 10,
  border: '1px solid var(--border-color)',
  background: 'var(--bg-secondary)',
  color: 'var(--text-secondary)', fontWeight: 600,
  cursor: 'pointer', fontSize: '0.9rem',
}
