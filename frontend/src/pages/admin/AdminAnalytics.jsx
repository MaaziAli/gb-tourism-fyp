import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import useWindowSize from '../../hooks/useWindowSize'

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

function BarChart({
  data,
  valueKey,
  labelKey,
  color = '#0ea5e9',
  height = 160,
  formatValue,
  title,
}) {
  if (!data || data.length === 0) return null
  const maxVal = Math.max(...data.map((d) => d[valueKey] || 0))
  if (maxVal === 0) return null

  return (
    <div>
      {title && (
        <div
          style={{
            fontSize: '0.82rem',
            fontWeight: 700,
            color: 'var(--text-secondary)',
            marginBottom: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {title}
        </div>
      )}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '4px',
          height,
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
              bottom: 24 + (height - 24) * pct,
              borderTop: '1px dashed var(--border-color)',
              zIndex: 0,
            }}
          />
        ))}

        {data.map((item, i) => {
          const val = item[valueKey] || 0
          const pct = maxVal > 0 ? val / maxVal : 0
          const barH = Math.max(2, (height - 24) * pct)

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
                position: 'relative',
                zIndex: 1,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  bottom: barH + 28,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'var(--text-primary)',
                  color: 'var(--bg-primary)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  opacity: 0,
                  transition: 'opacity 0.2s',
                  pointerEvents: 'none',
                  zIndex: 10,
                }}
                className="bar-tooltip"
              >
                {formatValue ? formatValue(val) : val.toLocaleString('en-PK')}
              </div>

              <div
                style={{
                  width: '100%',
                  height: barH,
                  background:
                    typeof color === 'object' ? color[i % color.length] : color,
                  borderRadius: '4px 4px 0 0',
                  transition: 'height 0.5s ease, opacity 0.2s',
                  cursor: 'default',
                  minHeight: '2px',
                }}
                onMouseEnter={(e) => {
                  const tooltip = e.currentTarget.previousElementSibling
                  if (tooltip) tooltip.style.opacity = '1'
                }}
                onMouseLeave={(e) => {
                  const tooltip = e.currentTarget.previousElementSibling
                  if (tooltip) tooltip.style.opacity = '0'
                }}
              />

              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '0.6rem',
                  color: 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '100%',
                  textAlign: 'center',
                }}
              >
                {item[labelKey]}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function HorizontalBar({ label, value, maxValue, color, formatValue }) {
  const pct = maxValue > 0 ? (value / maxValue) * 100 : 0

  return (
    <div style={{ marginBottom: '10px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '4px',
          fontSize: '0.82rem',
        }}
      >
        <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{label}</span>
        <span style={{ color, fontWeight: 700 }}>
          {formatValue ? formatValue(value) : value.toLocaleString('en-PK')}
        </span>
      </div>
      <div
        style={{
          height: '8px',
          background: 'var(--border-color)',
          borderRadius: '4px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${Math.min(100, pct)}%`,
            height: '100%',
            background: color,
            borderRadius: '4px',
            transition: 'width 0.6s ease',
          }}
        />
      </div>
    </div>
  )
}

