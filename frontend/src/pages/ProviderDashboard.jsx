import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { getImageUrl } from '../utils/image'
import useWindowSize from '../hooks/useWindowSize'

function toMonthLabel(year, month) {
  return new Date(year, month - 1, 1).toLocaleDateString('en-PK', {
    month: 'long',
    year: 'numeric',
  })
}

function formatPKR(v) {
  return `PKR ${(Number(v) || 0).toLocaleString('en-PK')}`
}

function formatDate(date) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-PK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function parseISODate(isoDate) {
  const [y, m, d] = (isoDate || '').split('-').map((v) => Number(v))
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

function expandBookingDays(checkIn, checkOut) {
  const start = parseISODate(checkIn)
  const end = parseISODate(checkOut)
  if (!start || !end) return []
  const days = []
  const cursor = new Date(start)
  while (cursor < end) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(
      cursor.getDate(),
    ).padStart(2, '0')}`
    days.push(key)
    cursor.setDate(cursor.getDate() + 1)
  }
  if (days.length === 0) days.push(checkIn)
  return days
}

export default function ProviderDashboard() {
  const navigate = useNavigate()
  const { isMobile } = useWindowSize()

  const [activeTab, setActiveTab] = useState('overview')
  const [loadingDashboard, setLoadingDashboard] = useState(true)
  const [dashboardData, setDashboardData] = useState(null)
  const [checkinError, setCheckinError] = useState('')
  const [checkinSuccess, setCheckinSuccess] = useState('')

  const [calendarLoading, setCalendarLoading] = useState(false)
  const [calendarError, setCalendarError] = useState('')
  const today = new Date()
  const [selectedYear, setSelectedYear] = useState(today.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1)
  const [calendarBookings, setCalendarBookings] = useState([])

  const [payoutLoading, setPayoutLoading] = useState(false)
  const [payoutError, setPayoutError] = useState('')
  const [payoutSuccess, setPayoutSuccess] = useState('')
  const [payoutAmount, setPayoutAmount] = useState('')
  const [payoutNotes, setPayoutNotes] = useState('')
  const [availableBalance, setAvailableBalance] = useState(0)
  const [balanceBreakdown, setBalanceBreakdown] = useState({
    total_earned: 0,
    reserved_pending: 0,
    reserved_approved: 0,
    already_paid: 0,
    total_reserved: 0,
    available_balance: 0,
  })
  const [payoutRequests, setPayoutRequests] = useState([])

  async function loadDashboard() {
    setLoadingDashboard(true)
    try {
      const res = await api.get('/bookings/provider/dashboard')
      setDashboardData(res.data)
    } catch (error) {
      console.error('Failed to load provider dashboard', error)
    } finally {
      setLoadingDashboard(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  async function fetchCalendar(year = selectedYear, month = selectedMonth) {
    setCalendarLoading(true)
    setCalendarError('')
    try {
      const res = await api.get(`/bookings/provider/calendar?year=${year}&month=${month}`)
      setCalendarBookings(Array.isArray(res.data?.bookings) ? res.data.bookings : [])
    } catch (error) {
      console.error(error)
      setCalendarError(error.response?.data?.detail || 'Failed to load monthly bookings')
    } finally {
      setCalendarLoading(false)
    }
  }

  async function fetchPayoutData() {
    setPayoutLoading(true)
    setPayoutError('')
    try {
      const res = await api.get('/payments/payout-requests')
      setAvailableBalance(Number(res.data?.available_balance || 0))
      setBalanceBreakdown(
        res.data?.balance_breakdown || {
          total_earned: 0,
          reserved_pending: 0,
          reserved_approved: 0,
          already_paid: 0,
          total_reserved: 0,
          available_balance: Number(res.data?.available_balance || 0),
        },
      )
      setPayoutRequests(Array.isArray(res.data?.requests) ? res.data.requests : [])
    } catch (error) {
      console.error(error)
      setPayoutError(error.response?.data?.detail || 'Failed to load payout data')
    } finally {
      setPayoutLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'calendar') {
      fetchCalendar()
    }
    if (activeTab === 'payouts') {
      fetchPayoutData()
    }
  }, [activeTab])

  const groupedByDay = useMemo(() => {
    const map = {}
    const monthPrefix = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`
    for (const booking of calendarBookings) {
      for (const day of expandBookingDays(booking.check_in, booking.check_out)) {
        if (!day.startsWith(monthPrefix)) continue
        if (!map[day]) map[day] = []
        map[day].push(booking)
      }
    }
    return Object.entries(map).sort((a, b) => (a[0] > b[0] ? 1 : -1))
  }, [calendarBookings, selectedMonth, selectedYear])

  const tabItems = [
    { key: 'overview', label: '📊 Overview' },
    { key: 'listings', label: '🏨 Listings' },
    { key: 'calendar', label: '📅 All Bookings Calendar' },
    { key: 'payouts', label: '💸 Payouts' },
  ]

  function prevMonth() {
    let month = selectedMonth - 1
    let year = selectedYear
    if (month < 1) {
      month = 12
      year -= 1
    }
    setSelectedMonth(month)
    setSelectedYear(year)
    fetchCalendar(year, month)
  }

  function nextMonth() {
    let month = selectedMonth + 1
    let year = selectedYear
    if (month > 12) {
      month = 1
      year += 1
    }
    setSelectedMonth(month)
    setSelectedYear(year)
    fetchCalendar(year, month)
  }

  async function requestPayout() {
    setPayoutError('')
    setPayoutSuccess('')

    const amount = Number(payoutAmount)
    if (!amount || amount <= 0) {
      setPayoutError('Please enter a valid amount.')
      return
    }
    if (amount > availableBalance) {
      setPayoutError('Amount cannot exceed your available balance.')
      return
    }

    try {
      await api.post('/payments/request-payout', {
        amount,
        notes: payoutNotes.trim() || null,
      })
      setPayoutAmount('')
      setPayoutNotes('')
      setPayoutSuccess('Payout request submitted successfully.')
      fetchPayoutData()
    } catch (error) {
      console.error(error)
      setPayoutError(error.response?.data?.detail || 'Failed to submit payout request')
    }
  }

  if (loadingDashboard) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-secondary)',
        }}
      >
        Loading provider dashboard...
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div style={{ padding: 24, color: 'var(--danger)' }}>
        Failed to load dashboard. Please refresh.
      </div>
    )
  }

  const { summary, recent_bookings, listing_stats } = dashboardData

  const todayStr = new Date().toISOString().split('T')[0]
  const todaysArrivals = (recent_bookings || []).filter((b) => {
    const checkInDate = (b.check_in || '').split('T')[0]
    return checkInDate === todayStr && !b.checked_in_at
  })
  const todaysDepartures = (recent_bookings || []).filter((b) => {
    const checkOutDate = (b.check_out || '').split('T')[0]
    return checkOutDate === todayStr && b.checked_in_at && !b.checked_out_at
  })

  async function handleCheckIn(bookingId) {
    setCheckinError('')
    setCheckinSuccess('')
    try {
      await api.post(`/bookings/${bookingId}/check-in`)
      setCheckinSuccess('Guest checked in successfully.')
      await loadDashboard()
    } catch (error) {
      console.error(error)
      setCheckinError(error.response?.data?.detail || 'Failed to check in guest.')
    }
  }

  async function handleCheckOut(bookingId) {
    setCheckinError('')
    setCheckinSuccess('')
    try {
      await api.post(`/bookings/${bookingId}/check-out`)
      setCheckinSuccess('Guest checked out successfully.')
      await loadDashboard()
    } catch (error) {
      console.error(error)
      setCheckinError(error.response?.data?.detail || 'Failed to check out guest.')
    }
  }
  const topCards = [
    { label: 'Total Revenue', value: formatPKR(summary.total_revenue), icon: '💰' },
    { label: 'Net Earnings', value: formatPKR(summary.net_earnings), icon: '📈' },
    { label: 'Active Listings', value: summary.active_listings || summary.total_listings, icon: '🏨' },
    { label: 'Total Bookings', value: summary.total_bookings, icon: '📅' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingBottom: 40 }}>
      <div
        style={{
          background: 'linear-gradient(135deg, #1e3a5f, #0ea5e9)',
          color: 'white',
          padding: '28px 16px 24px',
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: isMobile ? '1.35rem' : '1.8rem' }}>Provider Dashboard</h1>
            <p style={{ margin: '6px 0 0', opacity: 0.9, fontSize: '0.92rem' }}>
              {summary.total_listings} listings • {summary.total_bookings} bookings
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => navigate('/add-listing')}
              style={{
                border: 'none',
                borderRadius: 8,
                padding: '9px 14px',
                background: 'white',
                color: '#1e3a5f',
                cursor: 'pointer',
                fontWeight: 700,
              }}
            >
              ➕ Add Listing
            </button>
            <button
              type="button"
              onClick={() => navigate('/earnings-chart')}
              style={{
                border: '1px solid rgba(255,255,255,0.35)',
                borderRadius: 8,
                padding: '9px 14px',
                background: 'transparent',
                color: 'white',
                cursor: 'pointer',
                fontWeight: 700,
              }}
            >
              📈 Earnings Chart
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '18px auto 0', padding: '0 16px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
            gap: 12,
            marginBottom: 16,
          }}
        >
          {topCards.map((card) => (
            <div
              key={card.label}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 12,
                padding: 14,
              }}
            >
              <div style={{ fontSize: '1.25rem' }}>{card.icon}</div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{card.value}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{card.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {tabItems.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              style={{
                border: '1px solid var(--border-color)',
                borderRadius: 999,
                padding: '8px 14px',
                cursor: 'pointer',
                background: activeTab === tab.key ? '#0ea5e9' : 'var(--bg-card)',
                color: activeTab === tab.key ? 'white' : 'var(--text-secondary)',
                fontWeight: 700,
                fontSize: '0.85rem',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gap: 12 }}>
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 12,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '14px 16px',
                  borderBottom: '1px solid var(--border-color)',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                }}
              >
                Recent Bookings
              </div>
              {recent_bookings?.length ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-secondary)' }}>
                        {['Guest', 'Listing', 'Check-in', 'Check-out', 'Status', 'Gross', 'Net'].map((h) => (
                          <th
                            key={h}
                            style={{
                              textAlign: 'left',
                              padding: '9px 12px',
                              fontSize: '0.72rem',
                              color: 'var(--text-muted)',
                              textTransform: 'uppercase',
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {recent_bookings.map((booking) => {
                        const isCheckedIn = !!booking.checked_in_at && !booking.checked_out_at
                        const isCheckedOut = !!booking.checked_out_at
                        return (
                          <tr key={booking.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '10px 12px', color: 'var(--text-primary)', fontWeight: 600 }}>
                              {booking.guest_name}
                            </td>
                            <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{booking.listing_title}</td>
                            <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                              {formatDate(booking.check_in)}
                            </td>
                            <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                              {formatDate(booking.check_out)}
                            </td>
                            <td style={{ padding: '10px 12px' }}>
                              {isCheckedIn && (
                                <span
                                  style={{
                                    display: 'inline-block',
                                    padding: '2px 8px',
                                    borderRadius: 999,
                                    background: '#dcfce7',
                                    color: '#166534',
                                    fontWeight: 700,
                                    fontSize: '0.72rem',
                                  }}
                                >
                                  Checked In
                                </span>
                              )}
                              {isCheckedOut && (
                                <span
                                  style={{
                                    display: 'inline-block',
                                    padding: '2px 8px',
                                    borderRadius: 999,
                                    background: '#e5e7eb',
                                    color: '#4b5563',
                                    fontWeight: 700,
                                    fontSize: '0.72rem',
                                  }}
                                >
                                  Checked Out
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                              {formatPKR(booking.total_price)}
                            </td>
                            <td style={{ padding: '10px 12px', color: '#16a34a', fontWeight: 700 }}>
                              {formatPKR(booking.net_amount)}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ padding: 24, color: 'var(--text-secondary)' }}>No recent bookings yet.</div>
              )}
            </div>

            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 12,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '14px 16px',
                  borderBottom: '1px solid var(--border-color)',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 8,
                  flexWrap: 'wrap',
                }}
              >
                <span>Today&apos;s Arrivals &amp; Departures</span>
                {(checkinError || checkinSuccess) && (
                  <span style={{ fontSize: '0.8rem', color: checkinError ? 'var(--danger)' : '#16a34a' }}>
                    {checkinError || checkinSuccess}
                  </span>
                )}
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                  gap: 0,
                }}
              >
                <div style={{ borderRight: isMobile ? 'none' : '1px solid var(--border-color)' }}>
                  <div
                    style={{
                      padding: '10px 14px',
                      borderBottom: '1px solid var(--border-color)',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                    }}
                  >
                    Arrivals Today
                  </div>
                  {todaysArrivals.length === 0 ? (
                    <div style={{ padding: 12, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      No arrivals scheduled for today.
                    </div>
                  ) : (
                    <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                      {todaysArrivals.map((b) => (
                        <div
                          key={b.id}
                          style={{
                            padding: '10px 14px',
                            borderBottom: '1px solid var(--border-color)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 8,
                          }}
                        >
                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                fontWeight: 600,
                                color: 'var(--text-primary)',
                                fontSize: '0.88rem',
                              }}
                            >
                              #{b.id} • {b.guest_name || b.guest_email || b.user_id}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                              {b.listing_title} • Check-in {formatDate(b.check_in)}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCheckIn(b.id)}
                            style={{
                              border: 'none',
                              borderRadius: 8,
                              padding: '6px 10px',
                              background: '#16a34a',
                              color: 'white',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            Check In
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <div
                    style={{
                      padding: '10px 14px',
                      borderBottom: '1px solid var(--border-color)',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                    }}
                  >
                    Departures Today
                  </div>
                  {todaysDepartures.length === 0 ? (
                    <div style={{ padding: 12, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      No departures scheduled for today.
                    </div>
                  ) : (
                    <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                      {todaysDepartures.map((b) => (
                        <div
                          key={b.id}
                          style={{
                            padding: '10px 14px',
                            borderBottom: '1px solid var(--border-color)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 8,
                          }}
                        >
                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                fontWeight: 600,
                                color: 'var(--text-primary)',
                                fontSize: '0.88rem',
                              }}
                            >
                              #{b.id} • {b.guest_name || b.guest_email || b.user_id}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                              {b.listing_title} • Check-out {formatDate(b.check_out)}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCheckOut(b.id)}
                            style={{
                              border: 'none',
                              borderRadius: 8,
                              padding: '6px 10px',
                              background: '#0f172a',
                              color: 'white',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            Check Out
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'listings' && (
          <div style={{ display: 'grid', gap: 10 }}>
            {listing_stats?.length ? (
              listing_stats.map((listing) => (
                <div
                  key={listing.id}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 12,
                    padding: 14,
                    display: 'flex',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 12,
                    alignItems: 'center',
                  }}
                >
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div
                      style={{
                        width: 54,
                        height: 54,
                        borderRadius: 10,
                        background: 'var(--bg-secondary)',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {listing.image_url ? (
                        <img
                          src={getImageUrl(listing.image_url)}
                          alt={listing.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        '🏨'
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{listing.title}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {listing.location} • {listing.bookings_count} bookings
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <div style={{ color: '#16a34a', fontWeight: 700 }}>{formatPKR(listing.net_earnings)}</div>
                    <button
                      type="button"
                      onClick={() => navigate(`/edit-listing/${listing.id}`)}
                      style={{
                        border: '1px solid var(--border-color)',
                        borderRadius: 8,
                        padding: '7px 12px',
                        background: 'var(--bg-secondary)',
                        cursor: 'pointer',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ color: 'var(--text-secondary)' }}>No listings yet.</div>
            )}
          </div>
        )}

        {activeTab === 'calendar' && (
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 12,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '14px 16px',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>📅 All Bookings Calendar (Monthly)</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Grouped by each day in {toMonthLabel(selectedYear, selectedMonth)}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={prevMonth}
                  style={{
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    borderRadius: 8,
                    padding: '7px 10px',
                    cursor: 'pointer',
                  }}
                >
                  ← Prev
                </button>
                <button
                  type="button"
                  onClick={nextMonth}
                  style={{
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    borderRadius: 8,
                    padding: '7px 10px',
                    cursor: 'pointer',
                  }}
                >
                  Next →
                </button>
              </div>
            </div>

            {calendarLoading ? (
              <div style={{ padding: 20, color: 'var(--text-secondary)' }}>Loading monthly bookings...</div>
            ) : calendarError ? (
              <div style={{ padding: 20, color: 'var(--danger)' }}>{calendarError}</div>
            ) : groupedByDay.length === 0 ? (
              <div style={{ padding: 20, color: 'var(--text-secondary)' }}>No bookings found for this month.</div>
            ) : (
              groupedByDay.map(([day, bookings]) => (
                <div key={day} style={{ borderTop: '1px solid var(--border-color)' }}>
                  <div
                    style={{
                      background: 'var(--bg-secondary)',
                      padding: '9px 12px',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      fontSize: '0.86rem',
                    }}
                  >
                    {formatDate(day)} • {bookings.length} booking{bookings.length > 1 ? 's' : ''}
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                      <thead>
                        <tr>
                          {['Listing', 'Guest', 'Stay', 'Status', 'Total', 'Provider'].map((h) => (
                            <th
                              key={h}
                              style={{
                                textAlign: 'left',
                                padding: '8px 12px',
                                color: 'var(--text-muted)',
                                fontSize: '0.72rem',
                                textTransform: 'uppercase',
                              }}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {bookings.map((booking) => (
                          <tr key={`${day}-${booking.id}`} style={{ borderTop: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '9px 12px', color: 'var(--text-primary)', fontWeight: 600 }}>
                              {booking.listing_title}
                            </td>
                            <td style={{ padding: '9px 12px', color: 'var(--text-secondary)' }}>{booking.guest_name}</td>
                            <td style={{ padding: '9px 12px', color: 'var(--text-secondary)' }}>
                              {formatDate(booking.check_in)} → {formatDate(booking.check_out)}
                            </td>
                            <td style={{ padding: '9px 12px' }}>
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '2px 8px',
                                  borderRadius: 999,
                                  background: booking.status === 'confirmed' ? '#dcfce7' : '#e0f2fe',
                                  color: booking.status === 'confirmed' ? '#166534' : '#0369a1',
                                  fontWeight: 700,
                                  fontSize: '0.72rem',
                                }}
                              >
                                {booking.status}
                              </span>
                            </td>
                            <td style={{ padding: '9px 12px', color: 'var(--text-secondary)' }}>
                              {formatPKR(booking.total_price)}
                            </td>
                            <td style={{ padding: '9px 12px', color: '#16a34a', fontWeight: 700 }}>
                              {formatPKR(booking.provider_amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'payouts' && (
          <div style={{ display: 'grid', gap: 14 }}>
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 12,
                padding: 16,
              }}
            >
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>💸 Request Payout</div>
              <div style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                Available balance: <strong>{formatPKR(availableBalance)}</strong>
              </div>
              <div
                style={{
                  marginTop: 8,
                  display: 'grid',
                  gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(5, minmax(120px, 1fr))',
                  gap: 8,
                }}
              >
                {[
                  { label: 'Earned', value: balanceBreakdown.total_earned, color: '#16a34a' },
                  { label: 'Pending', value: balanceBreakdown.reserved_pending, color: '#92400e' },
                  { label: 'Approved', value: balanceBreakdown.reserved_approved, color: '#1e40af' },
                  { label: 'Paid', value: balanceBreakdown.already_paid, color: '#166534' },
                  { label: 'Reserved', value: balanceBreakdown.total_reserved, color: '#475569' },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 8,
                      padding: '8px 10px',
                    }}
                  >
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{item.label}</div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: item.color }}>{formatPKR(item.value)}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gap: 10, marginTop: 12, maxWidth: 420 }}>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  placeholder="Enter amount"
                  style={{
                    borderRadius: 8,
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    padding: '10px 12px',
                  }}
                />
                <textarea
                  value={payoutNotes}
                  onChange={(e) => setPayoutNotes(e.target.value)}
                  placeholder="Optional note (e.g. bank details reference)"
                  rows={3}
                  style={{
                    borderRadius: 8,
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    padding: '10px 12px',
                    resize: 'vertical',
                  }}
                />
                <button
                  type="button"
                  onClick={requestPayout}
                  disabled={payoutLoading}
                  style={{
                    border: 'none',
                    borderRadius: 8,
                    padding: '10px 12px',
                    background: payoutLoading ? '#94a3b8' : 'linear-gradient(135deg, #0ea5e9, #2563eb)',
                    color: 'white',
                    cursor: payoutLoading ? 'not-allowed' : 'pointer',
                    fontWeight: 700,
                  }}
                >
                  {payoutLoading ? 'Submitting...' : 'Request Payout'}
                </button>
              </div>
              {payoutError ? <div style={{ marginTop: 10, color: 'var(--danger)' }}>{payoutError}</div> : null}
              {payoutSuccess ? <div style={{ marginTop: 10, color: '#16a34a' }}>{payoutSuccess}</div> : null}
            </div>

            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 12,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--border-color)',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                }}
              >
                Payout Request History
              </div>
              {payoutRequests.length === 0 ? (
                <div style={{ padding: 16, color: 'var(--text-secondary)' }}>No payout requests yet.</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-secondary)' }}>
                        {['Requested At', 'Amount', 'Status', 'Processed At', 'Notes'].map((h) => (
                          <th
                            key={h}
                            style={{
                              textAlign: 'left',
                              padding: '9px 12px',
                              color: 'var(--text-muted)',
                              fontSize: '0.72rem',
                              textTransform: 'uppercase',
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {payoutRequests.map((row) => (
                        <tr key={row.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                            {formatDate(row.requested_at)}
                          </td>
                          <td style={{ padding: '10px 12px', color: 'var(--text-primary)', fontWeight: 700 }}>
                            {formatPKR(row.amount)}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '2px 8px',
                                borderRadius: 999,
                                background:
                                  row.status === 'pending'
                                    ? '#fef3c7'
                                    : row.status === 'approved'
                                      ? '#dbeafe'
                                      : row.status === 'paid'
                                        ? '#dcfce7'
                                        : '#fee2e2',
                                color:
                                  row.status === 'pending'
                                    ? '#92400e'
                                    : row.status === 'approved'
                                      ? '#1e40af'
                                      : row.status === 'paid'
                                        ? '#166534'
                                        : '#991b1b',
                                fontWeight: 700,
                                fontSize: '0.72rem',
                              }}
                            >
                              {row.status}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                            {row.processed_at ? formatDate(row.processed_at) : '—'}
                          </td>
                          <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{row.notes || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
