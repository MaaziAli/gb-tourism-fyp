import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

export default function ProviderPayments() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/payments/provider-received')
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

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      paddingBottom: '48px'
    }}>
      {/* Header */}
      <div style={{
        background:
          'linear-gradient(135deg, #0369a1 0%, #0ea5e9 100%)',
        padding: '40px 16px 80px'
      }}>
        <div style={{
          maxWidth: '900px', margin: '0 auto'
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
            💰 Payments Received
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.75)',
            margin: '0 0 24px', fontSize: '0.9rem'
          }}>
            Payments are released after guest check-in
          </p>

          {/* Info banner */}
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '10px',
            padding: '12px 16px',
            fontSize: '0.82rem',
            color: 'rgba(255,255,255,0.85)',
            marginBottom: '20px',
            display: 'flex', gap: '8px',
            alignItems: 'flex-start'
          }}>
            <span>ℹ️</span>
            <span>
              GB Tourism takes a 10% platform fee from
              each booking. The remaining 90% is your
              earnings, released after the guest checks in.
            </span>
          </div>

          {data && (
            <div style={{
              display: 'inline-flex',
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '12px', overflow: 'hidden'
            }}>
              {[
                {
                  label: 'You Received',
                  value: 'PKR ' +
                    data.total_received?.toLocaleString(
                      'en-PK'
                    )
                },
                {
                  label: 'Platform Fees',
                  value: 'PKR ' +
                    data.total_platform_fees
                      ?.toLocaleString('en-PK')
                },
                {
                  label: 'Transactions',
                  value: data.payments?.length
                },
              ].map((s, i, arr) => (
                <div key={s.label} style={{
                  padding: '14px 20px',
                  textAlign: 'center',
                  borderRight: i < arr.length - 1
                    ? '1px solid rgba(255,255,255,0.12)'
                    : 'none'
                }}>
                  <div style={{
                    fontSize: '1.2rem', fontWeight: 800,
                    color: 'white'
                  }}>
                    {s.value}
                  </div>
                  <div style={{
                    fontSize: '0.7rem',
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
        maxWidth: '900px',
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
            Loading payments...
          </div>
        )}

        {!loading && data?.payments?.length === 0 && (
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            padding: '60px', textAlign: 'center'
          }}>
            <div style={{
              fontSize: '3rem', marginBottom: '12px'
            }}>💰</div>
            <h2 style={{
              margin: '0 0 8px',
              color: 'var(--text-primary)'
            }}>
              No payments yet
            </h2>
            <p style={{
              color: 'var(--text-secondary)', margin: 0
            }}>
              Payments will appear here once travelers pay
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
                    'linear-gradient(90deg, #0369a1, #0ea5e9)'
                }} />
                <div style={{
                  padding: '16px 20px'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '12px',
                    flexWrap: 'wrap', gap: '8px'
                  }}>
                    <div>
                      <div style={{
                        fontWeight: 700, fontSize: '0.95rem',
                        color: 'var(--text-primary)',
                        marginBottom: '3px'
                      }}>
                        {p.listing_title}
                      </div>
                      <div style={{
                        fontSize: '0.82rem',
                        color: 'var(--text-secondary)'
                      }}>
                        👤 {p.traveler_name} ·
                        📅 {formatDate(p.check_in)} →
                        {formatDate(p.check_out)}
                      </div>
                    </div>
                    <div style={{textAlign: 'right'}}>
                      <div style={{
                        fontSize: '0.72rem',
                        color: 'var(--text-muted)',
                        marginBottom: '2px',
                        fontFamily: 'monospace'
                      }}>
                        {p.transaction_id}
                      </div>
                      <div style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)'
                      }}>
                        {formatDate(p.created_at)}
                      </div>
                    </div>
                  </div>

                  {/* Payment breakdown */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(3, 1fr)',
                    gap: '10px'
                  }}>
                    <div style={{
                      background: 'var(--bg-secondary)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        fontSize: '0.7rem',
                        color: 'var(--text-muted)',
                        marginBottom: '3px'
                      }}>
                        Guest Paid
                      </div>
                      <div style={{
                        fontWeight: 700, fontSize: '0.9rem',
                        color: 'var(--text-primary)'
                      }}>
                        PKR {p.total_amount
                          ?.toLocaleString('en-PK')}
                      </div>
                    </div>
                    <div style={{
                      background: '#fee2e2',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        fontSize: '0.7rem',
                        color: '#dc2626',
                        marginBottom: '3px'
                      }}>
                        Platform Fee (10%)
                      </div>
                      <div style={{
                        fontWeight: 700, fontSize: '0.9rem',
                        color: '#dc2626'
                      }}>
                        - PKR {p.platform_fee
                          ?.toLocaleString('en-PK')}
                      </div>
                    </div>
                    <div style={{
                      background: '#dcfce7',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        fontSize: '0.7rem',
                        color: '#16a34a',
                        marginBottom: '3px'
                      }}>
                        You Receive
                      </div>
                      <div style={{
                        fontWeight: 800, fontSize: '0.95rem',
                        color: '#16a34a'
                      }}>
                        PKR {p.you_receive
                          ?.toLocaleString('en-PK')}
                      </div>
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
