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

export default function EventDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isMobile } = useWindowSize()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get(`/events/${id}`)
      .then((r) => setEvent(r.data))
      .catch(() => setEvent(null))
      .finally(() => setLoading(false))
  }, [id])

  function formatDate(d) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-PK', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div
        style={{
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-secondary)',
        }}
      >
        Loading event…
      </div>
    )
  }

  if (!event) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Event not found.</p>
        <button
          type="button"
          onClick={() => navigate('/events')}
          style={{
            marginTop: 16,
            padding: '10px 20px',
            borderRadius: 10,
            border: 'none',
            background: '#7c3aed',
            color: 'white',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Browse events
        </button>
      </div>
    )
  }

  const color = getCategoryColor(event.category)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingBottom: 48 }}>
      <div
        style={{
          background: `linear-gradient(135deg, ${color}cc, ${color})`,
          padding: isMobile ? '24px 16px 32px' : '32px 16px 40px',
        }}
      >
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: 'white',
              borderRadius: 8,
              padding: '8px 16px',
              cursor: 'pointer',
              fontWeight: 600,
              marginBottom: 16,
            }}
          >
            ← Back
          </button>
          <div
            style={{
              borderRadius: 16,
              overflow: 'hidden',
              marginBottom: 20,
              maxHeight: 280,
              background: 'rgba(0,0,0,0.15)',
            }}
          >
            {event.image_url ? (
              <img
                src={`http://127.0.0.1:8000/uploads/${event.image_url}`}
                alt=""
                style={{ width: '100%', height: 260, objectFit: 'cover', display: 'block' }}
                onError={(e) => {
                  e.target.style.display = 'none'
                }}
              />
            ) : (
              <div
                style={{
                  height: 200,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '4rem',
                }}
              >
                🎪
              </div>
            )}
          </div>
          <span
            style={{
              background: 'rgba(255,255,255,0.25)',
              color: 'white',
              padding: '4px 12px',
              borderRadius: 999,
              fontSize: '0.78rem',
              fontWeight: 700,
            }}
          >
            {event.category}
          </span>
          <h1
            style={{
              color: 'white',
              margin: '12px 0 8px',
              fontSize: isMobile ? '1.5rem' : '2rem',
              fontWeight: 800,
            }}
          >
            {event.title}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.9)', margin: 0, fontSize: '0.95rem' }}>
            📅 {formatDate(event.event_date)} · 🕐 {event.event_time}
            {event.end_time ? ` – ${event.end_time}` : ''}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.85)', margin: '8px 0 0', fontSize: '0.9rem' }}>
            📍 {event.venue}, {event.location}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.8)', margin: '8px 0 0', fontSize: '0.85rem' }}>
            👤 {event.organizer_name}
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>
        {event.description && (
          <div
            style={{
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              padding: 20,
              marginBottom: 24,
            }}
          >
            <h2 style={{ margin: '0 0 12px', fontSize: '1.05rem', color: 'var(--text-primary)' }}>
              About
            </h2>
            <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
              {event.description}
            </p>
          </div>
        )}

        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            padding: 20,
          }}
        >
          <h2 style={{ margin: '0 0 16px', fontSize: '1.05rem', color: 'var(--text-primary)' }}>
            🎟️ Tickets
          </h2>
          {event.ticket_types?.length === 0 && (
            <p style={{ color: 'var(--text-muted)' }}>No ticket types listed.</p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {event.ticket_types?.map((t) => (
              <div
                key={t.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px 16px',
                  background: 'var(--bg-secondary)',
                  borderRadius: 10,
                  border: '1px solid var(--border-color)',
                  flexWrap: 'wrap',
                  gap: 8,
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{t.name}</div>
                  {t.description && (
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{t.description}</div>
                  )}
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                    {t.available} available
                  </div>
                </div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: t.is_free ? '#16a34a' : color }}>
                  {t.is_free ? 'FREE' : `PKR ${t.price?.toLocaleString('en-PK')}`}
                </div>
              </div>
            ))}
          </div>
          <p style={{ margin: '16px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Ticket booking coming in Part 2. Spots remaining (event): {event.spots_remaining}
          </p>
        </div>
      </div>
    </div>
  )
}
