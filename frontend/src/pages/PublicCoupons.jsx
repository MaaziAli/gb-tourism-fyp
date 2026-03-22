import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

export default function PublicCoupons() {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/coupons/public')
      .then((r) => setCoupons(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  function copyCode(code) {
    navigator.clipboard.writeText(code)
      .catch(() => {})
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      paddingBottom: '48px',
    }}>

      <div style={{
        background:
          'linear-gradient(135deg, #f59e0b, #d97706)',
        padding: '48px 16px 80px',
        textAlign: 'center',
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center', gap: '8px',
          background: 'rgba(255,255,255,0.2)',
          borderRadius: '999px',
          padding: '7px 18px', marginBottom: '20px',
          fontSize: '0.82rem', fontWeight: 700,
          color: 'white',
        }}>
          🎟️ Live Deals
        </div>
        <h1 style={{
          color: 'white', margin: '0 0 10px',
          fontSize: '2.2rem', fontWeight: 800,
          letterSpacing: '-0.02em',
        }}>
          Coupons & Deals
        </h1>
        <p style={{
          color: 'rgba(255,255,255,0.8)',
          margin: 0, fontSize: '1rem',
        }}>
          Exclusive discounts on hotels, tours,
          events & more across GB
        </p>
      </div>

      <div style={{
        maxWidth: '900px',
        margin: '-48px auto 0',
        padding: '0 16px',
      }}>

        {loading && (
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            padding: '60px', textAlign: 'center',
            color: 'var(--text-secondary)',
          }}>
            Loading deals...
          </div>
        )}

        {!loading && coupons.length === 0 && (
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            padding: '60px 20px', textAlign: 'center',
          }}>
            <div style={{
              fontSize: '3rem', marginBottom: '12px',
            }}>
              🎟️
            </div>
            <h2 style={{
              margin: '0 0 8px',
              color: 'var(--text-primary)',
            }}>
              No active deals right now
            </h2>
            <p style={{
              color: 'var(--text-secondary)',
              margin: 0,
            }}>
              Check back soon for amazing discounts!
            </p>
          </div>
        )}

        {!loading && coupons.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '16px',
          }}>
            {coupons.map((c) => (
              <div key={c.id} style={{
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-color)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-sm)',
              }}>
                <div style={{
                  background:
                    'linear-gradient(135deg, #f59e0b22, #d9770622)',
                  borderBottom:
                    '2px dashed var(--border-color)',
                  padding: '20px', textAlign: 'center',
                }}>
                  <div style={{
                    fontSize: '1.8rem', fontWeight: 800,
                    color: '#d97706', fontFamily: 'monospace',
                    letterSpacing: '0.1em',
                    marginBottom: '4px',
                  }}>
                    {c.code}
                  </div>
                  <div style={{
                    fontSize: '1.5rem', fontWeight: 800,
                    color: '#f59e0b',
                  }}>
                    {c.discount_type === 'percentage'
                      ? `${c.discount_value}% OFF`
                      : `PKR ${c.discount_value
                          .toLocaleString('en-PK')
                        } OFF`
                    }
                  </div>
                </div>

                <div style={{ padding: '16px' }}>
                  <div style={{
                    fontWeight: 700, fontSize: '0.95rem',
                    color: 'var(--text-primary)',
                    marginBottom: '4px',
                  }}>
                    {c.title}
                  </div>
                  {c.description && (
                    <div style={{
                      fontSize: '0.8rem',
                      color: 'var(--text-secondary)',
                      marginBottom: '8px',
                    }}>
                      {c.description}
                    </div>
                  )}

                  <div style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    marginBottom: '12px',
                  }}>
                    {c.min_booking_amount > 0 && (
                      <div>
                        💰 Min PKR{' '}
                        {c.min_booking_amount
                          .toLocaleString('en-PK')}
                      </div>
                    )}
                    {c.max_uses && (
                      <div>
                        🎟️ {c.used_count}/
                        {c.max_uses} used
                      </div>
                    )}
                    {c.valid_until && (
                      <div>
                        📅 Valid until {c.valid_until}
                      </div>
                    )}
                  </div>

                  <div style={{
                    display: 'flex', gap: '8px',
                  }}>
                    <button
                      type="button"
                      onClick={() => copyCode(c.code)}
                      style={{
                        flex: 1, padding: '9px',
                        borderRadius: '8px',
                        border: '2px dashed #f59e0b',
                        background: copied === c.code
                          ? '#fef3c7' : 'transparent',
                        color: '#d97706',
                        fontWeight: 700, cursor: 'pointer',
                        fontFamily: 'monospace',
                        fontSize: '0.875rem',
                        transition: 'all 0.2s',
                      }}
                    >
                      {copied === c.code
                        ? '✅ Copied!'
                        : `📋 Copy ${c.code}`
                      }
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        navigate('/listings')
                      }
                      style={{
                        padding: '9px 14px',
                        borderRadius: '8px',
                        border: 'none',
                        background:
                          'linear-gradient(135deg, #f59e0b, #d97706)',
                        color: 'white', fontWeight: 700,
                        cursor: 'pointer',
                        fontSize: '0.82rem',
                      }}
                    >
                      Use →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
