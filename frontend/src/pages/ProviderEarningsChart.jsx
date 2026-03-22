import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
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

function StackedBar({
  gross,
  commission,
  maxValue,
  label,
  isHighlighted,
}) {
  const grossH =
    maxValue > 0 ? Math.max(2, (gross / maxValue) * 160) : 2
  const commH =
    maxValue > 0 ? Math.max(0, (commission / maxValue) * 160) : 0

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-end',
        height: '180px',
        gap: '0',
      }}
    >
      {gross > 0 && (
        <div
          style={{
            fontSize: '0.58rem',
            color: isHighlighted ? '#16a34a' : 'var(--text-muted)',
            fontWeight: isHighlighted ? 700 : 400,
            marginBottom: '4px',
            textAlign: 'center',
            whiteSpace: 'nowrap',
          }}
        >
          {gross >= 1000
            ? `${(gross / 1000).toFixed(0)}K`
            : Math.round(gross)}
        </div>
      )}

      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '4px 4px 0 0',
          overflow: 'hidden',
        }}
      >
        {commH > 0 && (
          <div
            style={{
              width: '100%',
              height: commH,
              background: '#fca5a5',
            }}
          />
        )}
        <div
          style={{
            width: '100%',
            height: grossH - commH,
            background: isHighlighted ? '#16a34a' : '#86efac',
            minHeight: '2px',
          }}
        />
      </div>

      <div
        style={{
          fontSize: '0.6rem',
          color: isHighlighted
            ? 'var(--text-primary)'
            : 'var(--text-muted)',
          fontWeight: isHighlighted ? 700 : 400,
          marginTop: '4px',
          textAlign: 'center',
          maxWidth: '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </div>
    </div>
  )
}

