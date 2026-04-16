/**
 * ProviderCalendar — Visual calendar for provider to see bookings and
 * manually block/unblock date ranges for maintenance.
 *
 * Route: /provider/calendar/:listingId
 *
 * Uses existing endpoints:
 *   GET  /availability/{id}?year=&month=  → booked + manually blocked dates
 *   GET  /bookings/listing/{id}/bookings  → booking details with guest info
 *   POST /availability/{id}/block         → block a list of date strings
 *   POST /availability/{id}/unblock       → unblock a list of date strings
 */
import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

// ── date helpers ─────────────────────────────────────────────────────────────

function toDateStr(year, month, day) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function datesBetween(start, end) {
  const dates = []
  const cur = new Date(start + 'T00:00:00')
  const last = new Date(end + 'T00:00:00')
  while (cur <= last) {
    dates.push(cur.toISOString().slice(0, 10))
    cur.setDate(cur.getDate() + 1)
  }
  return dates
}

function buildCalendarGrid(year, month) {
  // Returns array of { date: "YYYY-MM-DD" | null, day: number | null }
  const firstDay = new Date(year, month - 1, 1).getDay() // 0=Sun
  const daysInMonth = new Date(year, month, 0).getDate()
  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: toDateStr(year, month, d), day: d })
  }
  // Pad to full rows
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

// ── Legend item ──────────────────────────────────────────────────────────────

function LegendDot({ color, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
      <div style={{ width: 12, height: 12, borderRadius: 3, background: color, flexShrink: 0 }} />
      {label}
    </div>
  )
}

// ── BlockModal ────────────────────────────────────────────────────────────────

