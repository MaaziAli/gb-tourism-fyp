/**
 * PaymentCancel — shown when user cancels on Stripe's checkout page.
 * URL: /payment/cancel?booking_id=42
 *
 * Booking stays pending so the user can retry payment.
 */
import { useNavigate, useSearchParams } from 'react-router-dom'

export default function PaymentCancel() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const bookingId = searchParams.get('booking_id')

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-primary)',
      display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)', overflow: 'hidden',
        maxWidth: 460, width: '100%',
      }}>
        {/* Orange header */}
        <div style={{
          background: 'linear-gradient(135deg,#d97706,#b45309)',
          padding: '40px 24px', textAlign: 'center',
        }}>
          <div style={{ fontSize: '4rem', marginBottom: 12 }}>⚠️</div>
          <h2 style={{ color: 'white', margin: '0 0 6px', fontSize: '1.6rem', fontWeight: 800 }}>
            Payment Cancelled
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0, fontSize: '0.9rem' }}>
            You cancelled the payment on Stripe. Your booking is still pending.
          </p>
        </div>

        <div style={{ padding: '28px 24px', textAlign: 'center' }}>
          <div style={{
            background: 'var(--bg-secondary)', borderRadius: 10,
            padding: '16px', marginBottom: 24,
            fontSize: '0.875rem', color: 'var(--text-secondary)',
            lineHeight: 1.7,
          }}>
            Your booking has <strong>not</strong> been cancelled — it is still in pending status.
            You can retry payment at any time from <strong>My Bookings</strong>.
          </div>

          <div style={{ display: 'flex', gap: 10, flexDirection: 'column' }}>
            {bookingId && (
              <button
                onClick={() => navigate(`/payment/${bookingId}`)}
                style={{
                  width: '100%', padding: 14, borderRadius: 10, border: 'none',
                  background: 'linear-gradient(135deg,#635bff,#4f46e5)',
                  color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem',
                }}
              >
                💳 Retry Payment
              </button>
            )}
            <button
              onClick={() => navigate('/my-bookings')}
              style={{
                width: '100%', padding: 14, borderRadius: 10,
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-secondary)', fontWeight: 600,
                cursor: 'pointer', fontSize: '0.9rem',
              }}
            >
              My Bookings
            </button>
            <button
              onClick={() => navigate('/')}
              style={{
                width: '100%', padding: 14, borderRadius: 10,
                border: '1px solid var(--border-color)',
                background: 'transparent',
                color: 'var(--text-muted)', fontWeight: 600,
                cursor: 'pointer', fontSize: '0.9rem',
              }}
            >
              Browse Hotels
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
