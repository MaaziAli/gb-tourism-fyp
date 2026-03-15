import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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

export default function MyEvents() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { isMobile } = useWindowSize()

  useEffect(() => {
    api
      .get('/events/my-events')
      .then((r) => setEvents(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function cancelEvent(id) {
    if (!window.confirm('Cancel this event? Attendees will be notified.')) return
    try {
      await api.put(`/events/${id}`, { status: 'cancelled' })
      setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, status: 'cancelled' } : e)))
    } catch (e) {
      console.error(e)
    }
  }

  async function deleteEvent(id) {
    if (!window.confirm('Delete this event? This cannot be undone.')) return
    try {
      await api.delete(`/events/${id}`)
      setEvents((prev) => prev.filter((e) => e.id !== id))
    } catch (e) {
      console.error(e)
    }
  }

  function formatDate(d) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-PK', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  function statusStyle(status) {
    switch (status) {
      case 'active':
        return { bg: '#dcfce7', color: '#16a34a', label: '✅ Active' }
      case 'cancelled':
        return { bg: '#fee2e2', color: '#dc2626', label: '❌ Cancelled' }
      case 'completed':
        return { bg: '#e0f2fe', color: '#0369a1', label: '✓ Completed' }
      default:
        return { bg: '#f3f4f6', color: '#6b7280', label: status }
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingBottom: 48 }}>
      <div
        style={{
          background: 'linear-gradient(135deg, #4c1d95, #7c3aed)',
          padding: '40px 16px 80px',
        }}
      >
        <div
          style={{
            maxWidth: 900,
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div>
            <h1 style={{ color: 'white', margin: '0 0 6px', fontSize: '1.8rem', fontWeight: 800 }}>
              🎪 My Events
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.75)', margin: 0, fontSize: '0.9rem' }}>
              {events.length} event{events.length !== 1 ? 's' : ''} created
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/create-event')}
            style={{
              background: 'white',
              color: '#7c3aed',
              border: 'none',
              borderRadius: 10,
              padding: '10px 20px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.9rem',
            }}
          >
            + Create Event
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '-48px auto 0', padding: '0 16px' }}>
        {loading && (
          <div
            style={{
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              padding: 60,
              textAlign: 'center',
              color: 'var(--text-secondary)',
            }}
          >
            Loading your events...
          </div>
        )}

        {!loading && events.length === 0 && (
          <div
            style={{
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-md)',
              padding: '60px 20px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎪</div>
            <h2 style={{ margin: '0 0 8px', color: 'var(--text-primary)' }}>No events yet</h2>
            <p style={{ margin: '0 0 24px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Create your first event and start selling tickets!
            </p>
            <button
              type="button"
              onClick={() => navigate('/create-event')}
              style={{
                background: 'linear-gradient(135deg, #4c1d95, #7c3aed)',
                color: 'white',
                border: 'none',
                borderRadius: 10,
                padding: '12px 28px',
                cursor: 'pointer',
                fontWeight: 700,
              }}
            >
              Create First Event →
            </button>
          </div>
        )}

        {!loading && events.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {events.map((event) => {
              const color = getCategoryColor(event.category)
              const ss = statusStyle(event.status)
              const pct =
                event.total_capacity > 0
                  ? Math.round((event.tickets_sold / event.total_capacity) * 100)
                  : 0

              return (
                <div
                  key={event.id}
                  style={{
                    background: 'var(--bg-card)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow-sm)',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ height: 4, background: color }} />
                  <div style={{ display: 'flex', gap: 0 }}>
                    <div
                      role="presentation"
                      onClick={() => navigate(`/events/${event.id}`)}
                      style={{
                        width: isMobile ? 80 : 120,
                        flexShrink: 0,
                        cursor: 'pointer',
                        background: color + '22',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2rem',
                        overflow: 'hidden',
                        minHeight: 100,
                      }}
                    >
                      {event.image_url ? (
                        <img
                          src={`http://127.0.0.1:8000/uploads/${event.image_url}`}
                          alt=""
                          onError={(e) => {
                            e.target.style.display = 'none'
                          }}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', minHeight: 100 }}
                        />
                      ) : (
                        <span>🎪</span>
                      )}
                    </div>
                    <div style={{ flex: 1, padding: '16px 18px' }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: 6,
                          gap: 8,
                        }}
                      >
                        <h3
                          role="presentation"
                          onClick={() => navigate(`/events/${event.id}`)}
                          style={{
                            margin: 0,
                            fontWeight: 700,
                            fontSize: '0.975rem',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            flex: 1,
                          }}
                        >
                          {event.title}
                        </h3>
                        <span
                          style={{
                            background: ss.bg,
                            color: ss.color,
                            padding: '3px 10px',
                            borderRadius: 999,
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          {ss.label}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                        📅 {formatDate(event.event_date)} · 📍 {event.venue}, {event.location}
                      </div>
                      <div
                        style={{
                          display: 'inline-block',
                          background: color + '18',
                          color,
                          padding: '2px 8px',
                          borderRadius: 999,
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          marginBottom: 10,
                        }}
                      >
                        {event.category}
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)',
                            marginBottom: 4,
                          }}
                        >
                          <span>{event.tickets_sold} tickets sold</span>
                          <span>{event.spots_remaining} remaining</span>
                        </div>
                        <div
                          style={{
                            height: 6,
                            background: 'var(--bg-secondary)',
                            borderRadius: 3,
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${pct}%`,
                              height: '100%',
                              background: pct >= 90 ? '#dc2626' : color,
                              borderRadius: 3,
                              transition: 'width 0.3s',
                            }}
                          />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => navigate(`/events/${event.id}`)}
                          style={{
                            padding: '6px 14px',
                            borderRadius: 7,
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '0.8rem',
                          }}
                        >
                          👁️ View
                        </button>
                        {event.status === 'active' && (
                          <button
                            type="button"
                            onClick={() => cancelEvent(event.id)}
                            style={{
                              padding: '6px 14px',
                              borderRadius: 7,
                              border: '1px solid var(--danger)',
                              background: 'var(--danger-bg)',
                              color: 'var(--danger)',
                              cursor: 'pointer',
                              fontWeight: 600,
                              fontSize: '0.8rem',
                            }}
                          >
                            Cancel
                          </button>
                        )}
                        {event.status === 'cancelled' && (
                          <button
                            type="button"
                            onClick={() => deleteEvent(event.id)}
                            style={{
                              padding: '6px 14px',
                              borderRadius: 7,
                              border: '1px solid var(--danger)',
                              background: 'var(--danger-bg)',
                              color: 'var(--danger)',
                              cursor: 'pointer',
                              fontWeight: 600,
                              fontSize: '0.8rem',
                            }}
                          >
                            🗑️ Delete
                          </button>
                        )}
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
