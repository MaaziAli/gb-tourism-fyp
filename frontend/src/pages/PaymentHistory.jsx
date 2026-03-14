import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

export default function PaymentHistory() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/payments/my-spending')
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  function formatDate(d) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-PK', {
      day: 'numeric', month: 'short', year: 'numeric'
    })
  }

  function methodIcon(m) {
    if (m === 'jazzcash') return '📱'
    if (m === 'easypaisa') return '💚'
    return '💳'
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      paddingBottom: '48px'
    }}>
      {/* Header */}
      <div style={{
        background:
          'linear-gradient(135deg, #16a34a 0%, #0ea5e9 100%)',
        padding: '40px 16px 80px'
      }}>
        <div style={{
          maxWidth: '800px', margin: '0 auto'
        }}>
          <button onClick={() => navigate(-1)} style={{
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: 'white', borderRadius: '8px',
            padding: '7px 16px', cursor: 'pointer',
            fontSize: '0.85rem', fontWeight: 600,
            marginBottom: '20px'
          }}>← Back</button>
          <h1 style={{
            color: 'white', margin: '0 0 6px',
            fontSize: '1.8rem', fontWeight: 800
          }}>
            💳 My Spending
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.75)',
            margin: '0 0 24px', fontSize: '0.9rem'
          }}>
            Your complete payment history
          </p>
          {data && (
            <div style={{
              display: 'inline-flex',
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '12px', overflow: 'hidden'
            }}>
              {[
                {
                  label: 'Total Spent',
                  value: 'PKR ' +
                    data.total_spent?.toLocaleString('en-PK')
                },
                {
                  label: 'Transactions',
                  value: data.payments?.length
                },
              ].map((s, i, arr) => (
                <div key={s.label} style={{
                  padding: '14px 24px',
                  textAlign: 'center',
                  borderRight: i < arr.length - 1
                    ? '1px solid rgba(255,255,255,0.12)'
                    : 'none'
                }}>
                  <div style={{
                    fontSize: '1.3rem', fontWeight: 800,
                    color: 'white'
                  }}>
                    {s.value}
                  </div>
                  <div style={{
                    fontSize: '0.72rem',
                    color: 'rgba(255,255,255,0.6)',
                    marginTop: '3px'
                  }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{
        maxWidth: '800px',
        margin: '-48px auto 0',
        padding: '0 16px'
      }}>
        {loading && (
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            padding: '60px', textAlign: 'center',
            color: 'var(--text-secondary)'
          }}>
            Loading payment history...
          </div>
        )}

        {!loading && data?.payments?.length === 0 && (
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            padding: '60px', textAlign: 'center'
          }}>
            <div style={{fontSize: '3rem', marginBottom: '12px'}}>💳</div>
            <h2 style={{
              margin: '0 0 8px',
              color: 'var(--text-primary)'
            }}>
              No payments yet
            </h2>
            <p style={{
              color: 'var(--text-secondary)', margin: 0
            }}>
              Your payment history will appear here
            </p>
          </div>
        )}

        {!loading && data?.payments?.length > 0 && (
          <div style={{
            display: 'flex', flexDirection: 'column',
            gap: '12px'
          }}>
            {data.payments.map(p => (
              <div key={p.id} style={{
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-sm)',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '3px',
                  background:
                    'linear-gradient(90deg, #16a34a, #0ea5e9)'
                }} />
                <div style={{
                  padding: '16px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap', gap: '12px'
                }}>
                  <div style={{flex: 1}}>
                    <div style={{
                      fontWeight: 700, fontSize: '0.95rem',
                      color: 'var(--text-primary)',
                      marginBottom: '4px'
                    }}>
                      {p.listing_title}
                    </div>
                    <div style={{
                      fontSize: '0.82rem',
                      color: 'var(--text-secondary)',
                      marginBottom: '6px'
                    }}>
                      📍 {p.location}
                    </div>
                    <div style={{
                      fontSize: '0.78rem',
                      color: 'var(--text-muted)',
                      display: 'flex', gap: '12px',
                      flexWrap: 'wrap'
                    }}>
                      <span>
                        📅 {formatDate(p.check_in)} →
                        {formatDate(p.check_out)}
                      </span>
                      <span>
                        {methodIcon(p.payment_method)}{' '}
                        {p.payment_method === 'card'
                          ? '•••• ' + p.card_last4
                          : p.payment_method
                        }
                      </span>
                    </div>
                  </div>
                  <div style={{textAlign: 'right'}}>
                    <div style={{
                      fontSize: '1.2rem', fontWeight: 800,
                      color: 'var(--accent)',
                      marginBottom: '4px'
                    }}>
                      PKR {p.amount?.toLocaleString('en-PK')}
                    </div>
                    <div style={{
                      fontSize: '0.72rem',
                      color: 'var(--text-muted)',
                      marginBottom: '4px'
                    }}>
                      {formatDate(p.created_at)}
                    </div>
                    <div style={{
                      fontSize: '0.7rem',
                      color: 'var(--text-muted)',
                      fontFamily: 'monospace'
                    }}>
                      {p.transaction_id}
                    </div>
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
