import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { getImageUrl } from '../utils/image'
import useWindowSize from '../hooks/useWindowSize'

const SERVICE_COLORS = {
  hotel: '#2563eb',
  tour: '#16a34a',
  transport: '#d97706',
  activity: '#7c3aed',
  restaurant: '#e11d48',
  car_rental: '#0369a1',
  bike_rental: '#0891b2',
  jeep_safari: '#92400e',
  boat_trip: '#1d4ed8',
  horse_riding: '#7c2d12',
  guide: '#059669',
  camping: '#15803d',
  medical: '#dc2626',
}

const SERVICE_LABELS = {
  hotel: '🏨 Hotel',
  tour: '🏔️ Tour',
  transport: '🚐 Transport',
  activity: '🎯 Activity',
  restaurant: '🍽️ Restaurant',
  car_rental: '🚗 Car',
  bike_rental: '🚲 Bike',
  jeep_safari: '🚙 Jeep',
  boat_trip: '🚢 Boat',
  horse_riding: '🐴 Horse',
  guide: '🧭 Guide',
  camping: '🏕️ Camping',
  medical: '🏥 Medical',
}

export default function ProviderDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const navigate = useNavigate()
  const { isMobile } = useWindowSize()

  useEffect(() => {
    api
      .get('/bookings/provider/dashboard')
      .then((r) => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  function formatPKR(v) {
    const n = v || 0
    if (n >= 1000000) return `PKR ${(n / 1000000).toFixed(1)}M`
    if (n >= 1000) return `PKR ${(n / 1000).toFixed(0)}K`
    return `PKR ${Math.round(n).toLocaleString('en-PK')}`
  }

  function formatDate(d) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })
  }

  function timeAgo(d) {
    if (!d) return ''
    const diff = Date.now() - new Date(d).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  if (loading) {
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
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📊</div>
          Loading dashboard...
        </div>
      </div>
    )
  }

  if (!data) return null

  const { summary, recent_bookings, listing_stats, monthly_trend } = data
  const s = summary

  const TABS = [
    { key: 'overview', label: '📊 Overview' },
    { key: 'bookings', label: '📅 Bookings' },
    { key: 'listings', label: '🏨 Listings' },
  ]

  const maxRev = Math.max(...monthly_trend.map((m) => m.revenue || 0), 1)

  const kpiCards = [
    {
      icon: '💰',
      label: 'Total Revenue',
      value: formatPKR(s.total_revenue),
      sub: `${formatPKR(s.net_earnings)} net earnings`,
      color: '#16a34a',
      change: s.revenue_change,
    },
    {
      icon: '📅',
      label: 'This Month',
      value: formatPKR(s.month_revenue),
      sub: `${s.month_bookings} bookings`,
      color: '#2563eb',
      change: s.revenue_change,
    },
    {
      icon: '🏨',
      label: 'My Services',
      value: s.total_listings,
      sub: `${s.total_bookings} total bookings`,
      color: '#d97706',
      change: null,
    },
    {
      icon: '⭐',
      label: 'Avg Rating',
      value: s.avg_rating > 0 ? `${s.avg_rating}/5` : 'No reviews',
      sub: `${s.total_reviews} reviews`,
      color: '#f59e0b',
      change: null,
    },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingBottom: '48px' }}>
      <div
        style={{
          background: 'linear-gradient(135deg, #1e3a5f, #0ea5e9)',
          padding: '32px 16px 80px',
        }}
      >
        <div
          style={{
            maxWidth: '1100px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255,255,255,0.15)',
                borderRadius: '999px',
                padding: '6px 16px',
                marginBottom: '12px',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: 'rgba(255,255,255,0.9)',
              }}
            >
              📊 Provider Dashboard
            </div>
            <h1
              style={{
                color: 'white',
                margin: '0 0 6px',
                fontSize: isMobile ? '1.5rem' : '2rem',
                fontWeight: 800,
              }}
            >
              Welcome Back! 👋
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0, fontSize: '0.9rem' }}>
              {s.total_listings} services · {s.total_bookings} bookings · ⭐ {s.avg_rating}/5
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => navigate('/add-listing')}
              style={{
                background: 'white',
                color: '#1e3a5f',
                border: 'none',
                borderRadius: '10px',
                padding: '9px 16px',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.875rem',
              }}
            >
              ➕ Add Service
            </button>
            <button
              type="button"
              onClick={() => navigate('/create-event')}
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'white',
                borderRadius: '10px',
                padding: '9px 16px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.875rem',
              }}
            >
              🎪 Create Event
            </button>
            <button
              type="button"
              onClick={() => navigate('/earnings-chart')}
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'white',
                borderRadius: '10px',
                padding: '9px 16px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.875rem',
              }}
            >
              📈 Earnings Chart
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '-56px auto 0', padding: '0 16px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
            gap: '12px',
            marginBottom: '20px',
            position: 'relative',
            zIndex: 2,
          }}
        >
          {kpiCards.map((card) => (
            <div
              key={card.label}
              style={{
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-color)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                padding: '18px',
                borderTop: `4px solid ${card.color}`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '8px',
                }}
              >
                <div style={{ fontSize: '1.3rem' }}>{card.icon}</div>
                {card.change !== null && (
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: card.change >= 0 ? '#16a34a' : '#dc2626',
                      background: card.change >= 0 ? '#dcfce7' : '#fee2e2',
                      padding: '2px 6px',
                      borderRadius: '999px',
                    }}
                  >
                    {card.change >= 0 ? '↑' : '↓'}
                    {Math.abs(card.change)}%
                  </span>
                )}
              </div>
              <div
                style={{
                  fontSize: isMobile ? '1.2rem' : '1.4rem',
                  fontWeight: 800,
                  color: card.color,
                  lineHeight: 1,
                  marginBottom: '4px',
                }}
              >
                {card.value}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>{card.label}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>{card.sub}</div>
            </div>
          ))}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr',
            gap: '16px',
            marginBottom: '16px',
          }}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-sm)',
              padding: '24px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                📈 6-Month Revenue
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Net after 10% commission</span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: '8px',
                height: '120px',
                paddingBottom: '24px',
                position: 'relative',
              }}
            >
              {[0.25, 0.5, 0.75, 1].map((pct) => (
                <div
                  key={pct}
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: 24 + 96 * pct,
                    borderTop: '1px dashed var(--border-color)',
                    zIndex: 0,
                  }}
                />
              ))}
              {monthly_trend.map((m, i) => {
                const pct = maxRev > 0 ? m.revenue / maxRev : 0
                const barH = Math.max(4, 96 * pct)
                const isLatest = i === monthly_trend.length - 1
                return (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      height: '100%',
                      zIndex: 1,
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        height: barH,
                        background: isLatest ? '#0ea5e9' : '#0ea5e930',
                        borderRadius: '4px 4px 0 0',
                        transition: 'height 0.4s ease',
                      }}
                      title={`${m.month}: ${formatPKR(m.revenue)}`}
                    />
                    <div
                      style={{
                        fontSize: '0.65rem',
                        color: isLatest ? '#0ea5e9' : 'var(--text-muted)',
                        marginTop: '4px',
                        fontWeight: isLatest ? 700 : 400,
                      }}
                    >
                      {m.month}
                    </div>
                  </div>
                )
              })}
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
                marginTop: '8px',
                paddingTop: '12px',
                borderTop: '1px solid var(--border-color)',
              }}
            >
              {[
                { label: 'Gross Revenue', value: formatPKR(s.total_revenue), color: '#0ea5e9' },
                { label: 'Commission (10%)', value: formatPKR(s.total_revenue * 0.1), color: '#e11d48' },
                { label: 'Net Earnings', value: formatPKR(s.net_earnings), color: '#16a34a' },
              ].map((item) => (
                <div key={item.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
                    {item.label}
                  </div>
                  <div style={{ fontWeight: 800, color: item.color, fontSize: '0.875rem' }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div
              style={{
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-sm)',
                padding: '18px',
                borderLeft: '4px solid #7c3aed',
              }}
            >
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                🎪 Events Revenue
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#7c3aed', marginBottom: '4px' }}>
                {formatPKR(s.event_revenue)}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.total_events} events hosted</div>
              <button
                type="button"
                onClick={() => navigate('/event-analytics')}
                style={{
                  marginTop: '8px',
                  background: '#7c3aed18',
                  border: '1px solid #7c3aed44',
                  color: '#7c3aed',
                  borderRadius: '6px',
                  padding: '5px 12px',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}
              >
                View Event Stats →
              </button>
            </div>
            {listing_stats.length > 0 && (
              <div
                style={{
                  background: 'var(--bg-card)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-color)',
                  boxShadow: 'var(--shadow-sm)',
                  padding: '18px',
                  flex: 1,
                }}
              >
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    marginBottom: '10px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  🏆 Top Service
                </div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    color: 'var(--text-primary)',
                    marginBottom: '3px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {listing_stats[0].title}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  {listing_stats[0].bookings_count} bookings
                  {listing_stats[0].avg_rating > 0 ? ` · ⭐ ${listing_stats[0].avg_rating}` : ''}
                </div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#16a34a' }}>
                  {formatPKR(listing_stats[0].net_earnings)}
                  <span style={{ fontSize: '0.72rem', fontWeight: 400, color: 'var(--text-muted)', marginLeft: '4px' }}>
                    net
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '16px',
            borderBottom: '2px solid var(--border-color)',
            paddingBottom: '0',
          }}
        >
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '10px 16px',
                borderRadius: '8px 8px 0 0',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontWeight: activeTab === tab.key ? 700 : 400,
                fontSize: '0.875rem',
                color: activeTab === tab.key ? '#0ea5e9' : 'var(--text-secondary)',
                borderBottom: activeTab === tab.key ? '2px solid #0ea5e9' : '2px solid transparent',
                marginBottom: '-2px',
                transition: 'all 0.15s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div
            style={{
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-sm)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                🕐 Recent Bookings
              </h3>
              <button
                type="button"
                onClick={() => setActiveTab('bookings')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--accent)',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                }}
              >
                View All →
              </button>
            </div>
            {recent_bookings.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No bookings yet. Add your services to start receiving bookings!
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-secondary)' }}>
                      {['Guest', 'Service', 'Dates', 'Amount', 'Status', 'When'].map((h) => (
                        <th
                          key={h}
                          style={{
                            padding: '10px 14px',
                            textAlign: 'left',
                            fontWeight: 700,
                            color: 'var(--text-muted)',
                            fontSize: '0.72rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recent_bookings.map((booking, i) => (
                      <tr key={booking.id || i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{booking.guest_name}</div>
                          {booking.group_size > 1 && (
                            <div style={{ fontSize: '0.7rem', color: 'var(--accent)' }}>
                              👥 Group of {booking.group_size}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div
                            style={{
                              display: 'inline-block',
                              background: `${SERVICE_COLORS[booking.service_type] || '#6b7280'}18`,
                              color: SERVICE_COLORS[booking.service_type] || '#6b7280',
                              padding: '2px 8px',
                              borderRadius: '999px',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              marginBottom: '3px',
                            }}
                          >
                            {SERVICE_LABELS[booking.service_type] || booking.service_type}
                          </div>
                          <div
                            style={{
                              fontSize: '0.8rem',
                              color: 'var(--text-primary)',
                              maxWidth: '150px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {booking.listing_title}
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                          {formatDate(booking.check_in)}
                          {booking.check_out && <span> → {formatDate(booking.check_out)}</span>}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: 700, color: '#16a34a' }}>{formatPKR(booking.net_amount)}</div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                            gross: {formatPKR(booking.total_price)}
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span
                            style={{
                              background: booking.status === 'active' ? '#dcfce7' : '#fee2e2',
                              color: booking.status === 'active' ? '#16a34a' : '#dc2626',
                              padding: '3px 8px',
                              borderRadius: '999px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                            }}
                          >
                            {booking.status === 'active' ? '✅ Active' : '❌ ' + (booking.status || '')}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                          {timeAgo(booking.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'bookings' && (
          <div
            style={{
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-sm)',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                📅 All Recent Bookings
                <span style={{ marginLeft: '8px', fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-muted)' }}>
                  ({recent_bookings.length} shown)
                </span>
              </h3>
            </div>
            {isMobile ? (
              <div style={{ padding: '12px' }}>
                {recent_bookings.map((booking, i) => (
                  <div
                    key={booking.id || i}
                    style={{
                      background: 'var(--bg-secondary)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      padding: '14px',
                      marginBottom: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                        {booking.guest_name}
                      </div>
                      <span
                        style={{
                          background: booking.status === 'active' ? '#dcfce7' : '#fee2e2',
                          color: booking.status === 'active' ? '#16a34a' : '#dc2626',
                          padding: '2px 8px',
                          borderRadius: '999px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                        }}
                      >
                        {booking.status === 'active' ? '✅' : '❌'} {booking.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      {booking.listing_title}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {formatDate(booking.check_in)} → {formatDate(booking.check_out)}
                      </div>
                      <div style={{ fontWeight: 800, color: '#16a34a' }}>{formatPKR(booking.net_amount)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-secondary)' }}>
                      {['Guest', 'Service', 'Check-In', 'Check-Out', 'Gross', 'Net (90%)', 'Status'].map((h) => (
                        <th
                          key={h}
                          style={{
                            padding: '10px 14px',
                            textAlign: 'left',
                            fontWeight: 700,
                            color: 'var(--text-muted)',
                            fontSize: '0.72rem',
                            textTransform: 'uppercase',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recent_bookings.map((booking, i) => (
                      <tr key={booking.id || i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '11px 14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {booking.guest_name}
                          {booking.group_size > 1 && (
                            <span style={{ marginLeft: '6px', color: 'var(--accent)', fontSize: '0.72rem' }}>
                              👥{booking.group_size}
                            </span>
                          )}
                        </td>
                        <td
                          style={{
                            padding: '11px 14px',
                            color: 'var(--text-secondary)',
                            maxWidth: '140px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {booking.listing_title}
                        </td>
                        <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
                          {formatDate(booking.check_in)}
                        </td>
                        <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
                          {formatDate(booking.check_out)}
                        </td>
                        <td style={{ padding: '11px 14px' }}>{formatPKR(booking.total_price)}</td>
                        <td style={{ padding: '11px 14px', fontWeight: 700, color: '#16a34a' }}>
                          {formatPKR(booking.net_amount)}
                        </td>
                        <td style={{ padding: '11px 14px' }}>
                          <span
                            style={{
                              background: booking.status === 'active' ? '#dcfce7' : '#fee2e2',
                              color: booking.status === 'active' ? '#16a34a' : '#dc2626',
                              padding: '3px 8px',
                              borderRadius: '999px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                            }}
                          >
                            {booking.status === 'active' ? '✅ Active' : '❌ ' + (booking.status || '')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'listings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {listing_stats.length === 0 ? (
              <div
                style={{
                  background: 'var(--bg-card)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-color)',
                  padding: '60px 20px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🏨</div>
                <h3 style={{ margin: '0 0 8px', color: 'var(--text-primary)' }}>No services yet</h3>
                <p style={{ color: 'var(--text-secondary)', margin: '0 0 20px' }}>
                  Add your first service to start earning!
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/add-listing')}
                  style={{
                    background: 'linear-gradient(135deg, #1e3a5f, #0ea5e9)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '11px 24px',
                    cursor: 'pointer',
                    fontWeight: 700,
                  }}
                >
                  ➕ Add First Service
                </button>
              </div>
            ) : (
              listing_stats.map((listing, i) => {
                const color = SERVICE_COLORS[listing.service_type] || '#0ea5e9'
                return (
                  <div
                    key={listing.id}
                    style={{
                      background: 'var(--bg-card)',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--border-color)',
                      boxShadow: 'var(--shadow-sm)',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'stretch',
                    }}
                  >
                    <div
                      style={{
                        width: isMobile ? 80 : 100,
                        flexShrink: 0,
                        background: `${color}18`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2rem',
                        overflow: 'hidden',
                      }}
                    >
                      {listing.image_url ? (
                        <img
                          src={getImageUrl(listing.image_url)}
                          alt={listing.title}
                          onError={(e) => {
                            e.target.style.display = 'none'
                          }}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', minHeight: 80 }}
                        />
                      ) : (
                        <span>{SERVICE_LABELS[listing.service_type]?.split(' ')[0] || '🏢'}</span>
                      )}
                    </div>
                    <div
                      style={{
                        flex: 1,
                        padding: '14px 18px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '12px',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: '0.95rem',
                            color: 'var(--text-primary)',
                            marginBottom: '3px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {i === 0 && <span style={{ marginRight: '6px', fontSize: '0.9rem' }}>🏆</span>}
                          {listing.title}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                          📍 {listing.location} · PKR {listing.price_per_night?.toLocaleString('en-PK')}/night
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <span
                            style={{
                              background: `${color}18`,
                              color,
                              padding: '2px 8px',
                              borderRadius: '999px',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                            }}
                          >
                            {SERVICE_LABELS[listing.service_type] || listing.service_type}
                          </span>
                          {listing.avg_rating > 0 && (
                            <span
                              style={{
                                background: '#fef3c7',
                                color: '#d97706',
                                padding: '2px 8px',
                                borderRadius: '999px',
                                fontSize: '0.72rem',
                                fontWeight: 600,
                              }}
                            >
                              ⭐ {listing.avg_rating} ({listing.review_count})
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '16px', flexShrink: 0 }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#2563eb' }}>
                            {listing.bookings_count}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>bookings</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#16a34a' }}>
                            {formatPKR(listing.net_earnings)}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>net earned</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => navigate(`/listing/${listing.id}`)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '7px',
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                          }}
                        >
                          👁️ View
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(`/edit-listing/${listing.id}`)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '7px',
                            border: '1px solid var(--accent)',
                            background: 'var(--accent-light)',
                            color: 'var(--accent)',
                            cursor: 'pointer',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                          }}
                        >
                          ✏️ Edit
                        </button>
                        {listing.service_type === 'hotel' && (
                          <button
                            type="button"
                            onClick={() => navigate(`/hotel/${listing.id}/rooms`)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '7px',
                              border: '1px solid #7c3aed',
                              background: '#ede9fe',
                              color: '#7c3aed',
                              cursor: 'pointer',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                            }}
                          >
                            🛏️ Rooms
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>
    </div>
  )
}
