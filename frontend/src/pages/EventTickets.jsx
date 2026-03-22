import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import useWindowSize from '../hooks/useWindowSize'

function getCategoryColor(cat) {
  const colors = {
    'Music & Cultural Festival': '#7c3aed',
    'Polo & Horse Events': '#0369a1',
    'Guided Trek & Expedition': '#16a34a',
    'Art & Photography': '#d97706',
    'Local Festival & Fair': '#e11d48',
    'Sports Event': '#2563eb',
    'Food & Dining Event': '#f97316',
    'Community Gathering': '#0891b2',
    'Horse Riding & Adventure': '#92400e',
  }
  return colors[cat] || '#7c3aed'
}

export default function EventTickets() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isMobile } = useWindowSize()

  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)

  const [selectedTicket, setSelectedTicket] = useState(null)
  const [quantity, setQuantity] = useState(1)

  const [payMethod, setPayMethod] = useState('card')
  const [cardName, setCardName] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')

  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(null)

  useEffect(() => {
    api
      .get(`/events/${id}`)
      .then((r) => {
        setEvent(r.data)
        const first = r.data.ticket_types?.find((t) => t.available > 0)
        if (first) setSelectedTicket(first)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  function formatCard(val) {
    return val
      .replace(/\D/g, '')
      .slice(0, 16)
      .replace(/(.{4})/g, '$1 ')
      .trim()
  }

  function formatExpiry(val) {
    const c = val.replace(/\D/g, '').slice(0, 4)
    return c.length >= 2 ? c.slice(0, 2) + '/' + c.slice(2) : c
  }

  function formatDate(d) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-PK', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  function formatTime(t) {
    if (!t) return ''
    const [h, m] = t.split(':')
    const hour = parseInt(h, 10)
    return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`
  }

  const totalPrice = selectedTicket ? selectedTicket.price * quantity : 0
  const isFreeTicket = selectedTicket?.is_free || totalPrice === 0
  const commission = isFreeTicket ? 0 : Math.round(totalPrice * 0.1)
  const organizerGets = totalPrice - commission

  async function handleBook() {
    if (!selectedTicket) {
      setError('Please select a ticket type')
      return
    }

    if (!isFreeTicket) {
      if (payMethod === 'card') {
        if (!cardName.trim()) {
          setError('Enter cardholder name')
          return
        }
        const clean = cardNumber.replace(/\s/g, '')
        if (clean.length !== 16) {
          setError('Enter valid 16-digit card number')
          return
        }
        if (cardExpiry.length < 5) {
          setError('Enter valid expiry (MM/YY)')
          return
        }
        if (cardCvv.length < 3) {
          setError('Enter valid CVV')
          return
        }
      } else {
        if (!phoneNumber.trim()) {
          setError('Enter mobile number')
          return
        }
      }
    }

    setError('')
    setProcessing(true)
    await new Promise((r) => setTimeout(r, 1500))

    try {
      const res = await api.post('/ticket-bookings/book', {
        event_id: parseInt(id, 10),
        ticket_type_id: selectedTicket.id,
        quantity,
        payment_method: isFreeTicket ? 'free' : payMethod,
        card_number: payMethod === 'card' ? cardNumber : null,
        card_expiry: cardExpiry || null,
        card_cvv: cardCvv || null,
        card_name: cardName || null,
      })
      setSuccess(res.data)
    } catch (e) {
      console.error('Booking error:', e)
      console.error('Response:', e.response?.data)
      const detail = e.response?.data?.detail
      setError(
        (typeof detail === 'string' ? detail : null) ||
          (Array.isArray(detail)
            ? detail.map((x) => x?.msg || JSON.stringify(x)).join(', ')
            : null) ||
          e.message ||
          'Booking failed. Please try again.'
      )
    } finally {
      setProcessing(false)
    }
  }

  if (success) {
    const color = getCategoryColor(event?.category || '')
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--bg-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}
      >
        <div
          style={{
            maxWidth: '500px',
            width: '100%',
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-md)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              background: `linear-gradient(135deg, ${color}, ${color}cc)`,
              padding: '36px 24px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '3.5rem', marginBottom: '12px' }}>🎟️</div>
            <h2
              style={{
                color: 'white',
                margin: '0 0 6px',
                fontSize: '1.6rem',
                fontWeight: 800,
              }}
            >
              Tickets Confirmed!
            </h2>
            <p
              style={{
                color: 'rgba(255,255,255,0.85)',
                margin: 0,
                fontSize: '0.9rem',
              }}
            >
              Your booking is confirmed
            </p>
          </div>

          <div style={{ padding: '24px' }}>
            <div
              style={{
                textAlign: 'center',
                marginBottom: '20px',
              }}
            >
              <div
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--text-muted)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginBottom: '6px',
                }}
              >
                Booking Reference
              </div>
              <div
                style={{
                  fontFamily: 'monospace',
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  color,
                  letterSpacing: '0.1em',
                }}
              >
                {success.booking_ref}
              </div>
            </div>

            <div
              style={{
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                marginBottom: '20px',
              }}
            >
              {[
                { label: 'Event', value: success.event_title },
                { label: 'Date', value: formatDate(success.event_date) },
                { label: 'Time', value: formatTime(success.event_time) },
                { label: 'Venue', value: success.venue },
                { label: 'Ticket', value: `${success.quantity}x ${success.ticket_name}` },
                success.transaction_id && {
                  label: 'Transaction',
                  value: success.transaction_id,
                },
                success.card_last4 && {
                  label: 'Card',
                  value: '•••• ' + success.card_last4,
                },
              ]
                .filter(Boolean)
                .map((item) => (
                  <div
                    key={item.label}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '7px 0',
                      borderBottom: '1px solid var(--border-color)',
                      fontSize: '0.85rem',
                    }}
                  >
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {item.label}
                    </span>
                    <span
                      style={{
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                      }}
                    >
                      {item.value}
                    </span>
                  </div>
                ))}

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '10px 0 0',
                  fontSize: '1rem',
                }}
              >
                <span
                  style={{
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                  }}
                >
                  Total Paid
                </span>
                <span
                  style={{
                    fontWeight: 800,
                    color,
                    fontSize: '1.2rem',
                  }}
                >
                  {success.total_price === 0
                    ? 'FREE'
                    : `PKR ${success.total_price?.toLocaleString('en-PK')}`}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => navigate('/my-tickets')}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                  color: 'white',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                }}
              >
                🎟️ My Tickets
              </button>
              <button
                onClick={() => navigate('/events')}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-secondary)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                }}
              >
                More Events
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading)
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--bg-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-secondary)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🎟️</div>
          Loading tickets...
        </div>
      </div>
    )

  if (!event)
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--bg-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem' }}>😕</div>
          <p style={{ color: 'var(--text-secondary)' }}>Event not found</p>
          <button
            onClick={() => navigate('/events')}
            style={{
              background: '#7c3aed',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 20px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Back to Events
          </button>
        </div>
      </div>
    )

  const color = getCategoryColor(event.category)

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        paddingBottom: '48px',
      }}
    >
      <div
        style={{
          background: `linear-gradient(135deg, ${color}dd, ${color})`,
          padding: '32px 16px 80px',
        }}
      >
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <button
            onClick={() => navigate(`/events/${id}`)}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'white',
              borderRadius: '8px',
              padding: '7px 16px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600,
              marginBottom: '16px',
            }}
          >
            ← Back to Event
          </button>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '999px',
              padding: '6px 16px',
              marginBottom: '14px',
              color: 'white',
              fontSize: '0.8rem',
              fontWeight: 700,
            }}
          >
            🔒 Secure Ticket Booking
          </div>

          <h1
            style={{
              color: 'white',
              margin: '0 0 6px',
              fontSize: isMobile ? '1.3rem' : '1.7rem',
              fontWeight: 800,
            }}
          >
            🎟️ Get Tickets
          </h1>
          <p
            style={{
              color: 'rgba(255,255,255,0.8)',
              margin: 0,
              fontSize: '0.9rem',
            }}
          >
            {event.title}
          </p>
        </div>
      </div>

      <div
        style={{
          maxWidth: '760px',
          margin: '-56px auto 0',
          padding: '0 16px',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 300px',
          gap: '20px',
          alignItems: 'start',
        }}
      >
        <div>
          <div
            style={{
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-md)',
              padding: '24px',
              marginBottom: '16px',
            }}
          >
            <h3
              style={{
                margin: '0 0 16px',
                fontSize: '1rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
              }}
            >
              🎟️ Select Ticket Type
            </h3>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                marginBottom: '16px',
              }}
            >
              {event.ticket_types?.map((tt) => (
                <div
                  key={tt.id}
                  onClick={() => {
                    if (tt.available > 0) {
                      setSelectedTicket(tt)
                      setQuantity(1)
                    }
                  }}
                  style={{
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-md)',
                    border:
                      selectedTicket?.id === tt.id
                        ? `2px solid ${color}`
                        : '1px solid var(--border-color)',
                    background:
                      selectedTicket?.id === tt.id
                        ? color + '12'
                        : 'var(--bg-secondary)',
                    cursor: tt.available > 0 ? 'pointer' : 'not-allowed',
                    opacity: tt.available === 0 ? 0.5 : 1,
                    transition: 'all 0.15s',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: '0.925rem',
                          color:
                            selectedTicket?.id === tt.id
                              ? color
                              : 'var(--text-primary)',
                          marginBottom: '3px',
                        }}
                      >
                        {selectedTicket?.id === tt.id ? '✓ ' : ''}
                        {tt.name}
                        {tt.available === 0 && (
                          <span
                            style={{
                              marginLeft: '8px',
                              fontSize: '0.72rem',
                              color: '#dc2626',
                              fontWeight: 700,
                            }}
                          >
                            SOLD OUT
                          </span>
                        )}
                      </div>
                      {tt.description && (
                        <div
                          style={{
                            fontSize: '0.78rem',
                            color: 'var(--text-secondary)',
                            marginBottom: '3px',
                          }}
                        >
                          {tt.description}
                        </div>
                      )}
                      <div
                        style={{
                          fontSize: '0.72rem',
                          color: 'var(--text-muted)',
                        }}
                      >
                        {tt.available} available
                      </div>
                    </div>
                    <div
                      style={{
                        fontWeight: 800,
                        fontSize: '1.1rem',
                        color:
                          tt.is_free || tt.price === 0 ? '#16a34a' : color,
                        flexShrink: 0,
                      }}
                    >
                      {tt.is_free || tt.price === 0
                        ? 'FREE'
                        : `PKR ${tt.price?.toLocaleString('en-PK')}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {selectedTicket && (
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    marginBottom: '8px',
                  }}
                >
                  Number of Tickets
                </label>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: '1.2rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    −
                  </button>
                  <span
                    style={{
                      fontSize: '1.2rem',
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                      minWidth: '24px',
                      textAlign: 'center',
                    }}
                  >
                    {quantity}
                  </span>
                  <button
                    onClick={() =>
                      setQuantity((q) =>
                        Math.min(selectedTicket.available, q + 1)
                      )
                    }
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: '1.2rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    +
                  </button>
                  <span
                    style={{
                      fontSize: '0.82rem',
                      color: 'var(--text-muted)',
                    }}
                  >
                    max {selectedTicket.available}
                  </span>
                </div>
              </div>
            )}
          </div>

          {selectedTicket && !isFreeTicket && (
            <div
              style={{
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-md)',
                padding: '24px',
                marginBottom: '16px',
              }}
            >
              <h3
                style={{
                  margin: '0 0 16px',
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                }}
              >
                💳 Payment Method
              </h3>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '8px',
                  marginBottom: '20px',
                }}
              >
                {[
                  { key: 'card', icon: '💳', label: 'Card' },
                  { key: 'jazzcash', icon: '📱', label: 'JazzCash' },
                  { key: 'easypaisa', icon: '💚', label: 'EasyPaisa' },
                ].map((m) => (
                  <div
                    key={m.key}
                    onClick={() => setPayMethod(m.key)}
                    style={{
                      padding: '12px 8px',
                      borderRadius: '10px',
                      border:
                        payMethod === m.key
                          ? `2px solid ${color}`
                          : '1px solid var(--border-color)',
                      background:
                        payMethod === m.key
                          ? color + '12'
                          : 'var(--bg-secondary)',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ fontSize: '1.4rem', marginBottom: '4px' }}>
                      {m.icon}
                    </div>
                    <div
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        color:
                          payMethod === m.key
                            ? color
                            : 'var(--text-secondary)',
                      }}
                    >
                      {m.label}
                    </div>
                  </div>
                ))}
              </div>

              {payMethod === 'card' && (
                <div>
                  <div style={{ marginBottom: '12px' }}>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: 'var(--text-secondary)',
                        marginBottom: '6px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      placeholder="Name on card"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        fontSize: '0.9rem',
                        boxSizing: 'border-box',
                        outline: 'none',
                        fontFamily: 'var(--font-primary)',
                      }}
                    />
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: 'var(--text-secondary)',
                        marginBottom: '6px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Card Number
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        value={cardNumber}
                        onChange={(e) =>
                          setCardNumber(formatCard(e.target.value))
                        }
                        maxLength={19}
                        style={{
                          width: '100%',
                          padding: '11px 48px 11px 14px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-secondary)',
                          color: 'var(--text-primary)',
                          fontSize: '1rem',
                          letterSpacing: '0.1em',
                          boxSizing: 'border-box',
                          outline: 'none',
                          fontFamily: 'monospace',
                        }}
                      />
                      <span
                        style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          fontSize: '1.2rem',
                        }}
                      >
                        {cardNumber.startsWith('3')
                          ? '🟡'
                          : cardNumber.startsWith('4')
                            ? '🔵'
                            : cardNumber.startsWith('5')
                              ? '🔴'
                              : '💳'}
                      </span>
                    </div>
                    <p
                      style={{
                        margin: '5px 0 0',
                        fontSize: '0.72rem',
                        color: 'var(--text-muted)',
                      }}
                    >
                      Test: 4000 0000 0000 0002 to test decline
                    </p>
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          color: 'var(--text-secondary)',
                          marginBottom: '6px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        Expiry
                      </label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={(e) =>
                          setCardExpiry(formatExpiry(e.target.value))
                        }
                        maxLength={5}
                        style={{
                          width: '100%',
                          padding: '11px 14px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-secondary)',
                          color: 'var(--text-primary)',
                          fontSize: '0.95rem',
                          boxSizing: 'border-box',
                          outline: 'none',
                          fontFamily: 'monospace',
                        }}
                      />
                    </div>
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          color: 'var(--text-secondary)',
                          marginBottom: '6px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        CVV
                      </label>
                      <input
                        type="password"
                        placeholder="•••"
                        value={cardCvv}
                        onChange={(e) =>
                          setCardCvv(
                            e.target.value.replace(/\D/g, '').slice(0, 4)
                          )
                        }
                        maxLength={4}
                        style={{
                          width: '100%',
                          padding: '11px 14px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-secondary)',
                          color: 'var(--text-primary)',
                          fontSize: '0.95rem',
                          boxSizing: 'border-box',
                          outline: 'none',
                          fontFamily: 'monospace',
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {(payMethod === 'jazzcash' || payMethod === 'easypaisa') && (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '16px',
                    background: 'var(--bg-secondary)',
                    borderRadius: '10px',
                  }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: '8px' }}>
                    {payMethod === 'jazzcash' ? '📱' : '💚'}
                  </div>
                  <p
                    style={{
                      margin: '0 0 12px',
                      color: 'var(--text-secondary)',
                      fontSize: '0.875rem',
                    }}
                  >
                    Enter your{' '}
                    {payMethod === 'jazzcash' ? 'JazzCash' : 'EasyPaisa'} number
                  </p>
                  <input
                    type="tel"
                    placeholder="03XX-XXXXXXX"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      fontSize: '0.95rem',
                      boxSizing: 'border-box',
                      outline: 'none',
                      textAlign: 'center',
                      fontFamily: 'monospace',
                      letterSpacing: '0.1em',
                    }}
                  />
                </div>
              )}
            </div>
          )}

          <div
            style={{
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              padding: '14px 18px',
              display: 'flex',
              gap: '16px',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            {['🔒 SSL Secure', '✅ Instant Confirm', '💯 Safe Checkout'].map(
              (b) => (
                <span
                  key={b}
                  style={{
                    fontSize: '0.78rem',
                    color: 'var(--text-muted)',
                    fontWeight: 600,
                  }}
                >
                  {b}
                </span>
              )
            )}
          </div>
        </div>

        <div
          style={{
            position: isMobile ? 'relative' : 'sticky',
            top: '20px',
            order: isMobile ? -1 : 0,
          }}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-md)',
              padding: '20px',
            }}
          >
            <h3
              style={{
                margin: '0 0 16px',
                fontSize: '0.95rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
              }}
            >
              📋 Order Summary
            </h3>

            <div
              style={{
                marginBottom: '14px',
                paddingBottom: '14px',
                borderBottom: '1px solid var(--border-color)',
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  color: 'var(--text-primary)',
                  marginBottom: '4px',
                }}
              >
                {event.title}
              </div>
              <div
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.7,
                }}
              >
                <div>📅 {formatDate(event.event_date)}</div>
                <div>🕐 {formatTime(event.event_time)}</div>
                <div>📍 {event.venue}</div>
              </div>
            </div>

            {selectedTicket ? (
              <div style={{ marginBottom: '14px' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.85rem',
                    marginBottom: '6px',
                  }}
                >
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {selectedTicket.name} × {quantity}
                  </span>
                  <span
                    style={{
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                    }}
                  >
                    {isFreeTicket
                      ? 'FREE'
                      : `PKR ${(selectedTicket.price * quantity).toLocaleString('en-PK')}`}
                  </span>
                </div>

                {!isFreeTicket && (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.78rem',
                      marginBottom: '6px',
                    }}
                  >
                    <span style={{ color: 'var(--text-muted)' }}>
                      Platform fee (10%)
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      PKR {commission.toLocaleString('en-PK')}
                    </span>
                  </div>
                )}

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '10px 0',
                    borderTop: '2px solid var(--border-color)',
                    marginTop: '6px',
                  }}
                >
                  <span
                    style={{
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                    }}
                  >
                    Total
                  </span>
                  <span
                    style={{
                      fontWeight: 800,
                      color,
                      fontSize: '1.2rem',
                    }}
                  >
                    {isFreeTicket
                      ? 'FREE'
                      : `PKR ${totalPrice.toLocaleString('en-PK')}`}
                  </span>
                </div>
              </div>
            ) : (
              <div
                style={{
                  textAlign: 'center',
                  padding: '16px',
                  color: 'var(--text-muted)',
                  fontSize: '0.875rem',
                  marginBottom: '14px',
                }}
              >
                Select a ticket type above
              </div>
            )}

            {error && (
              <div
                style={{
                  background: 'var(--danger-bg)',
                  color: 'var(--danger)',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  marginBottom: '12px',
                }}
              >
                ⚠️ {error}
              </div>
            )}

            <button
              onClick={handleBook}
              disabled={processing || !selectedTicket}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                border: 'none',
                background: !selectedTicket
                  ? 'var(--border-color)'
                  : isFreeTicket
                    ? 'linear-gradient(135deg, #16a34a, #15803d)'
                    : `linear-gradient(135deg, ${color}, ${color}cc)`,
                color: !selectedTicket ? 'var(--text-muted)' : 'white',
                fontWeight: 800,
                fontSize: '1rem',
                cursor: !selectedTicket ? 'not-allowed' : 'pointer',
                opacity: processing ? 0.75 : 1,
                transition: 'all 0.2s',
              }}
            >
              {processing
                ? '⏳ Processing...'
                : isFreeTicket
                  ? '🎟️ Get Free Tickets'
                  : `🔒 Pay PKR ${totalPrice.toLocaleString('en-PK')}`}
            </button>

            <p
              style={{
                textAlign: 'center',
                margin: '8px 0 0',
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
              }}
            >
              {isFreeTicket
                ? '🎟️ No payment needed'
                : '✅ Secure payment · Instant confirm'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
