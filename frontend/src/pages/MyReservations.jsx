import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

export default function MyReservations() {
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/dining/my-reservations')
      .then(r => setReservations(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function cancelReservation(id) {
    if (!window.confirm('Cancel this reservation?')) return
    try {
      await api.patch(`/dining/reservations/${id}/cancel`)
      setReservations(prev => prev.map(r =>
        r.id === id ? { ...r, status: 'cancelled' } : r
      ))
    } catch (e) { console.error(e) }
  }

  function formatDate(d) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-PK', {
      weekday: 'short', day: 'numeric',
      month: 'short', year: 'numeric'
    })
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      paddingBottom: '48px'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #e11d48 0%, #f97316 100%)',
        padding: '40px 16px 80px'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
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
            🍽️ My Reservations
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.75)',
            margin: 0, fontSize: '0.9rem'
          }}>
            Your dining & table reservations
          </p>
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
            Loading reservations...
          </div>
        )}

        {!loading && reservations.length === 0 && (
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-md)',
            padding: '60px 20px', textAlign: 'center'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🍽️</div>
            <h2 style={{ margin: '0 0 8px', color: 'var(--text-primary)' }}>
              No reservations yet
            </h2>
            <p style={{
              margin: '0 0 24px',
              color: 'var(--text-secondary)',
              fontSize: '0.9rem'
            }}>
              Browse restaurants in GB and make your first reservation!
            </p>
            <button
              onClick={() => navigate('/listings')}
              style={{
                background: 'linear-gradient(135deg, #e11d48, #f97316)',
                color: 'white', border: 'none',
                borderRadius: '10px',
                padding: '12px 28px',
                cursor: 'pointer', fontWeight: 700
              }}
            >
              Browse Restaurants →
            </button>
          </div>
        )}

        {!loading && reservations.length > 0 && (
          <div style={{
            display: 'flex', flexDirection: 'column',
            gap: '12px'
          }}>
            {reservations.map(r => (
              <div key={r.id} style={{
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-sm)',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '4px',
                  background:
                    r.status === 'confirmed'
                      ? 'linear-gradient(90deg, #e11d48, #f97316)'
                      : r.status === 'cancelled'
                        ? '#e5e7eb'
                        : 'linear-gradient(90deg, #16a34a, #0ea5e9)'
                }} />
                <div style={{ padding: '16px 18px' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '8px', gap: '8px'
                  }}>
                    <div>
                      <h3
                        onClick={() => navigate(`/listing/${r.listing_id}`)}
                        style={{
                          margin: '0 0 3px',
                          fontWeight: 700,
                          fontSize: '1rem',
                          color: 'var(--text-primary)',
                          cursor: 'pointer'
                        }}
                      >
                        {r.listing_title}
                      </h3>
                      <div style={{
                        fontSize: '0.82rem',
                        color: 'var(--text-secondary)'
                      }}>
                        📍 {r.location}
                      </div>
                    </div>
                    <span style={{
                      padding: '3px 10px',
                      borderRadius: '999px',
                      fontSize: '0.72rem',
                      fontWeight: 700, flexShrink: 0,
                      background:
                        r.status === 'confirmed'
                          ? '#fce7f3'
                          : r.status === 'cancelled'
                            ? 'var(--danger-bg)'
                            : '#dcfce7',
                      color:
                        r.status === 'confirmed'
                          ? '#e11d48'
                          : r.status === 'cancelled'
                            ? 'var(--danger)'
                            : '#16a34a'
                    }}>
                      {r.status === 'confirmed'
                        ? '✅ Confirmed'
                        : r.status === 'cancelled'
                          ? '❌ Cancelled'
                          : '✓ Completed'}
                    </span>
                  </div>

                  {r.package_name && (
                    <div style={{
                      display: 'inline-block',
                      background: '#fce7f3',
                      color: '#e11d48',
                      padding: '2px 10px',
                      borderRadius: '999px',
                      fontSize: '0.78rem',
                      fontWeight: 600, marginBottom: '8px'
                    }}>
                      🍽️ {r.package_name}
                    </div>
                  )}

                  <div style={{
                    display: 'flex', gap: '16px',
                    fontSize: '0.82rem',
                    color: 'var(--text-secondary)',
                    marginBottom: '10px',
                    flexWrap: 'wrap'
                  }}>
                    <span>📅 {formatDate(r.reservation_date)}</span>
                    <span>🕐 {r.reservation_time}</span>
                    <span>👥 {r.persons} persons</span>
                  </div>

                  {r.special_requests && (
                    <div style={{
                      fontSize: '0.78rem',
                      color: 'var(--text-muted)',
                      marginBottom: '10px',
                      fontStyle: 'italic'
                    }}>
                      💬 "{r.special_requests}"
                    </div>
                  )}

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{
                      fontWeight: 800,
                      color: '#e11d48',
                      fontSize: '1rem'
                    }}>
                      PKR {r.total_price?.toLocaleString('en-PK')}
                    </span>
                    {r.status === 'confirmed' && (
                      <button
                        onClick={() => cancelReservation(r.id)}
                        style={{
                          padding: '7px 14px',
                          borderRadius: '8px',
                          border: '1px solid var(--danger)',
                          background: 'var(--danger-bg)',
                          color: 'var(--danger)',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '0.82rem'
                        }}
                      >
                        Cancel
                      </button>
                    )}
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