function BlockModal({ startDate, endDate, onConfirm, onCancel, saving }) {
  const [reason, setReason] = useState('maintenance')
  const count = startDate && endDate ? datesBetween(startDate, endDate).length : 1

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9000, padding: 16,
    }}>
      <div style={{
        background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)', width: '100%', maxWidth: 420,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        <div style={{
          padding: '18px 22px', borderBottom: '1px solid var(--border-color)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <h3 style={{ margin: 0, fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>
            Block Dates for Maintenance
          </h3>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
        </div>

        <div style={{ padding: '20px 22px' }}>
          <div style={{
            background: 'var(--bg-secondary)', borderRadius: 8, padding: '12px 14px', marginBottom: 16,
            fontSize: '0.875rem', color: 'var(--text-primary)',
          }}>
            <div><strong>From:</strong> {startDate}</div>
            <div><strong>To:</strong> {endDate || startDate}</div>
            <div style={{ color: 'var(--text-secondary)', marginTop: 4 }}>{count} day{count !== 1 ? 's' : ''} will be blocked</div>
          </div>

          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase' }}>
            Reason
          </label>
          <select
            value={reason}
            onChange={e => setReason(e.target.value)}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 8,
              border: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
              color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none',
              boxSizing: 'border-box', marginBottom: 16,
            }}
          >
            <option value="maintenance">Maintenance</option>
            <option value="renovation">Renovation</option>
            <option value="private">Private use</option>
            <option value="cleaning">Deep cleaning</option>
            <option value="other">Other</option>
          </select>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => onConfirm(reason)}
              disabled={saving}
              style={{
                flex: 1, padding: '11px', borderRadius: 8, border: 'none',
                background: saving ? '#9ca3af' : 'linear-gradient(135deg, #1e3a5f, #0ea5e9)',
                color: 'white', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? 'Blocking…' : 'Block Dates'}
            </button>
            <button
              onClick={onCancel}
              style={{
                flex: 1, padding: '11px', borderRadius: 8,
                border: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
                color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── UnblockModal ─────────────────────────────────────────────────────────────

function UnblockModal({ date, reason, onConfirm, onCancel, saving }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9000, padding: 16,
    }}>
      <div style={{
        background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)', width: '100%', maxWidth: 380,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border-color)' }}>
          <h3 style={{ margin: 0, fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>
            Unblock This Date?
          </h3>
        </div>
        <div style={{ padding: '20px 22px' }}>
          <p style={{ margin: '0 0 16px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            <strong>{date}</strong> is currently blocked ({reason}). Remove the block to make it available again?
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={onConfirm}
              disabled={saving}
              style={{
                flex: 1, padding: '11px', borderRadius: 8, border: 'none',
                background: saving ? '#9ca3af' : '#16a34a',
                color: 'white', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? 'Unblocking…' : 'Unblock'}
            </button>
            <button onClick={onCancel} style={{
              flex: 1, padding: '11px', borderRadius: 8,
              border: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
              color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer',
            }}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ProviderCalendar() {
  const { listingId } = useParams()
  const navigate = useNavigate()

  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1) // 1-indexed
  const [listingTitle, setListingTitle] = useState('')

  // { date: { type: "manual"|"booking", reason, bookings: [] } }
  const [dateMap, setDateMap] = useState({})
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Range selection
  const [selStart, setSelStart] = useState(null) // "YYYY-MM-DD"
  const [selEnd, setSelEnd] = useState(null)
  const [hoverDate, setHoverDate] = useState(null)

  // Modals
  const [blockModal, setBlockModal] = useState(false)
  const [unblockModal, setUnblockModal] = useState(null) // { date, reason }
  const [saving, setSaving] = useState(false)

  // Seasonal pricing preview: dateStr → { effective_price, applied_rules }
  const [seasonalPrices, setSeasonalPrices] = useState({})
  const [loadingSeasonal, setLoadingSeasonal] = useState(false)

  // ── Fetch data ──────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [availRes, bookingsRes, listingRes] = await Promise.all([
        api.get(`/availability/${listingId}?year=${year}&month=${month}`),
        api.get(`/bookings/listing/${listingId}/bookings`),
        api.get(`/listings/${listingId}`),
      ])

      setListingTitle(listingRes.data.title || `Listing #${listingId}`)

      const allBookings = bookingsRes.data || []
      setBookings(allBookings)

      // Build dateMap: date string → { type, reason, bookings[] }
      const map = {}

      // Manual blocks from availability endpoint
      for (const item of (availRes.data.blocked_dates || [])) {
        if (item.type === 'manual') {
          map[item.date] = { type: 'manual', reason: item.reason || 'blocked', bookings: [] }
        }
      }

      // Overlay actual bookings onto the date map
      for (const b of allBookings) {
        if (!b.check_in || !b.check_out || b.status === 'cancelled') continue
        const dates = datesBetween(b.check_in, b.check_out.slice(0, 10) > b.check_in
          ? (() => {
              const d = new Date(b.check_out + 'T00:00:00')
              d.setDate(d.getDate() - 1)
              return d.toISOString().slice(0, 10)
            })()
          : b.check_in
        )
        for (const d of dates) {
          if (!map[d]) map[d] = { type: 'booking', reason: 'booked', bookings: [] }
          if (map[d].type !== 'manual') map[d].type = 'booking'
          map[d].bookings = map[d].bookings || []
          map[d].bookings.push(b)
        }
      }

      setDateMap(map)
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to load calendar')
    } finally {
      setLoading(false)
    }
  }, [listingId, year, month])

  useEffect(() => { fetchData() }, [fetchData])

  // ── Fetch seasonal prices ────────────────────────────────────────────────
  const fetchSeasonalPrices = useCallback(async (y, m) => {
    setLoadingSeasonal(true)
    try {
      const res = await api.get(`/listings/${listingId}/seasonal-prices/calendar`, {
        params: { year: y, month: m },
      })
      const priceMap = {}
      ;(res.data.dates || []).forEach(d => {
        priceMap[d.date] = {
          effective_price: d.effective_price,
          applied_rules: d.applied_rules,
        }
      })
      setSeasonalPrices(priceMap)
    } catch (e) {
      console.error('Failed to fetch seasonal prices', e)
    } finally {
      setLoadingSeasonal(false)
    }
  }, [listingId])

  useEffect(() => {
    if (listingId) fetchSeasonalPrices(year, month)
  }, [year, month, listingId, fetchSeasonalPrices])

  // ── Date clicking ────────────────────────────────────────────────────────
  function handleDateClick(dateStr) {
    const info = dateMap[dateStr]

    // If it's manually blocked — offer to unblock
    if (info?.type === 'manual') {
      setUnblockModal({ date: dateStr, reason: info.reason })
      return
    }

    // If booked — do nothing (can't block over a booking)
    if (info?.type === 'booking') return

    // Otherwise: range selection
    if (!selStart) {
      setSelStart(dateStr)
      setSelEnd(null)
    } else if (!selEnd) {
      const end = dateStr >= selStart ? dateStr : selStart
      const start = dateStr >= selStart ? selStart : dateStr
      setSelStart(start)
      setSelEnd(end)
      setBlockModal(true)
    } else {
      // Reset selection
      setSelStart(dateStr)
      setSelEnd(null)
    }
  }

  // ── Block confirm ────────────────────────────────────────────────────────
  async function handleBlock(reason) {
    setSaving(true)
    try {
      const dates = datesBetween(selStart, selEnd || selStart)
      await api.post(`/availability/${listingId}/block`, { dates, reason })
      setBlockModal(false)
      setSelStart(null)
      setSelEnd(null)
      fetchData()
    } catch (e) {
      alert(e.response?.data?.detail || 'Block failed')
    } finally {
      setSaving(false)
    }
  }

  // ── Unblock confirm ──────────────────────────────────────────────────────
  async function handleUnblock() {
    if (!unblockModal) return
    setSaving(true)
    try {
      await api.post(`/availability/${listingId}/unblock`, { dates: [unblockModal.date] })
      setUnblockModal(null)
      fetchData()
    } catch (e) {
      alert(e.response?.data?.detail || 'Unblock failed')
    } finally {
      setSaving(false)
    }
  }

  // ── Month nav ─────────────────────────────────────────────────────────────
  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
    setSelStart(null); setSelEnd(null)
  }
  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
    setSelStart(null); setSelEnd(null)
  }

  // ── Cell colour helper ────────────────────────────────────────────────────
  function cellStyle(dateStr) {
    const todayStr = now.toISOString().slice(0, 10)
    const info = dateMap[dateStr]
    const isToday = dateStr === todayStr
    const isPast = dateStr < todayStr

    let bg = 'transparent'
    let color = 'var(--text-primary)'
    let fontWeight = 400
    let border = '1px solid transparent'

    if (info?.type === 'manual') {
      bg = '#e5e7eb'; color = '#6b7280'; fontWeight = 600
    } else if (info?.type === 'booking') {
      bg = '#fecaca'; color = '#b91c1c'; fontWeight = 700
    }

    // Selection highlight
    const selMin = selStart && selEnd ? (selStart < selEnd ? selStart : selEnd) : selStart
    const selMax = selStart && selEnd ? (selStart < selEnd ? selEnd : selStart) : selStart
    const inSel = selMin && dateStr >= selMin && (!selMax || dateStr <= selMax)
    const inHover = selStart && !selEnd && hoverDate && dateStr >= (selStart < hoverDate ? selStart : hoverDate) && dateStr <= (selStart < hoverDate ? hoverDate : selStart)

    if (inSel) { bg = '#bfdbfe'; color = '#1e40af'; fontWeight = 700 }
    else if (inHover) { bg = '#e0f2fe'; color = '#0369a1' }

    if (isToday && !inSel) border = '2px solid var(--accent, #2563eb)'
    if (isPast) { color = info ? color : 'var(--text-muted)' }

    return { bg, color, fontWeight, border, isPast, isToday }
  }

  const cells = buildCalendarGrid(year, month)
  const todayStr = now.toISOString().slice(0, 10)

  // Counts for the summary strip
  const bookedCount = Object.values(dateMap).filter(v => v.type === 'booking').length
  const blockedCount = Object.values(dateMap).filter(v => v.type === 'manual').length

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingBottom: 48 }}>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #0ea5e9 100%)', padding: '28px 16px 72px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)',
              color: 'white', borderRadius: 8, padding: '6px 14px', cursor: 'pointer',
              fontSize: '0.82rem', fontWeight: 600, marginBottom: 16,
            }}
          >
            ← Back
          </button>
          <h1 style={{ color: 'white', margin: '0 0 4px', fontSize: '1.6rem', fontWeight: 800 }}>
            Booking Calendar
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', margin: 0, fontSize: '0.9rem' }}>
            {listingTitle}
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '-52px auto 0', padding: '0 16px' }}>

        {/* Legend + summary strip */}
        <div style={{
          background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)',
          padding: '14px 20px', marginBottom: 16,
          display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
            <LegendDot color="#fecaca" label="Booked" />
            <LegendDot color="#e5e7eb" label="Blocked (maintenance)" />
            <LegendDot color="#bfdbfe" label="Selected range" />
            <LegendDot color="transparent" label="Available" />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              <span style={{ color: '#d97706', fontWeight: 700, fontSize: '0.7rem' }}>PKR</span>
              Seasonal price applied
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16, fontSize: '0.82rem' }}>
            <span style={{ color: '#b91c1c', fontWeight: 700 }}>{bookedCount} booked days</span>
            <span style={{ color: '#6b7280', fontWeight: 700 }}>{blockedCount} blocked days</span>
          </div>
        </div>

        {/* Calendar card */}
        <div style={{
          background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)',
          overflow: 'hidden',
        }}>
          {/* Month navigation */}
          <div style={{
            padding: '16px 20px', borderBottom: '1px solid var(--border-color)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <button
              onClick={prevMonth}
              style={{
                background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                borderRadius: 8, padding: '8px 14px', cursor: 'pointer',
                color: 'var(--text-primary)', fontWeight: 600, fontSize: '1rem',
              }}
            >
              ‹
            </button>
            <h2 style={{ margin: 0, fontWeight: 800, color: 'var(--text-primary)', fontSize: '1.1rem' }}>
              {MONTH_NAMES[month - 1]} {year}
            </h2>
            <button
              onClick={nextMonth}
              style={{
                background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                borderRadius: 8, padding: '8px 14px', cursor: 'pointer',
                color: 'var(--text-primary)', fontWeight: 600, fontSize: '1rem',
              }}
            >
              ›
            </button>
          </div>

          {loading ? (
            <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-secondary)' }}>
              Loading calendar…
            </div>
          ) : error ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--danger)' }}>{error}</div>
          ) : (
            <div style={{ padding: '0 8px 16px' }}>
              {/* Day headers */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
                {DAY_LABELS.map(d => (
                  <div key={d} style={{
                    textAlign: 'center', padding: '10px 4px 6px',
                    fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}>
                    {d}
                  </div>
                ))}
              </div>

              {/* Day cells */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
                {cells.map((cell, idx) => {
                  if (!cell) return <div key={`empty-${idx}`} />

                  const { date } = cell
                  const cs = cellStyle(date)
                  const info = dateMap[date]
                  const isPast = date < todayStr
                  const isBooked = info?.type === 'booking'
                  const isManual = info?.type === 'manual'
                  const isClickable = !isPast || isManual

                  const priceInfo = seasonalPrices[date]
                  const hasSeasonalRule = priceInfo?.applied_rules?.length > 0
                  const formattedPrice = priceInfo
                    ? (priceInfo.effective_price >= 1000
                        ? `PKR ${(priceInfo.effective_price / 1000).toFixed(1)}K`
                        : `PKR ${priceInfo.effective_price}`)
                    : null

                  const seasonalTooltip = priceInfo
                    ? (hasSeasonalRule
                        ? priceInfo.applied_rules.map(r =>
                            `${r.name}: ${r.multiplier}x${r.surcharge ? ` + PKR ${r.surcharge}` : ''}`
                          ).join('\n')
                        : 'Base price (no seasonal rules)')
                    : null

                  const cellTitle = isManual
                    ? `Blocked: ${info.reason}`
                    : isBooked
                    ? info.bookings?.map(b => `${b.guest_name} (${b.check_in} → ${b.check_out})`).join('\n')
                    : seasonalTooltip || (isPast ? '' : 'Click to start blocking')

                  return (
                    <div
                      key={date}
                      title={cellTitle}
                      onClick={() => isClickable && handleDateClick(date)}
                      onMouseEnter={() => !selEnd && selStart && setHoverDate(date)}
                      onMouseLeave={() => setHoverDate(null)}
                      style={{
                        background: cs.bg,
                        color: cs.color,
                        fontWeight: cs.fontWeight,
                        border: cs.border,
                        borderRadius: 8,
                        padding: '8px 4px',
                        textAlign: 'center',
                        fontSize: '0.88rem',
                        cursor: isClickable ? 'pointer' : 'default',
                        opacity: isPast && !isManual && !isBooked ? 0.35 : 1,
                        transition: 'background 0.1s',
                        minHeight: 42,
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'flex-start',
                        gap: 2,
                        position: 'relative',
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>{cell.day}</span>
                      {!loadingSeasonal && formattedPrice && (
                        <span style={{
                          fontSize: '0.6rem',
                          color: hasSeasonalRule ? '#d97706' : 'var(--text-secondary)',
                          fontWeight: hasSeasonalRule ? 700 : 400,
                          marginTop: '1px',
                          whiteSpace: 'nowrap',
                          lineHeight: 1.2,
                        }}>
                          {formattedPrice}
                        </span>
                      )}
                      {isBooked && (
                        <div style={{
                          width: 6, height: 6, borderRadius: '50%',
                          background: '#ef4444', flexShrink: 0,
                        }} />
                      )}
                      {isManual && (
                        <div style={{ fontSize: '0.55rem', color: '#6b7280', lineHeight: 1 }}>
                          🔒
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Selection hint */}
        {selStart && !blockModal && (
          <div style={{
            marginTop: 12, padding: '10px 16px',
            background: '#eff6ff', border: '1px solid #bfdbfe',
            borderRadius: 8, fontSize: '0.85rem', color: '#1e40af', fontWeight: 600,
          }}>
            Start: <strong>{selStart}</strong> — now click an end date to block a range.{' '}
            <button
              onClick={() => { setSelStart(null); setSelEnd(null) }}
              style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '0.82rem', marginLeft: 8 }}
            >
              Cancel selection
            </button>
          </div>
        )}

        {/* Booking list for this month */}
        {bookings.length > 0 && (
          <div style={{
            marginTop: 20,
            background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)',
            overflow: 'hidden',
          }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-color)' }}>
              <h3 style={{ margin: 0, fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                Bookings in {MONTH_NAMES[month - 1]} {year}
              </h3>
            </div>
            <div>
              {bookings
                .filter(b => {
                  if (!b.check_in || b.status === 'cancelled') return false
                  const prefix = `${year}-${String(month).padStart(2, '0')}`
                  return b.check_in.startsWith(prefix) || b.check_out?.startsWith(prefix)
                })
                .map(b => (
                  <div key={b.id} style={{
                    padding: '12px 20px', borderBottom: '1px solid var(--border-color)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    flexWrap: 'wrap', gap: 8,
                  }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                        {b.guest_name}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        {b.check_in} → {b.check_out} · {b.nights} night{b.nights !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{
                        fontSize: '0.78rem', fontWeight: 700, padding: '3px 10px', borderRadius: 999,
                        background: b.status === 'confirmed' ? '#dcfce7' : '#fef3c7',
                        color: b.status === 'confirmed' ? '#166534' : '#92400e',
                      }}>
                        {b.status}
                      </span>
                      <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                        PKR {(b.total_price || 0).toLocaleString('en-PK')}
                      </span>
                    </div>
                  </div>
                ))}
              {bookings.filter(b => {
                if (!b.check_in || b.status === 'cancelled') return false
                const prefix = `${year}-${String(month).padStart(2, '0')}`
                return b.check_in.startsWith(prefix) || b.check_out?.startsWith(prefix)
              }).length === 0 && (
                <div style={{ padding: '24px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  No bookings this month
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {blockModal && (
        <BlockModal
          startDate={selStart}
          endDate={selEnd}
          onConfirm={handleBlock}
          onCancel={() => { setBlockModal(false); setSelStart(null); setSelEnd(null) }}
          saving={saving}
        />
      )}
      {unblockModal && (
        <UnblockModal
          date={unblockModal.date}
          reason={unblockModal.reason}
          onConfirm={handleUnblock}
          onCancel={() => setUnblockModal(null)}
          saving={saving}
        />
      )}
    </div>
  )
}