/** CSS conic-gradient donut — no chart libraries */
function DonutChart({ data, size = 120 }) {
  if (!data || data.length === 0) return null
  const total = data.reduce((s, d) => s + (d.value || 0), 0)
  if (total === 0) return null

  let angle = 0
  const segments = data.map((d) => {
    const pct = (d.value / total) * 100
    const startDeg = angle
    angle += (pct / 100) * 360
    return { ...d, pct, startDeg, endDeg: angle }
  })

  const gradientParts = []
  angle = 0
  for (const seg of segments) {
    const span = (seg.pct / 100) * 360
    const end = angle + span
    gradientParts.push(`${seg.color || '#0ea5e9'} ${angle}deg ${end}deg`)
    angle = end
  }
  const background = `conic-gradient(from -90deg, ${gradientParts.join(', ')})`
  const hole = Math.round(size * 0.52)

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        flexWrap: 'wrap',
      }}
    >
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background,
          position: 'relative',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: hole,
            height: hole,
            borderRadius: '50%',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              fontSize: Math.max(10, size * 0.09),
              fontWeight: 800,
              color: 'var(--text-primary)',
              lineHeight: 1.1,
            }}
          >
            {total.toLocaleString('en-PK')}
          </span>
          <span
            style={{
              fontSize: Math.max(7, size * 0.055),
              color: 'var(--text-muted)',
            }}
          >
            total
          </span>
        </div>
      </div>

      <div>
        {segments.map((seg, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '4px',
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: seg.color,
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {seg.label}
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginLeft: 'auto',
              }}
            >
              {seg.pct.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AdminAnalytics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeMonth, setActiveMonth] = useState('revenue')
  const navigate = useNavigate()
  const { isMobile } = useWindowSize()

  useEffect(() => {
    api
      .get('/admin/analytics/overview')
      .then((r) => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  function formatPKR(v) {
    if (v >= 1000000) return `PKR ${(v / 1000000).toFixed(1)}M`
    if (v >= 1000) return `PKR ${(v / 1000).toFixed(0)}K`
    return `PKR ${Math.round(v).toLocaleString('en-PK')}`
  }

  function formatDate(d) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-PK', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
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
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📊</div>
          Loading analytics...
        </div>
      </div>
    )

  if (!data) return null

  const { totals, monthly, top_providers, top_listings, service_breakdown, recent_activity } =
    data

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingBottom: '48px' }}>
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a, #1e3a5f)',
          padding: '32px 16px 80px',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
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
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '999px',
                padding: '6px 16px',
                marginBottom: '12px',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: 'rgba(255,255,255,0.8)',
              }}
            >
              📊 Platform Analytics
            </div>
            <h1
              style={{
                color: 'white',
                margin: '0 0 6px',
                fontSize: isMobile ? '1.5rem' : '2rem',
                fontWeight: 800,
              }}
            >
              Revenue & Growth Dashboard
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.6)', margin: 0, fontSize: '0.9rem' }}>
              Complete overview of platform performance
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/admin')}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'white',
              borderRadius: '10px',
              padding: '9px 18px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.875rem',
            }}
          >
            ← Admin Panel
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '-48px auto 0', padding: '0 16px' }}>
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
          {[
            {
              icon: '💰',
              label: 'Total Revenue',
              value: formatPKR(totals.revenue),
              sub: `PKR ${Math.round(totals.commission).toLocaleString('en-PK')} commission`,
              color: '#16a34a',
              bg: '#dcfce7',
            },
            {
              icon: '📅',
              label: 'Total Bookings',
              value: totals.bookings.toLocaleString('en-PK'),
              sub: `${totals.events} events`,
              color: '#2563eb',
              bg: '#dbeafe',
            },
            {
              icon: '👥',
              label: 'Total Users',
              value: totals.users.toLocaleString('en-PK'),
              sub: `${totals.providers} providers`,
              color: '#7c3aed',
              bg: '#ede9fe',
            },
            {
              icon: '🏨',
              label: 'Total Listings',
              value: totals.listings.toLocaleString('en-PK'),
              sub: 'Active services',
              color: '#d97706',
              bg: '#fef3c7',
            },
          ].map((card) => (
            <div
              key={card.label}
              style={{
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-color)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                padding: '20px',
                borderTop: `4px solid ${card.color}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: '6px',
                    }}
                  >
                    {card.label}
                  </div>
                  <div
                    style={{
                      fontSize: isMobile ? '1.3rem' : '1.6rem',
                      fontWeight: 800,
                      color: card.color,
                      lineHeight: 1,
                    }}
                  >
                    {card.value}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {card.sub}
                  </div>
                </div>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '10px',
                    background: card.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                  }}
                >
                  {card.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-md)',
            padding: '24px',
            marginBottom: '20px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <h3
                style={{
                  margin: '0 0 4px',
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                }}
              >
                📈 12-Month Trend
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Revenue, bookings and user growth
              </p>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              {[
                { key: 'revenue', label: '💰 Revenue' },
                { key: 'bookings', label: '📅 Bookings' },
                { key: 'new_users', label: '👥 Users' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveMonth(tab.key)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.78rem',
                    background: activeMonth === tab.key ? '#0ea5e9' : 'var(--bg-secondary)',
                    color: activeMonth === tab.key ? 'white' : 'var(--text-secondary)',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <BarChart
            data={monthly}
            valueKey={activeMonth}
            labelKey="short"
            color={
              activeMonth === 'revenue'
                ? '#16a34a'
                : activeMonth === 'bookings'
                  ? '#2563eb'
                  : '#7c3aed'
            }
            height={isMobile ? 140 : 200}
            formatValue={activeMonth === 'revenue' ? formatPKR : undefined}
          />

          <div style={{ marginTop: '20px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                  {['Month', 'Revenue', 'Commission', 'Bookings', 'New Users'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '8px 12px',
                        textAlign: 'left',
                        color: 'var(--text-muted)',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        fontSize: '0.68rem',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...monthly].reverse().slice(0, 6).map((m, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {m.month}
                    </td>
                    <td style={{ padding: '8px 12px', color: '#16a34a', fontWeight: 700 }}>
                      {formatPKR(m.revenue)}
                    </td>
                    <td style={{ padding: '8px 12px', color: '#d97706' }}>{formatPKR(m.commission)}</td>
                    <td style={{ padding: '8px 12px', color: '#2563eb' }}>{m.bookings}</td>
                    <td style={{ padding: '8px 12px', color: '#7c3aed' }}>+{m.new_users}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: '20px',
            marginBottom: '20px',
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
            <h3
              style={{
                margin: '0 0 16px',
                fontSize: '1rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
              }}
            >
              🏨 Revenue by Service Type
            </h3>
            {service_breakdown.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                No data yet
              </div>
            ) : (
              <div>
                {service_breakdown.map((s) => (
                  <HorizontalBar
                    key={s.type}
                    label={SERVICE_LABELS[s.type] || s.type}
                    value={s.revenue}
                    maxValue={service_breakdown[0].revenue}
                    color={SERVICE_COLORS[s.type] || '#6b7280'}
                    formatValue={formatPKR}
                  />
                ))}
              </div>
            )}
          </div>

          <div
            style={{
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-sm)',
              padding: '24px',
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
              💰 Revenue Split
            </h3>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
              {[
                {
                  label: 'Booking Revenue',
                  value: totals.booking_revenue,
                  color: '#2563eb',
                  icon: '🏨',
                },
                {
                  label: 'Ticket Revenue',
                  value: totals.ticket_revenue,
                  color: '#7c3aed',
                  icon: '🎪',
                },
                {
                  label: 'Platform Commission',
                  value: totals.commission,
                  color: '#16a34a',
                  icon: '💰',
                },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    flex: 1,
                    minWidth: '100px',
                    background: 'var(--bg-secondary)',
                    borderRadius: '10px',
                    padding: '12px',
                    border: `1px solid ${item.color}22`,
                    borderLeft: `3px solid ${item.color}`,
                  }}
                >
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
                    {item.icon} {item.label}
                  </div>
                  <div style={{ fontWeight: 800, color: item.color, fontSize: '0.95rem' }}>
                    {formatPKR(item.value)}
                  </div>
                </div>
              ))}
            </div>

            <DonutChart
              data={[
                { label: '🏨 Bookings', value: totals.booking_revenue, color: '#2563eb' },
                { label: '🎪 Events', value: totals.ticket_revenue, color: '#7c3aed' },
              ].filter((d) => d.value > 0)}
              size={140}
            />

            <div style={{ marginTop: '16px' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Bookings vs Event Tickets
              </div>
              <div style={{ height: '12px', borderRadius: '6px', overflow: 'hidden', display: 'flex' }}>
                {totals.revenue > 0 &&
                  [
                    { v: totals.booking_revenue, c: '#2563eb' },
                    { v: totals.ticket_revenue, c: '#7c3aed' },
                  ].map((seg, i) => (
                    <div
                      key={i}
                      style={{
                        width: `${(seg.v / totals.revenue) * 100}%`,
                        background: seg.c,
                        height: '100%',
                      }}
                    />
                  ))}
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: '20px',
            marginBottom: '20px',
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
            <h3
              style={{
                margin: '0 0 16px',
                fontSize: '1rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
              }}
            >
              🏆 Top Providers
            </h3>
            {top_providers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                No provider data yet
              </div>
            ) : (
              <div>
                {top_providers.slice(0, 5).map((p, i) => (
                  <div
                    key={p.email || i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 0',
                      borderBottom: i < 4 ? '1px solid var(--border-color)' : 'none',
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: ['#fef3c7', '#f3f4f6', '#fce7f3', '#ede9fe', '#dbeafe'][i] || '#f3f4f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.875rem',
                        flexShrink: 0,
                      }}
                    >
                      {['🥇', '🥈', '🥉', '4', '5'][i]}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: '0.875rem',
                          color: 'var(--text-primary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {p.name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {p.listings} listings · {p.bookings} bookings
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontWeight: 800, color: '#16a34a', fontSize: '0.875rem' }}>
                        {formatPKR(p.revenue)}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                        {formatPKR(p.commission)} comm.
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div
            style={{
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-sm)',
              padding: '24px',
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
              🌟 Most Booked Services
            </h3>
            {top_listings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                No booking data yet
              </div>
            ) : (
              <div>
                {top_listings.slice(0, 5).map((l, i) => (
                  <div
                    key={l.id ?? i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 0',
                      borderBottom: i < 4 ? '1px solid var(--border-color)' : 'none',
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '8px',
                        background: `${SERVICE_COLORS[l.service_type] || '#6b7280'}20`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.85rem',
                        flexShrink: 0,
                      }}
                    >
                      {(SERVICE_LABELS[l.service_type] || '🏢').split(' ')[0]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: '0.875rem',
                          color: 'var(--text-primary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {l.title}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>📍 {l.location}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontWeight: 800, color: '#2563eb', fontSize: '0.875rem' }}>
                        {l.bookings} bookings
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 600 }}>
                        {formatPKR(l.revenue)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)',
            padding: '24px',
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
            🕐 Recent Activity
          </h3>
          {recent_activity.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
              No recent activity
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                    {['Type', 'User', 'Service', 'Amount', 'Date'].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: '8px 12px',
                          textAlign: 'left',
                          color: 'var(--text-muted)',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          fontSize: '0.68rem',
                          letterSpacing: '0.05em',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recent_activity.map((a, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '10px 12px' }}>
                        <span
                          style={{
                            background: '#dbeafe',
                            color: '#2563eb',
                            padding: '2px 8px',
                            borderRadius: '999px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                          }}
                        >
                          📅 Booking
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {a.user}
                      </td>
                      <td
                        style={{
                          padding: '10px 12px',
                          color: 'var(--text-secondary)',
                          maxWidth: '160px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {a.service}
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: '#16a34a' }}>
                        {formatPKR(a.amount || 0)}
                      </td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                        {formatDate(a.date)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
