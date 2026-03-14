import { useState, useEffect } from 'react'
import { useParams, useNavigate,
         useSearchParams } from 'react-router-dom'
import api from '../api/axios'

export default function PaymentPage() {
  const { bookingId } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState(null)
  const [error, setError] = useState('')
  const [payMethod, setPayMethod] = useState('card')

  // Card fields
  const [cardName, setCardName] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')

  useEffect(() => {
    // Fetch booking details from my bookings
    api.get('/bookings/me').then(res => {
      const b = res.data.find(
        b => b.id === parseInt(bookingId)
      )
      if (b) setBooking(b)
    }).catch(console.error)
    .finally(() => setLoading(false))
  }, [bookingId])

  function formatCard(val) {
    const clean = val.replace(/\D/g, '').slice(0, 16)
    return clean.replace(/(.{4})/g, '$1 ').trim()
  }

  function formatExpiry(val) {
    const clean = val.replace(/\D/g, '').slice(0, 4)
    if (clean.length >= 2) {
      return clean.slice(0,2) + '/' + clean.slice(2)
    }
    return clean
  }

  async function handlePayment(e) {
    e.preventDefault()
    setError('')

    if (payMethod === 'card') {
      if (!cardName.trim()) {
        setError('Please enter cardholder name')
        return
      }
      const cleanCard = cardNumber.replace(/\s/g, '')
      if (cleanCard.length !== 16) {
        setError('Please enter a valid 16-digit card number')
        return
      }
      if (cardExpiry.length < 5) {
        setError('Please enter valid expiry date (MM/YY)')
        return
      }
      if (cardCvv.length < 3) {
        setError('Please enter valid CVV')
        return
      }
    }

    setProcessing(true)

    // Simulate processing delay
    await new Promise(r => setTimeout(r, 2000))

    try {
      const res = await api.post('/payments/process', {
        booking_id: parseInt(bookingId),
        payment_method: payMethod,
        card_number: payMethod === 'card'
          ? cardNumber : null,
        card_expiry: cardExpiry,
        card_cvv: cardCvv,
        card_name: cardName
      })
      setSuccess(res.data)
    } catch(e) {
      setError(
        e.response?.data?.detail || 'Payment failed'
      )
    } finally {
      setProcessing(false)
    }
  }

  // SUCCESS SCREEN
  if (success) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: '20px'
      }}>
        <div style={{
          maxWidth: '460px', width: '100%',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-md)',
          overflow: 'hidden', textAlign: 'center'
        }}>
          <div style={{
            background:
              'linear-gradient(135deg, #16a34a, #15803d)',
            padding: '40px 24px'
          }}>
            <div style={{
              fontSize: '4rem', marginBottom: '12px'
            }}>✅</div>
            <h2 style={{
              color: 'white', margin: '0 0 6px',
              fontSize: '1.6rem', fontWeight: 800
            }}>
              Payment Successful!
            </h2>
            <p style={{
              color: 'rgba(255,255,255,0.8)',
              margin: 0, fontSize: '0.9rem'
            }}>
              Your booking is confirmed & paid
            </p>
          </div>

          <div style={{padding: '28px 24px'}}>
            {/* Transaction details */}
            <div style={{
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              padding: '16px', marginBottom: '20px',
              textAlign: 'left'
            }}>
              {[
                {
                  label: 'Transaction ID',
                  value: success.transaction_id
                },
                {
                  label: 'Amount Paid',
                  value: 'PKR ' +
                    success.amount?.toLocaleString('en-PK')
                },
                {
                  label: 'Platform Fee (10%)',
                  value: 'PKR ' +
                    success.platform_commission
                      ?.toLocaleString('en-PK')
                },
                {
                  label: 'Provider Receives',
                  value: 'PKR ' +
                    success.provider_amount
                      ?.toLocaleString('en-PK')
                },
                success.card_last4 && {
                  label: 'Card',
                  value: '•••• •••• •••• '
                    + success.card_last4
                },
              ].filter(Boolean).map(item => (
                <div key={item.label} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 0',
                  borderBottom:
                    '1px solid var(--border-color)',
                  fontSize: '0.875rem'
                }}>
                  <span style={{
                    color: 'var(--text-secondary)'
                  }}>
                    {item.label}
                  </span>
                  <span style={{
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    fontFamily: 'monospace'
                  }}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>

            <div style={{
              display: 'flex', gap: '10px'
            }}>
              <button
                onClick={() => navigate('/my-bookings')}
                style={{
                  flex: 1, padding: '12px',
                  borderRadius: '10px', border: 'none',
                  background:
                    'linear-gradient(135deg, #1e3a5f, #0ea5e9)',
                  color: 'white', fontWeight: 700,
                  cursor: 'pointer', fontSize: '0.9rem'
                }}
              >
                My Bookings
              </button>
              <button
                onClick={() => navigate('/')}
                style={{
                  flex: 1, padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-secondary)',
                  fontWeight: 600, cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Explore More
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      display: 'flex', alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--text-secondary)'
    }}>
      Loading payment details...
    </div>
  )

  const amount = booking?.total_price || 0
  const commission = Math.round(amount * 0.10)
  const provider = amount - commission

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      paddingBottom: '48px'
    }}>

      {/* Header */}
      <div style={{
        background:
          'linear-gradient(135deg, #1e3a5f 0%, #0ea5e9 100%)',
        padding: '32px 16px 80px'
      }}>
        <div style={{maxWidth: '720px', margin: '0 auto'}}>
          <button onClick={() => navigate(-1)} style={{
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: 'white', borderRadius: '8px',
            padding: '7px 16px', cursor: 'pointer',
            fontSize: '0.85rem', fontWeight: 600,
            marginBottom: '20px',
            display: 'flex', alignItems: 'center',
            gap: '6px'
          }}>
            ← Back
          </button>

          {/* Secure badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center',
            gap: '8px',
            background: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '999px',
            padding: '6px 16px', marginBottom: '16px',
            fontSize: '0.8rem', fontWeight: 700,
            color: 'white'
          }}>
            🔒 Secure Payment
          </div>

          <h1 style={{
            color: 'white', margin: '0 0 6px',
            fontSize: '1.7rem', fontWeight: 800
          }}>
            Complete Payment
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.75)',
            margin: 0, fontSize: '0.9rem'
          }}>
            Your payment is encrypted and secure
          </p>
        </div>
      </div>

      {/* Main grid */}
      <div style={{
        maxWidth: '720px',
        margin: '-48px auto 0',
        padding: '0 16px',
        display: 'grid',
        gridTemplateColumns: '1fr 300px',
        gap: '20px', alignItems: 'start'
      }}>

        {/* LEFT — Payment form */}
        <div>
          {/* Payment method selector */}
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-md)',
            padding: '24px', marginBottom: '16px'
          }}>
            <h3 style={{
              margin: '0 0 16px', fontSize: '1rem',
              fontWeight: 700, color: 'var(--text-primary)'
            }}>
              💳 Payment Method
            </h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '10px', marginBottom: '20px'
            }}>
              {[
                { key: 'card', label: 'Debit/Credit Card',
                  icon: '💳' },
                { key: 'jazzcash', label: 'JazzCash',
                  icon: '📱' },
                { key: 'easypaisa', label: 'EasyPaisa',
                  icon: '💚' },
              ].map(m => (
                <div key={m.key}
                  onClick={() => setPayMethod(m.key)}
                  style={{
                    padding: '14px 10px',
                    borderRadius: '10px', textAlign: 'center',
                    border: payMethod === m.key
                      ? '2px solid var(--accent)'
                      : '2px solid var(--border-color)',
                    background: payMethod === m.key
                      ? 'var(--accent-light)'
                      : 'var(--bg-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{
                    fontSize: '1.5rem', marginBottom: '6px'
                  }}>
                    {m.icon}
                  </div>
                  <div style={{
                    fontSize: '0.72rem', fontWeight: 600,
                    color: payMethod === m.key
                      ? 'var(--accent)'
                      : 'var(--text-secondary)'
                  }}>
                    {m.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Card form */}
            {payMethod === 'card' && (
              <div>
                <div style={{marginBottom: '14px'}}>
                  <label style={{
                    display: 'block', fontSize: '0.8rem',
                    fontWeight: 700,
                    color: 'var(--text-secondary)',
                    marginBottom: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    placeholder="Name on card"
                    value={cardName}
                    onChange={e =>
                      setCardName(e.target.value)
                    }
                    style={{
                      width: '100%', padding: '12px 14px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.95rem',
                      boxSizing: 'border-box',
                      outline: 'none',
                      fontFamily: 'var(--font-primary)'
                    }}
                  />
                </div>

                <div style={{marginBottom: '14px'}}>
                  <label style={{
                    display: 'block', fontSize: '0.8rem',
                    fontWeight: 700,
                    color: 'var(--text-secondary)',
                    marginBottom: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Card Number
                  </label>
                  <div style={{position: 'relative'}}>
                    <input
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChange={e =>
                        setCardNumber(
                          formatCard(e.target.value)
                        )
                      }
                      maxLength={19}
                      style={{
                        width: '100%',
                        padding: '12px 50px 12px 14px',
                        borderRadius: '10px',
                        border:
                          '1px solid var(--border-color)',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        fontSize: '1rem',
                        letterSpacing: '0.1em',
                        boxSizing: 'border-box',
                        outline: 'none',
                        fontFamily: 'monospace'
                      }}
                    />
                    <span style={{
                      position: 'absolute', right: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '1.2rem'
                    }}>
                      {cardNumber.startsWith('3')
                        ? '🟡'
                        : cardNumber.startsWith('4')
                        ? '🔵'
                        : cardNumber.startsWith('5')
                        ? '🔴'
                        : '💳'
                      }
                    </span>
                  </div>
                  <p style={{
                    margin: '6px 0 0', fontSize: '0.72rem',
                    color: 'var(--text-muted)'
                  }}>
                    Use 4000 0000 0000 0002 to test decline
                  </p>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '14px'
                }}>
                  <div>
                    <label style={{
                      display: 'block', fontSize: '0.8rem',
                      fontWeight: 700,
                      color: 'var(--text-secondary)',
                      marginBottom: '8px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      value={cardExpiry}
                      onChange={e =>
                        setCardExpiry(
                          formatExpiry(e.target.value)
                        )
                      }
                      maxLength={5}
                      style={{
                        width: '100%', padding: '12px 14px',
                        borderRadius: '10px',
                        border:
                          '1px solid var(--border-color)',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        fontSize: '0.95rem',
                        boxSizing: 'border-box',
                        outline: 'none',
                        fontFamily: 'monospace'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{
                      display: 'block', fontSize: '0.8rem',
                      fontWeight: 700,
                      color: 'var(--text-secondary)',
                      marginBottom: '8px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      CVV
                    </label>
                    <input
                      type="password"
                      placeholder="•••"
                      value={cardCvv}
                      onChange={e =>
                        setCardCvv(
                          e.target.value
                            .replace(/\D/g,'')
                            .slice(0,4)
                        )
                      }
                      maxLength={4}
                      style={{
                        width: '100%', padding: '12px 14px',
                        borderRadius: '10px',
                        border:
                          '1px solid var(--border-color)',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        fontSize: '0.95rem',
                        boxSizing: 'border-box',
                        outline: 'none',
                        fontFamily: 'monospace'
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* JazzCash form */}
            {payMethod === 'jazzcash' && (
              <div style={{
                padding: '20px',
                background: 'var(--bg-secondary)',
                borderRadius: '10px',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '2.5rem', marginBottom: '10px'
                }}>
                  📱
                </div>
                <p style={{
                  margin: '0 0 14px',
                  color: 'var(--text-secondary)',
                  fontSize: '0.9rem'
                }}>
                  Enter your JazzCash mobile number
                </p>
                <input
                  type="tel"
                  placeholder="03XX-XXXXXXX"
                  style={{
                    width: '100%', padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    fontSize: '0.95rem',
                    boxSizing: 'border-box',
                    outline: 'none', textAlign: 'center',
                    fontFamily: 'monospace',
                    letterSpacing: '0.1em'
                  }}
                />
                <p style={{
                  margin: '10px 0 0', fontSize: '0.75rem',
                  color: 'var(--text-muted)'
                }}>
                  You will receive a confirmation SMS
                </p>
              </div>
            )}

            {/* EasyPaisa form */}
            {payMethod === 'easypaisa' && (
              <div style={{
                padding: '20px',
                background: 'var(--bg-secondary)',
                borderRadius: '10px',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '2.5rem', marginBottom: '10px'
                }}>
                  💚
                </div>
                <p style={{
                  margin: '0 0 14px',
                  color: 'var(--text-secondary)',
                  fontSize: '0.9rem'
                }}>
                  Enter your EasyPaisa mobile number
                </p>
                <input
                  type="tel"
                  placeholder="03XX-XXXXXXX"
                  style={{
                    width: '100%', padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    fontSize: '0.95rem',
                    boxSizing: 'border-box',
                    outline: 'none', textAlign: 'center',
                    fontFamily: 'monospace',
                    letterSpacing: '0.1em'
                  }}
                />
                <p style={{
                  margin: '10px 0 0', fontSize: '0.75rem',
                  color: 'var(--text-muted)'
                }}>
                  You will receive a confirmation SMS
                </p>
              </div>
            )}
          </div>

          {/* Security badges */}
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            padding: '16px 20px',
            display: 'flex', gap: '20px',
            flexWrap: 'wrap', justifyContent: 'center'
          }}>
            {[
              '🔒 SSL Encrypted',
              '🛡️ Secure Checkout',
              '✅ PCI Compliant',
            ].map(b => (
              <span key={b} style={{
                fontSize: '0.78rem',
                color: 'var(--text-muted)',
                fontWeight: 600
              }}>
                {b}
              </span>
            ))}
          </div>
        </div>

        {/* RIGHT — Order summary */}
        <div style={{position: 'sticky', top: '20px'}}>
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-md)',
            padding: '20px'
          }}>
            <h3 style={{
              margin: '0 0 16px', fontSize: '0.95rem',
              fontWeight: 700, color: 'var(--text-primary)'
            }}>
              📋 Order Summary
            </h3>

            {booking && (
              <div>
                <div style={{
                  fontWeight: 700, fontSize: '0.95rem',
                  color: 'var(--text-primary)',
                  marginBottom: '4px'
                }}>
                  {booking.listing_title}
                </div>
                <div style={{
                  fontSize: '0.82rem',
                  color: 'var(--text-secondary)',
                  marginBottom: '12px'
                }}>
                  📍 {booking.location}
                </div>

                {booking.room_type_name && (
                  <div style={{
                    display: 'inline-block',
                    background: 'var(--accent-light)',
                    color: 'var(--accent)',
                    padding: '2px 10px',
                    borderRadius: '999px',
                    fontSize: '0.78rem', fontWeight: 600,
                    marginBottom: '12px'
                  }}>
                    🛏️ {booking.room_type_name}
                  </div>
                )}

                <div style={{
                  fontSize: '0.82rem',
                  color: 'var(--text-secondary)',
                  marginBottom: '16px',
                  lineHeight: 1.8
                }}>
                  <div>
                    📅 {booking.check_in} →
                    {booking.check_out}
                  </div>
                </div>

                <div style={{
                  height: '1px',
                  background: 'var(--border-color)',
                  margin: '12px 0'
                }} />

                {[
                  {
                    label: 'Subtotal',
                    value: 'PKR ' +
                      amount.toLocaleString('en-PK')
                  },
                  {
                    label: 'Platform fee (10%)',
                    value: 'PKR ' +
                      commission.toLocaleString('en-PK'),
                    muted: true
                  },
                ].map(row => (
                  <div key={row.label} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                    fontSize: '0.85rem'
                  }}>
                    <span style={{
                      color: row.muted
                        ? 'var(--text-muted)'
                        : 'var(--text-secondary)'
                    }}>
                      {row.label}
                    </span>
                    <span style={{
                      color: row.muted
                        ? 'var(--text-muted)'
                        : 'var(--text-primary)',
                      fontWeight: 600
                    }}>
                      {row.value}
                    </span>
                  </div>
                ))}

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '12px 0',
                  borderTop: '2px solid var(--border-color)',
                  marginTop: '8px'
                }}>
                  <span style={{
                    fontWeight: 800,
                    color: 'var(--text-primary)'
                  }}>
                    Total
                  </span>
                  <span style={{
                    fontWeight: 800,
                    color: 'var(--accent)',
                    fontSize: '1.2rem'
                  }}>
                    PKR {amount.toLocaleString('en-PK')}
                  </span>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{
                background: 'var(--danger-bg)',
                color: 'var(--danger)',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '0.85rem', fontWeight: 600,
                marginBottom: '14px'
              }}>
                ⚠️ {error}
              </div>
            )}

            {/* Pay button */}
            <button
              onClick={handlePayment}
              disabled={processing}
              style={{
                width: '100%', padding: '15px',
                borderRadius: '12px', border: 'none',
                background:
                  'linear-gradient(135deg, #16a34a, #15803d)',
                color: 'white', fontWeight: 800,
                fontSize: '1rem', cursor: 'pointer',
                opacity: processing ? 0.8 : 1,
                marginTop: '4px',
                transition: 'opacity 0.2s',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '8px'
              }}
            >
              {processing ? (
                <>
                  <span style={{
                    display: 'inline-block',
                    animation: 'spin 1s linear infinite'
                  }}>⏳</span>
                  Processing Payment...
                </>
              ) : (
                <>
                  🔒 Pay PKR{' '}
                  {amount.toLocaleString('en-PK')}
                </>
              )}
            </button>

            <p style={{
              textAlign: 'center',
              margin: '10px 0 0',
              fontSize: '0.72rem',
              color: 'var(--text-muted)'
            }}>
              By paying you agree to our terms of service
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
