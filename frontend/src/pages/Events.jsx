import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import useWindowSize from '../hooks/useWindowSize'

const CATEGORIES = [
  { value: '', label: '🎪 All Events' },
  { value: 'Music & Cultural Festival', label: '🎵 Music & Culture' },
  { value: 'Polo & Horse Events', label: '🏇 Polo & Horse' },
  { value: 'Guided Trek & Expedition', label: '🏔️ Treks' },
  { value: 'Art & Photography', label: '🎨 Art & Photo' },
  { value: 'Local Festival & Fair', label: '🎪 Festivals' },
  { value: 'Sports Event', label: '🏆 Sports' },
  { value: 'Food & Dining Event', label: '🍽️ Food' },
  { value: 'Community Gathering', label: '🤝 Community' },
  { value: 'Horse Riding & Adventure', label: '🐴 Adventure' },
]

function getCategoryEmoji(cat) {
  const found = CATEGORIES.find((c) => c.value === cat)
  return found ? found.label.split(' ')[0] : '🎪'
}

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
  return colors[cat] || '#6b7280'
}

export default function Events() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [freeOnly, setFreeOnly] = useState(false)
  const [sortBy, setSortBy] = useState('date')
  const { isMobile } = useWindowSize()
  const navigate = useNavigate()

  useEffect(() => {
    fetchEvents()
  }, [])

  async function fetchEvents() {
    setLoading(true)
    try {
      const res = await api.get('/events/')
      setEvents(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    let result = [...events]
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (e) =>
          e.title?.toLowerCase().includes(q) ||
          e.location?.toLowerCase().includes(q) ||
          e.venue?.toLowerCase().includes(q) ||
          e.category?.toLowerCase().includes(q)
      )
    }
    if (category) result = result.filter((e) => e.category === category)
    if (freeOnly) result = result.filter((e) => e.is_free)
    if (sortBy === 'date') {
      result.sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
    } else if (sortBy === 'price_low') {
      result.sort((a, b) => (a.starting_price || 0) - (b.starting_price || 0))
    } else if (sortBy === 'popular') {
      result.sort((a, b) => (b.tickets_sold || 0) - (a.tickets_sold || 0))
    }
    return result
  }, [events, search, category, freeOnly, sortBy])

  function formatDate(dateStr) {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-PK', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  function formatTime(timeStr) {
    if (!timeStr) return ''
    const [h, m] = timeStr.split(':')
    const hour = parseInt(h, 10)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const h12 = hour % 12 || 12
    return `${h12}:${m || '00'} ${ampm}`
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <div
        style={{
          background: 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 50%, #a855f7 100%)',
          padding: isMobile ? '32px 16px 24px' : '48px 16px 32px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -60,
            right: -60,
            width: 280,
            height: 280,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -40,
            left: -40,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
            pointerEvents: 'none',
          }}
        />
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: 999,
              padding: '7px 18px',
              marginBottom: 20,
              fontSize: '0.82rem',
              fontWeight: 700,
              color: 'white',
            }}
          >
            🎪 GB Tourism Events
          </div>
          <h1
            style={{
              color: 'white',
              margin: '0 0 12px',
              fontSize: isMobile ? '1.7rem' : '2.4rem',
              fontWeight: 800,
              letterSpacing: '-0.03em',
            }}
          >
            Discover Amazing Events
            <br />
            <span
              style={{
                background: 'linear-gradient(90deg, #fbbf24, #f59e0b)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              in Gilgit-Baltistan
            </span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', margin: '0 0 28px', fontSize: '1rem' }}>
            Polo matches, music festivals, treks, cultural fairs & more
          </p>
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
              <span
                style={{
                  position: 'absolute',
                  left: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                }}
              >
                🔍
              </span>
              <input
                type="text"
                placeholder="Search events, venues..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '13px 14px 13px 42px',
                  borderRadius: 12,
                  border: 'none',
                  fontSize: '0.95rem',
                  outline: 'none',
                  background: 'white',
                  color: '#111827',
                  boxSizing: 'border-box',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                }}
              />
            </div>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
                background: freeOnly ? 'white' : 'rgba(255,255,255,0.2)',
                color: freeOnly ? '#7c3aed' : 'white',
                border: '2px solid rgba(255,255,255,0.3)',
                borderRadius: 12,
                padding: '13px 16px',
                fontWeight: 700,
                fontSize: '0.85rem',
                whiteSpace: 'nowrap',
              }}
            >
              <input
                type="checkbox"
                checked={freeOnly}
                onChange={(e) => setFreeOnly(e.target.checked)}
                style={{ display: 'none' }}
              />
              🎟️ Free Only
            </label>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {CATEGORIES.slice(0, 6).map((c) => (
              <button
                key={c.value || 'all'}
                type="button"
                onClick={() => setCategory(c.value)}
                style={{
                  background: category === c.value ? 'white' : 'rgba(255,255,255,0.15)',
                  color: category === c.value ? '#7c3aed' : 'white',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: 999,
                  padding: isMobile ? '5px 10px' : '6px 14px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: isMobile ? '0.72rem' : '0.82rem',
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: isMobile ? '20px 12px' : '28px 16px' }}>
        {!loading && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
              flexWrap: 'wrap',
              gap: 10,
            }}
          >
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              <strong style={{ color: 'var(--text-primary)' }}>{filtered.length}</strong> event
              {filtered.length !== 1 ? 's' : ''}
              {category && <span style={{ color: 'var(--accent)' }}> in {category}</span>}
            </p>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: '7px 12px',
                borderRadius: 8,
                border: '1px solid var(--border-color)',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              <option value="date">📅 Soonest First</option>
              <option value="popular">🔥 Most Popular</option>
              <option value="price_low">💰 Price: Low to High</option>
            </select>
          </div>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🎪</div>
            Loading events...
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎪</div>
            <h2 style={{ margin: '0 0 8px', color: 'var(--text-primary)' }}>No events found</h2>
            <p style={{ color: 'var(--text-secondary)', margin: '0 0 20px' }}>
              Try different filters or check back later
            </p>
            <button
              type="button"
              onClick={() => {
                setSearch('')
                setCategory('')
                setFreeOnly(false)
              }}
              style={{
                background: '#7c3aed',
                color: 'white',
                border: 'none',
                borderRadius: 10,
                padding: '10px 24px',
                cursor: 'pointer',
                fontWeight: 700,
              }}
            >
              Clear Filters
            </button>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 20,
            }}
          >
            {filtered.map((event) => {
              const color = getCategoryColor(event.category)
              const emoji = getCategoryEmoji(event.category)
              const spotsLeft = event.spots_remaining ?? 0
              const isSoldOut = spotsLeft <= 0

              return (
                <div
                  key={event.id}
                  role="presentation"
                  onClick={() => navigate(`/events/${event.id}`)}
                  style={{
                    background: 'var(--bg-card)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-color)',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'transform 0.18s, box-shadow 0.18s',
                    opacity: isSoldOut ? 0.75 : 1,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)'
                    e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.12)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
                  }}
                >
                  <div style={{ position: 'relative', height: 200, background: color + '22', overflow: 'hidden' }}>
                    {event.image_url ? (
                      <img
                        src={`http://127.0.0.1:8000/uploads/${event.image_url}`}
                        alt=""
                        onError={(e) => {
                          e.target.onerror = null
                          e.target.style.display = 'none'
                        }}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '4rem',
                        }}
                      >
                        {emoji}
                      </div>
                    )}
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: 12,
                        left: 12,
                        background: color,
                        color: 'white',
                        padding: '4px 10px',
                        borderRadius: 999,
                        fontSize: '0.72rem',
                        fontWeight: 700,
                      }}
                    >
                      {emoji} {event.category}
                    </div>
                    <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 6 }}>
                      {event.is_featured && (
                        <span
                          style={{
                            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                            color: 'white',
                            padding: '4px 10px',
                            borderRadius: 999,
                            fontSize: '0.7rem',
                            fontWeight: 700,
                          }}
                        >
                          ⭐ Featured
                        </span>
                      )}
                      {event.is_free && (
                        <span
                          style={{
                            background: '#16a34a',
                            color: 'white',
                            padding: '4px 10px',
                            borderRadius: 999,
                            fontSize: '0.7rem',
                            fontWeight: 700,
                          }}
                        >
                          FREE
                        </span>
                      )}
                      {isSoldOut && (
                        <span
                          style={{
                            background: '#dc2626',
                            color: 'white',
                            padding: '4px 10px',
                            borderRadius: 999,
                            fontSize: '0.7rem',
                            fontWeight: 700,
                          }}
                        >
                          SOLD OUT
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 10,
                        left: 12,
                        color: 'white',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        textShadow: '0 1px 4px rgba(0,0,0,0.5)',
                      }}
                    >
                      📅 {formatDate(event.event_date)} · {formatTime(event.event_time)}
                    </div>
                  </div>
                  <div style={{ padding: 16 }}>
                    <h3
                      style={{
                        margin: '0 0 6px',
                        fontWeight: 700,
                        fontSize: '1rem',
                        color: 'var(--text-primary)',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {event.title}
                    </h3>
                    <p style={{ margin: '0 0 6px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      📍 {event.venue}, {event.location}
                    </p>
                    <p style={{ margin: '0 0 14px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      👤 By {event.organizer_name}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        {event.is_free ? (
                          <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#16a34a' }}>FREE</span>
                        ) : (
                          <span style={{ fontSize: '1.1rem', fontWeight: 800, color }}>
                            PKR {(event.starting_price ?? 0).toLocaleString('en-PK')}
                            <span
                              style={{
                                fontSize: '0.75rem',
                                fontWeight: 400,
                                color: 'var(--text-muted)',
                                marginLeft: 3,
                              }}
                            >
                              onwards
                            </span>
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: spotsLeft <= 10 ? '#dc2626' : 'var(--text-muted)',
                        }}
                      >
                        {isSoldOut ? '❌ Sold Out' : spotsLeft <= 10 ? `🔥 ${spotsLeft} left` : `${spotsLeft} spots`}
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
