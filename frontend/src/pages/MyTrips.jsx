import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

const TIER_COLORS = {
  budget: { color: '#16a34a', emoji: '💚' },
  standard: { color: '#d97706', emoji: '💛' },
  luxury: { color: '#7c3aed', emoji: '💎' },
}

export default function MyTrips() {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/trip-planner/my-plans')
      .then(r => setPlans(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function deletePlan(id) {
    if (!window.confirm('Delete this trip plan?')) return
    try {
      await api.delete(`/trip-planner/my-plans/${id}`)
      setPlans(prev => prev.filter(p => p.id !== id))
    } catch (e) {
      console.error(e)
    }
  }

  function formatDate(d) {
    if (!d) return null
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

      <div style={{
        background:
          'linear-gradient(135deg, #1e3a5f 0%, #0ea5e9 100%)',
        padding: '40px 16px 80px'
      }}>
        <div style={{
          maxWidth: '800px', margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end', flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <h1 style={{
              color: 'white', margin: '0 0 6px',
              fontSize: '1.8rem', fontWeight: 800
            }}>
              🗺️ My Trip Plans
            </h1>
            <p style={{
              color: 'rgba(255,255,255,0.75)',
              margin: 0, fontSize: '0.9rem'
            }}>
              {plans.length} saved trip
              {plans.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => navigate('/trip-planner')}
            style={{
              background: 'white', color: '#1e3a5f',
              border: 'none', borderRadius: '10px',
              padding: '10px 20px', cursor: 'pointer',
              fontWeight: 700, fontSize: '0.9rem'
            }}
          >
            + New Trip Plan
          </button>
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
            Loading your trips...
          </div>
        )}

        {!loading && plans.length === 0 && (
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-md)',
            padding: '60px 20px', textAlign: 'center'
          }}>
            <div style={{
              fontSize: '3rem', marginBottom: '12px'
            }}>
              🗺️
            </div>
            <h2 style={{
              margin: '0 0 8px',
              color: 'var(--text-primary)'
            }}>
              No trip plans yet
            </h2>
            <p style={{
              margin: '0 0 24px',
              color: 'var(--text-secondary)',
              fontSize: '0.9rem'
            }}>
              Use the Trip Planner to create your first
              GB adventure!
            </p>
            <button
              onClick={() => navigate('/trip-planner')}
              style={{
                background:
                  'linear-gradient(135deg, #1e3a5f, #0ea5e9)',
                color: 'white', border: 'none',
                borderRadius: '10px',
                padding: '12px 28px',
                cursor: 'pointer', fontWeight: 700,
                fontSize: '0.9rem'
              }}
            >
              Plan My First Trip →
            </button>
          </div>
        )}

        {!loading && plans.length > 0 && (
          <div style={{
            display: 'flex', flexDirection: 'column',
            gap: '14px'
          }}>
            {plans.map(plan => {
              const tier = TIER_COLORS[plan.budget_tier] ||
                TIER_COLORS.standard
              return (
                <div key={plan.id} style={{
                  background: 'var(--bg-card)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-color)',
                  boxShadow: 'var(--shadow-sm)',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '4px',
                    background: tier.color
                  }} />

                  <div style={{
                    display: 'flex', gap: '0'
                  }}>
                    {plan.hotel_image && (
                      <img
                        src={
                          'http://127.0.0.1:8000/uploads/' +
                          plan.hotel_image
                        }
                        alt="Hotel"
                        onError={e => {
                          e.target.onerror = null
                          e.target.style.display = 'none'
                        }}
                        style={{
                          width: 100, height: 'auto',
                          objectFit: 'cover',
                          flexShrink: 0
                        }}
                      />
                    )}

                    <div style={{
                      flex: 1, padding: '16px 18px'
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '6px', gap: '8px'
                      }}>
                        <h3 style={{
                          margin: 0, fontWeight: 700,
                          fontSize: '1rem',
                          color: 'var(--text-primary)'
                        }}>
                          {plan.title}
                        </h3>
                        <span style={{
                          background: tier.color + '18',
                          color: tier.color,
                          border:
                            '1px solid ' + tier.color + '40',
                          padding: '2px 10px',
                          borderRadius: '999px',
                          fontSize: '0.72rem',
                          fontWeight: 700, flexShrink: 0
                        }}>
                          {tier.emoji}
                          {' '}
                          {plan.budget_tier}
                        </span>
                      </div>

                      <div style={{
                        fontSize: '0.82rem',
                        color: 'var(--text-secondary)',
                        marginBottom: '6px'
                      }}>
                        📍 {plan.destination} ·
                        🗓️ {plan.duration_days} days
                        {plan.start_date && (
                          <span>
                            {' '}·{' '}
                            {formatDate(plan.start_date)}
                          </span>
                        )}
                      </div>

                      <div style={{
                        display: 'flex', gap: '16px',
                        marginBottom: '12px',
                        flexWrap: 'wrap'
                      }}>
                        <div>
                          <span style={{
                            fontSize: '0.72rem',
                            color: 'var(--text-muted)'
                          }}>
                            Budget
                          </span>
                          <div style={{
                            fontWeight: 700,
                            fontSize: '0.875rem',
                            color: 'var(--text-primary)'
                          }}>
                            PKR {plan.total_budget
                              ?.toLocaleString('en-PK')}
                          </div>
                        </div>
                        <div>
                          <span style={{
                            fontSize: '0.72rem',
                            color: 'var(--text-muted)'
                          }}>
                            Estimated Cost
                          </span>
                          <div style={{
                            fontWeight: 700,
                            fontSize: '0.875rem',
                            color: tier.color
                          }}>
                            PKR {plan.estimated_cost
                              ?.toLocaleString('en-PK')}
                          </div>
                        </div>
                      </div>

                      {plan.is_public &&
                        plan.share_code && (
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center', gap: '6px',
                          background: 'var(--accent-light)',
                          color: 'var(--accent)',
                          padding: '3px 10px',
                          borderRadius: '999px',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          marginBottom: '10px'
                        }}>
                          🔗 {plan.share_code}
                        </div>
                      )}

                      <div style={{
                        display: 'flex', gap: '8px'
                      }}>
                        <button
                          onClick={() =>
                            navigate('/trip-planner')
                          }
                          style={{
                            padding: '7px 14px',
                            borderRadius: '8px',
                            border:
                              '1px solid var(--border-color)',
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '0.8rem'
                          }}
                        >
                          📋 New Plan
                        </button>
                        <button
                          onClick={() =>
                            deletePlan(plan.id)
                          }
                          style={{
                            padding: '7px 14px',
                            borderRadius: '8px',
                            border:
                              '1px solid var(--danger)',
                            background: 'var(--danger-bg)',
                            color: 'var(--danger)',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '0.8rem'
                          }}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