export default function ProviderEarningsChart() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('monthly')
  const navigate = useNavigate()
  const { isMobile } = useWindowSize()

  useEffect(() => {
    api
      .get('/bookings/provider/earnings-breakdown')
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
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>
            📈
          </div>
          Loading earnings...
        </div>
      </div>
    )
  }

  if (!data) return null

  const { totals, monthly, weekly, by_service } = data

  const chartData = view === 'weekly' ? weekly : monthly
  const maxGross = Math.max(...chartData.map((d) => d.gross || 0), 1)

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        paddingBottom: '48px',
      }}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, #15803d, #16a34a)',
          padding: '32px 16px 80px',
        }}
      >
        <div
          style={{
            maxWidth: '1000px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <button
              type="button"
              onClick={() => navigate('/provider-dashboard')}
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'white',
                borderRadius: '8px',
                padding: '7px 14px',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600,
                marginBottom: '14px',
              }}
            >
              ← Dashboard
            </button>
            <h1
              style={{
                color: 'white',
                margin: '0 0 6px',
                fontSize: isMobile ? '1.5rem' : '2rem',
                fontWeight: 800,
              }}
            >
              💰 Earnings Breakdown
            </h1>
            <p
              style={{
                color: 'rgba(255,255,255,0.75)',
                margin: 0,
                fontSize: '0.9rem',
              }}
            >
              Gross revenue · Commission · Your net earnings
            </p>
          </div>

          <div
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: '16px',
              padding: '16px 24px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: '0.75rem',
                color: 'rgba(255,255,255,0.7)',
                marginBottom: '4px',
              }}
            >
              Total Net Earnings
            </div>
            <div
              style={{
                fontSize: '1.8rem',
                fontWeight: 800,
                color: 'white',
                lineHeight: 1,
              }}
            >
              {formatPKR(totals.total_earnings)}
            </div>
            <div
              style={{
                fontSize: '0.72rem',
                color: 'rgba(255,255,255,0.6)',
                marginTop: '4px',
              }}
            >
              incl. PKR{' '}
              {Math.round(totals.event_earnings).toLocaleString('en-PK')}{' '}
              events
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          maxWidth: '1000px',
          margin: '-56px auto 0',
          padding: '0 16px',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile
              ? 'repeat(2, 1fr)'
              : 'repeat(4, 1fr)',
            gap: '12px',
            marginBottom: '20px',
            position: 'relative',
            zIndex: 2,
          }}
        >
          {[
            {
              icon: '💵',
              label: 'Gross Revenue',
              value: formatPKR(totals.gross),
              sub: 'Before commission',
              color: '#2563eb',
            },
            {
              icon: '🏛️',
              label: 'Platform Fee',
              value: formatPKR(totals.commission),
              sub: '10% commission',
              color: '#e11d48',
            },
            {
              icon: '💰',
              label: 'Net from Bookings',
              value: formatPKR(totals.net),
              sub: '90% of gross',
              color: '#16a34a',
            },
            {
              icon: '🎪',
              label: 'Event Earnings',
              value: formatPKR(totals.event_earnings),
              sub: 'After commission',
              color: '#7c3aed',
            },
          ].map((card) => (
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
                  fontSize: '1.3rem',
                  marginBottom: '8px',
                }}
              >
                {card.icon}
              </div>
              <div
                style={{
                  fontSize: isMobile ? '1rem' : '1.2rem',
                  fontWeight: 800,
                  color: card.color,
                  lineHeight: 1,
                  marginBottom: '4px',
                }}
              >
                {card.value}
              </div>
              <div
                style={{
                  fontSize: '0.72rem',
                  color: 'var(--text-muted)',
                  fontWeight: 600,
                }}
              >
                {card.label}
              </div>
              <div
                style={{
                  fontSize: '0.68rem',
                  color: 'var(--text-muted)',
                  marginTop: '2px',
                }}
              >
                {card.sub}
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
                📊 Earnings Chart
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.78rem',
                  color: 'var(--text-secondary)',
                }}
              >
                🟢 Net earnings &nbsp; 🔴 Platform commission
              </p>
            </div>

            <div
              style={{
                display: 'flex',
                gap: '6px',
                background: 'var(--bg-secondary)',
                borderRadius: '10px',
                padding: '4px',
              }}
            >
              {[
                { key: 'monthly', label: '12M' },
                { key: 'weekly', label: '8W' },
                { key: 'service', label: 'By Type' },
              ].map((v) => (
                <button
                  key={v.key}
                  type="button"
                  onClick={() => setView(v.key)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '7px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: view === v.key ? 700 : 400,
                    fontSize: '0.82rem',
                    background:
                      view === v.key ? 'var(--bg-card)' : 'transparent',
                    color:
                      view === v.key ? '#16a34a' : 'var(--text-muted)',
                    boxShadow:
                      view === v.key ? 'var(--shadow-sm)' : 'none',
                    transition: 'all 0.15s',
                  }}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          {view !== 'service' ? (
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: isMobile ? '2px' : '4px',
                  paddingLeft: '8px',
                }}
              >
                {chartData.map((d, i) => (
                  <StackedBar
                    key={i}
                    gross={d.gross}
                    commission={
                      d.commission ?? Math.round(d.gross * 0.10)
                    }
                    maxValue={maxGross}
                    label={view === 'weekly' ? d.week : d.short}
                    isHighlighted={i === chartData.length - 1}
                  />
                ))}
              </div>

              <div style={{ marginTop: '20px', overflowX: 'auto' }}>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '0.8rem',
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        borderBottom: '2px solid var(--border-color)',
                      }}
                    >
                      {[
                        view === 'weekly' ? 'Week' : 'Month',
                        'Bookings',
                        'Gross Revenue',
                        'Commission (10%)',
                        'Net Earnings',
                      ].map((h) => (
                        <th
                          key={h}
                          style={{
                            padding: '8px 12px',
                            textAlign: 'left',
                            color: 'var(--text-muted)',
                            fontWeight: 700,
                            fontSize: '0.7rem',
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
                    {[...chartData]
                      .reverse()
                      .slice(0, 6)
                      .map((d, i) => (
                        <tr
                          key={i}
                          style={{
                            borderBottom:
                              '1px solid var(--border-color)',
                          }}
                        >
                          <td
                            style={{
                              padding: '9px 12px',
                              fontWeight: 600,
                              color: 'var(--text-primary)',
                            }}
                          >
                            {view === 'weekly' ? d.week : d.month}
                          </td>
                          <td
                            style={{
                              padding: '9px 12px',
                              color: '#2563eb',
                              fontWeight: 600,
                            }}
                          >
                            {d.bookings}
                          </td>
                          <td
                            style={{
                              padding: '9px 12px',
                              color: 'var(--text-secondary)',
                            }}
                          >
                            {formatPKR(d.gross)}
                          </td>
                          <td
                            style={{
                              padding: '9px 12px',
                              color: '#e11d48',
                            }}
                          >
                            -{' '}
                            {formatPKR(
                              d.commission ?? d.gross * 0.1,
                            )}
                          </td>
                          <td
                            style={{
                              padding: '9px 12px',
                              fontWeight: 700,
                              color: '#16a34a',
                            }}
                          >
                            {formatPKR(d.net)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                  <tfoot>
                    <tr
                      style={{
                        borderTop: '2px solid var(--border-color)',
                        background: 'var(--bg-secondary)',
                      }}
                    >
                      <td
                        colSpan={2}
                        style={{
                          padding: '10px 12px',
                          fontWeight: 800,
                          color: 'var(--text-primary)',
                          fontSize: '0.875rem',
                        }}
                      >
                        All Time Total
                      </td>
                      <td
                        style={{
                          padding: '10px 12px',
                          color: 'var(--text-secondary)',
                          fontWeight: 700,
                        }}
                      >
                        {formatPKR(totals.gross)}
                      </td>
                      <td
                        style={{
                          padding: '10px 12px',
                          color: '#e11d48',
                          fontWeight: 700,
                        }}
                      >
                        - {formatPKR(totals.commission)}
                      </td>
                      <td
                        style={{
                          padding: '10px 12px',
                          fontWeight: 800,
                          color: '#16a34a',
                          fontSize: '0.95rem',
                        }}
                      >
                        {formatPKR(totals.net)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ) : (
            <div>
              {by_service.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '48px',
                    color: 'var(--text-muted)',
                  }}
                >
                  No earnings data yet
                </div>
              ) : (
                by_service.map((s, i) => {
                  const color = SERVICE_COLORS[s.type] || '#6b7280'
                  const maxGr = by_service[0].gross
                  const pct = maxGr > 0 ? (s.gross / maxGr) * 100 : 0

                  return (
                    <div key={i} style={{ marginBottom: '16px' }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: '6px',
                          alignItems: 'center',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                        >
                          <div
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: '50%',
                              background: color,
                              flexShrink: 0,
                            }}
                          />
                          <span
                            style={{
                              fontSize: '0.875rem',
                              fontWeight: 600,
                              color: 'var(--text-primary)',
                            }}
                          >
                            {SERVICE_LABELS[s.type] || s.type}
                          </span>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              color: 'var(--text-muted)',
                            }}
                          >
                            {s.bookings} bookings
                          </span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div
                            style={{
                              fontWeight: 700,
                              color: '#16a34a',
                              fontSize: '0.9rem',
                            }}
                          >
                            {formatPKR(s.net)}
                          </div>
                          <div
                            style={{
                              fontSize: '0.68rem',
                              color: 'var(--text-muted)',
                            }}
                          >
                            net
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          height: '12px',
                          background: 'var(--border-color)',
                          borderRadius: '6px',
                          overflow: 'hidden',
                          display: 'flex',
                        }}
                      >
                        <div
                          style={{
                            width: `${pct * 0.9}%`,
                            height: '100%',
                            background: color,
                            transition: 'width 0.5s ease',
                          }}
                        />
                        <div
                          style={{
                            width: `${pct * 0.1}%`,
                            height: '100%',
                            background: color + '55',
                            transition: 'width 0.5s ease',
                          }}
                        />
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginTop: '3px',
                          fontSize: '0.68rem',
                          color: 'var(--text-muted)',
                        }}
                      >
                        <span>Gross: {formatPKR(s.gross)}</span>
                        <span>
                          Commission: {formatPKR(s.gross * 0.1)}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>

        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)',
            padding: '20px',
          }}
        >
          <h3
            style={{
              margin: '0 0 14px',
              fontSize: '0.95rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}
          >
            💡 How Earnings Work
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
              gap: '12px',
            }}
          >
            {[
              {
                step: '1',
                icon: '🏨',
                title: 'Guest Pays',
                desc: 'Guest pays full booking amount to GB Tourism platform',
                color: '#2563eb',
              },
              {
                step: '2',
                icon: '🏛️',
                title: '10% Commission',
                desc: 'Platform keeps 10% as service fee for payment processing, support & marketing',
                color: '#e11d48',
              },
              {
                step: '3',
                icon: '💰',
                title: 'You Get 90%',
                desc: 'Remaining 90% is your net earnings. Transferred to your account monthly',
                color: '#16a34a',
              },
            ].map((item) => (
              <div
                key={item.step}
                style={{
                  padding: '16px',
                  background: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${item.color}22`,
                  borderLeft: `3px solid ${item.color}`,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '6px',
                  }}
                >
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: item.color + '18',
                      color: item.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      flexShrink: 0,
                    }}
                  >
                    {item.step}
                  </div>
                  <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      color: item.color,
                    }}
                  >
                    {item.title}
                  </span>
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.78rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                  }}
                >
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
