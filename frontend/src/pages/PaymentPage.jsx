import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import useWindowSize from '../hooks/useWindowSize'

export default function PaymentPage() {
  const { bookingId } = useParams()
  const navigate = useNavigate()
  const { isMobile } = useWindowSize()

  const [booking, setBooking]     = useState(null)
  const [loading, setLoading]     = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError]         = useState('')
  const [payMethod, setPayMethod] = useState('stripe')

  // Simulated card fields (used for jazzcash / easypaisa demo)
  const [phone, setPhone] = useState('')

  useEffect(() => {
    api.get('/bookings/me')
      .then(res => {
        const b = res.data.find(b => b.id === parseInt(bookingId))
        if (b) setBooking(b)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [bookingId])

  // ── Stripe Checkout ──────────────────────────────────────────────────────
  async function handleStripeCheckout() {
    setProcessing(true)
    setError('')
    try {
      const res = await api.post('/payments/stripe/create-session', {
        booking_id: parseInt(bookingId),
      })
      // Redirect to Stripe-hosted checkout page
      window.location.href = res.data.checkout_url
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to start Stripe checkout')
      setProcessing(false)
    }
  }

  // ── Simulated payment (JazzCash / EasyPaisa demo) ─────────────────────
  async function handleSimulatedPayment(e) {
    e.preventDefault()
    setError('')
    setProcessing(true)
    await new Promise(r => setTimeout(r, 1500))
    try {
      await api.post('/payments/process', {
        booking_id: parseInt(bookingId),
        payment_method: payMethod,
      })
      navigate(`/voucher/${bookingId}`)
    } catch (e) {
      setError(e.response?.data?.detail || 'Payment failed')
    } finally {
      setProcessing(false)
    }
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-primary)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'var(--text-secondary)',
    }}>
      Loading payment details...
    </div>
  )

  const amount     = booking?.total_price || 0
  const commission = Math.round(amount * 0.10)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingBottom: 48 }}>

      {/* ── Hero banner ─────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a5f 0%, #0ea5e9 100%)',
        padding: '32px 16px 80px',
      }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <button onClick={() => navigate(-1)} style={{
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: 'white', borderRadius: 8, padding: '7px 16px',
            cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
            marginBottom: 20,
          }}>
            ← Back
          </button>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 999, padding: '6px 16px',
            marginBottom: 16, fontSize: '0.8rem', fontWeight: 700, color: 'white',
          }}>
            🔒 Secure Payment
          </div>
          <h1 style={{ color: 'white', margin: '0 0 6px', fontSize: '1.7rem', fontWeight: 800 }}>
            Complete Payment
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', margin: 0, fontSize: '0.9rem' }}>
            Choose your preferred payment method
          </p>
        </div>
      </div>

      {/* ── Main grid ───────────────────────────────────────────────────── */}
      <div style={{
        maxWidth: 720, margin: '-48px auto 0', padding: '0 16px',
        display: isMobile ? 'flex' : 'grid',
        flexDirection: isMobile ? 'column-reverse' : undefined,
        gridTemplateColumns: isMobile ? undefined : '1fr 300px',
        gap: 20, alignItems: 'start',
      }}>

        {/* LEFT — Payment method */}
        <div>
          {/* Method tabs */}
          <div style={{
            background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)',
            padding: 24, marginBottom: 16,
          }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              💳 Payment Method
            </h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)',
              gap: 10, marginBottom: 24,
            }}>
              {[
                { key: 'stripe',    label: 'Stripe (Cards)',  icon: '💳' },
                { key: 'jazzcash',  label: 'JazzCash',        icon: '📱' },
                { key: 'easypaisa', label: 'EasyPaisa',       icon: '💚' },
              ].map(m => (
                <div
                  key={m.key}
                  onClick={() => setPayMethod(m.key)}
                  style={{
                    padding: '14px 10px', borderRadius: 10, textAlign: 'center',
                    border: payMethod === m.key
                      ? '2px solid var(--accent)' : '2px solid var(--border-color)',
                    background: payMethod === m.key
                      ? 'var(--accent-light)' : 'var(--bg-secondary)',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  <div style={{ fontSize: '1.5rem', marginBottom: 6 }}>{m.icon}</div>
                  <div style={{
                    fontSize: '0.72rem', fontWeight: 600,
                    color: payMethod === m.key ? 'var(--accent)' : 'var(--text-secondary)',
                  }}>
                    {m.label}
                  </div>
                </div>
              ))}
            </div>

            {/* ── Stripe panel ──────────────────────────────────────── */}
            {payMethod === 'stripe' && (
              <div style={{
                background: 'var(--bg-secondary)', borderRadius: 12,
                padding: 24, textAlign: 'center',
              }}>
                {/* Stripe logo row */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: 12, marginBottom: 16,
                }}>
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg"
                    alt="Stripe"
                    style={{ height: 28, filter: 'var(--stripe-logo-filter, none)' }}
                    onError={e => { e.target.style.display = 'none' }}
                  />
                </div>
                <p style={{ margin: '0 0 8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  You will be redirected to <strong>Stripe's secure checkout</strong> page to complete your payment.
                </p>
                <p style={{ margin: '0 0 20px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  Supports Visa, Mastercard, Amex & more.<br />
                  Test card: <code style={{ background: 'var(--bg-card)', padding: '2px 6px', borderRadius: 4 }}>4242 4242 4242 4242</code>
                </p>

                {/* Security badges */}
                <div style={{
                  display: 'flex', gap: 12, justifyContent: 'center',
                  flexWrap: 'wrap', marginBottom: 20,
                }}>
                  {['🔒 SSL Encrypted', '🛡️ PCI DSS', '✅ 3D Secure'].map(b => (
                    <span key={b} style={{
                      fontSize: '0.75rem', color: 'var(--text-muted)',
                      background: 'var(--bg-card)', padding: '4px 10px',
                      borderRadius: 999, border: '1px solid var(--border-color)',
                      fontWeight: 600,
                    }}>
                      {b}
                    </span>
                  ))}
                </div>

                {error && (
                  <div style={{
                    background: 'var(--danger-bg)', color: 'var(--danger)',
                    padding: '10px 14px', borderRadius: 8, marginBottom: 14,
                    fontSize: '0.85rem', fontWeight: 600,
                  }}>
                    ⚠️ {error}
                  </div>
                )}

                <button
                  onClick={handleStripeCheckout}
                  disabled={processing}
                  style={{
                    width: '100%', padding: '15px 20px', borderRadius: 12,
                    border: 'none', fontSize: '1rem', fontWeight: 800,
                    cursor: processing ? 'not-allowed' : 'pointer',
                    background: processing
                      ? '#9ca3af'
                      : 'linear-gradient(135deg, #635bff, #4f46e5)',
                    color: 'white', transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: 10,
                  }}
                >
                  {processing ? (
                    <><span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span> Redirecting to Stripe…</>
                  ) : (
                    <>
                      <span style={{ fontSize: '1.2rem' }}>💳</span>
                      Pay PKR {amount.toLocaleString('en-PK')} with Stripe
                    </>
                  )}
                </button>
              </div>
            )}

            {/* ── JazzCash / EasyPaisa panel ──────────────────────── */}
            {(payMethod === 'jazzcash' || payMethod === 'easypaisa') && (
              <form onSubmit={handleSimulatedPayment}>
                <div style={{
                  background: 'var(--bg-secondary)', borderRadius: 12,
                  padding: 24, textAlign: 'center',
                }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>
                    {payMethod === 'jazzcash' ? '📱' : '💚'}
                  </div>
                  <p style={{ margin: '0 0 14px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Enter your {payMethod === 'jazzcash' ? 'JazzCash' : 'EasyPaisa'} mobile number
                  </p>
                  <input
                    type="tel"
                    placeholder="03XX-XXXXXXX"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    required
                    style={{
                      width: '100%', padding: '12px 14px', borderRadius: 10,
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-card)', color: 'var(--text-primary)',
                      fontSize: '0.95rem', boxSizing: 'border-box',
                      outline: 'none', textAlign: 'center',
                      fontFamily: 'monospace', letterSpacing: '0.1em',
                    }}
                  />
                  <p style={{ margin: '10px 0 16px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    ⚠️ Demo mode — payment is simulated
                  </p>

                  {error && (
                    <div style={{
                      background: 'var(--danger-bg)', color: 'var(--danger)',
                      padding: '10px 14px', borderRadius: 8, marginBottom: 14,
                      fontSize: '0.85rem', fontWeight: 600,
                    }}>
                      ⚠️ {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={processing}
                    style={{
                      width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                      background: processing ? '#9ca3af' : 'linear-gradient(135deg, #16a34a, #15803d)',
                      color: 'white', fontWeight: 800, fontSize: '0.95rem',
                      cursor: processing ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {processing ? 'Processing…' : `Pay PKR ${amount.toLocaleString('en-PK')}`}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* RIGHT — Order summary */}
        <div style={{ position: 'sticky', top: 20 }}>
          <div style={{
            background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)',
            padding: 20,
          }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              📋 Order Summary
            </h3>

            {booking && (
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: 4 }}>
                  {booking.listing_title}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
                  📍 {booking.location}
                </div>

                {booking.room_type_name && (
                  <div style={{
                    display: 'inline-block', background: 'var(--accent-light)',
                    color: 'var(--accent)', padding: '2px 10px', borderRadius: 999,
                    fontSize: '0.78rem', fontWeight: 600, marginBottom: 12,
                  }}>
                    🛏️ {booking.room_type_name}
                  </div>
                )}

                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.8 }}>
                  <div>📅 {booking.check_in} → {booking.check_out}</div>
                </div>

                <div style={{ height: 1, background: 'var(--border-color)', margin: '12px 0' }} />

                {[
                  { label: 'Subtotal',         value: `PKR ${amount.toLocaleString('en-PK')}` },
                  { label: 'Platform fee (10%)', value: `PKR ${commission.toLocaleString('en-PK')}`, muted: true },
                ].map(row => (
                  <div key={row.label} style={{
                    display: 'flex', justifyContent: 'space-between',
                    marginBottom: 8, fontSize: '0.85rem',
                  }}>
                    <span style={{ color: row.muted ? 'var(--text-muted)' : 'var(--text-secondary)' }}>
                      {row.label}
                    </span>
                    <span style={{ color: row.muted ? 'var(--text-muted)' : 'var(--text-primary)', fontWeight: 600 }}>
                      {row.value}
                    </span>
                  </div>
                ))}

                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '12px 0', borderTop: '2px solid var(--border-color)', marginTop: 8,
                }}>
                  <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>Total</span>
                  <span style={{ fontWeight: 800, color: 'var(--accent)', fontSize: '1.2rem' }}>
                    PKR {amount.toLocaleString('en-PK')}
                  </span>
                </div>
              </div>
            )}

            <div style={{
              marginTop: 16, padding: '10px 14px',
              background: 'var(--bg-secondary)', borderRadius: 8,
              fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center',
            }}>
              🔒 Your payment is protected by 256-bit SSL encryption
            </div>
          </div>
        </div>

      </div>

      {/* Spin animation */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
