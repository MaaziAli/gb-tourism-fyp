import { useState, useEffect } from 'react'
import api from '../api/axios'
import { useAvailabilitySocket } from '../hooks/useAvailabilitySocket'

const DAYS = ['Su', 'Mo', 'Tu', 'We',
               'Th', 'Fr', 'Sa']
const MONTHS = [
  'January','February','March','April',
  'May','June','July','August',
  'September','October','November','December'
]

export default function AvailabilityCalendar({
  listingId,
  mode = 'view',
  onDateSelect,
  selectedCheckIn,
  selectedCheckOut,
}) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [currentYear, setCurrentYear] =
    useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] =
    useState(today.getMonth() + 1)
  const [blockedDates, setBlockedDates] =
    useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDates, setSelectedDates] =
    useState([])
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    loadMonth(currentYear, currentMonth)
  }, [currentYear, currentMonth, listingId])

  // Real-time availability: re-fetch current month when another user books
  useAvailabilitySocket(listingId, () => {
    loadMonth(currentYear, currentMonth)
  })

  async function loadMonth(y, m) {
    setLoading(true)
    try {
      const res = await api.get(
        `/availability/${listingId}`,
        { params: { year: y, month: m } }
      )
      setBlockedDates(
        [...new Set(
          (res.data.blocked_dates || []).map(b => b.date)
        )]
      )
    } catch(e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  function prevMonth() {
    if (currentMonth === 1) {
      setCurrentYear(y => y - 1)
      setCurrentMonth(12)
    } else {
      setCurrentMonth(m => m - 1)
    }
  }

  function nextMonth() {
    if (currentMonth === 12) {
      setCurrentYear(y => y + 1)
      setCurrentMonth(1)
    } else {
      setCurrentMonth(m => m + 1)
    }
  }

  function getDaysInMonth(y, m) {
    return new Date(y, m, 0).getDate()
  }

  function getFirstDayOfMonth(y, m) {
    return new Date(y, m - 1, 1).getDay()
  }

  function formatDate(y, m, d) {
    return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`
  }

  function isPast(y, m, d) {
    const date = new Date(y, m - 1, d)
    return date < today
  }

  function isBlocked(dateStr) {
    return blockedDates.includes(dateStr)
  }

  function isSelected(dateStr) {
    return selectedDates.includes(dateStr)
  }

  function isCheckIn(dateStr) {
    return dateStr === selectedCheckIn
  }

  function isCheckOut(dateStr) {
    return dateStr === selectedCheckOut
  }

  function isInRange(dateStr) {
    if (!selectedCheckIn || !selectedCheckOut)
      return false
    return dateStr > selectedCheckIn &&
           dateStr < selectedCheckOut
  }

  function handleDayClick(dateStr) {
    if (mode === 'view') {
      if (onDateSelect) onDateSelect(dateStr)
      return
    }
    if (isSelected(dateStr)) {
      setSelectedDates(prev =>
        prev.filter(d => d !== dateStr)
      )
    } else {
      setSelectedDates(prev => [...prev, dateStr])
    }
  }

  async function blockSelected() {
    if (selectedDates.length === 0) return
    const n = selectedDates.length
    const toBlock = [...selectedDates]
    setSaving(true)
    try {
      await api.post(
        `/availability/${listingId}/block`,
        { dates: toBlock, reason: 'blocked' }
      )
      setBlockedDates(prev => [
        ...new Set([...prev, ...toBlock])
      ])
      setSelectedDates([])
      setMsg(`✅ ${n} dates blocked`)
    } catch(e) {
      setMsg('❌ Failed to block dates')
    } finally {
      setSaving(false)
    }
  }

  async function unblockSelected() {
    if (selectedDates.length === 0) return
    const n = selectedDates.length
    const toUnblock = [...selectedDates]
    setSaving(true)
    try {
      await api.post(
        `/availability/${listingId}/unblock`,
        { dates: toUnblock }
      )
      setBlockedDates(prev =>
        prev.filter(d => !toUnblock.includes(d))
      )
      setSelectedDates([])
      setMsg(
        `✅ ${n} dates unblocked`
      )
    } catch(e) {
      setMsg('❌ Failed to unblock dates')
    } finally {
      setSaving(false)
    }
  }

  const daysInMonth =
    getDaysInMonth(currentYear, currentMonth)
  const firstDay =
    getFirstDayOfMonth(currentYear, currentMonth)
  const cells = []

  for (let i = 0; i < firstDay; i++) {
    cells.push(null)
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(d)
  }

  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px'
      }}>
        <button type="button" onClick={prevMonth} style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px', padding: '6px 12px',
          cursor: 'pointer', fontWeight: 700,
          color: 'var(--text-primary)',
          fontSize: '0.9rem'
        }}>
          ‹
        </button>
        <span style={{
          fontWeight: 700, fontSize: '1rem',
          color: 'var(--text-primary)'
        }}>
          {MONTHS[currentMonth - 1]} {currentYear}
        </span>
        <button type="button" onClick={nextMonth} style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px', padding: '6px 12px',
          cursor: 'pointer', fontWeight: 700,
          color: 'var(--text-primary)',
          fontSize: '0.9rem'
        }}>
          ›
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '2px', marginBottom: '4px'
      }}>
        {DAYS.map(d => (
          <div key={d} style={{
            textAlign: 'center',
            fontSize: '0.72rem', fontWeight: 700,
            color: 'var(--text-muted)',
            padding: '4px 0'
          }}>
            {d}
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{
          textAlign: 'center', padding: '32px',
          color: 'var(--text-muted)',
          fontSize: '0.875rem'
        }}>
          Loading...
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '2px'
        }}>
          {cells.map((day, idx) => {
            if (!day) return (
              <div key={`empty-${idx}`} />
            )
            const dateStr = formatDate(
              currentYear, currentMonth, day
            )
            const past = isPast(
              currentYear, currentMonth, day
            )
            const blocked = isBlocked(dateStr)
            const selected = isSelected(dateStr)
            const checkIn = isCheckIn(dateStr)
            const checkOut = isCheckOut(dateStr)
            const inRange = isInRange(dateStr)

            let bg = 'var(--bg-secondary)'
            let color = 'var(--text-primary)'
            let border =
              '1px solid var(--border-color)'
            let cursor = 'pointer'
            let opacity = 1
            let fontWeight = 400

            if (past) {
              bg = 'transparent'
              color = 'var(--text-muted)'
              cursor = 'default'
              opacity = 0.4
            } else if (blocked) {
              bg = '#fee2e2'
              color = '#dc2626'
              border = '1px solid #fecaca'
              cursor = mode === 'manage'
                ? 'pointer' : 'not-allowed'
            } else if (checkIn || checkOut) {
              bg = 'var(--accent)'
              color = 'white'
              border = 'none'
              fontWeight = 700
            } else if (inRange) {
              bg = 'var(--accent-light)'
              color = 'var(--accent)'
              border = 'none'
            } else if (selected) {
              bg = '#fef3c7'
              color = '#d97706'
              border = '1px solid #f59e0b'
              fontWeight = 700
            }

            return (
              <div key={dateStr}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    if (!past && (
                      !blocked || mode === 'manage'
                    )) {
                      handleDayClick(dateStr)
                    }
                  }
                }}
                onClick={() => {
                  if (!past && (
                    !blocked || mode === 'manage'
                  )) {
                    handleDayClick(dateStr)
                  }
                }}
                style={{
                  textAlign: 'center',
                  padding: '7px 4px',
                  borderRadius: '8px',
                  background: bg, color,
                  border, cursor, opacity,
                  fontWeight,
                  fontSize: '0.82rem',
                  transition: 'all 0.1s',
                  userSelect: 'none'
                }}
              >
                {day}
              </div>
            )
          })}
        </div>
      )}

      <div style={{
        display: 'flex', gap: '12px',
        flexWrap: 'wrap', marginTop: '12px',
        fontSize: '0.72rem',
        color: 'var(--text-muted)'
      }}>
        <span style={{
          display: 'flex', alignItems: 'center',
          gap: '4px'
        }}>
          <span style={{
            width: 12, height: 12,
            borderRadius: '3px',
            background: '#fee2e2', display: 'block'
          }} />
          Unavailable
        </span>
        <span style={{
          display: 'flex', alignItems: 'center',
          gap: '4px'
        }}>
          <span style={{
            width: 12, height: 12,
            borderRadius: '3px',
            background: 'var(--accent)',
            display: 'block'
          }} />
          Selected
        </span>
        {mode === 'manage' && (
          <span style={{
            display: 'flex', alignItems: 'center',
            gap: '4px'
          }}>
            <span style={{
              width: 12, height: 12,
              borderRadius: '3px',
              background: '#fef3c7', display: 'block'
            }} />
            To block
          </span>
        )}
      </div>

      {mode === 'manage' && (
        <div style={{marginTop: '16px'}}>
          {selectedDates.length > 0 && (
            <p style={{
              margin: '0 0 10px',
              fontSize: '0.82rem',
              color: 'var(--text-secondary)'
            }}>
              {selectedDates.length} date
              {selectedDates.length > 1 ? 's' : ''}
              {' '}selected
            </p>
          )}
          <div style={{
            display: 'flex', gap: '8px',
            flexWrap: 'wrap'
          }}>
            <button
              type="button"
              onClick={blockSelected}
              disabled={
                saving || selectedDates.length === 0
              }
              style={{
                padding: '8px 18px',
                borderRadius: '8px', border: 'none',
                background: '#dc2626',
                color: 'white', fontWeight: 600,
                cursor: selectedDates.length === 0
                  ? 'not-allowed' : 'pointer',
                opacity: selectedDates.length === 0
                  ? 0.5 : 1,
                fontSize: '0.85rem'
              }}
            >
              🚫 Block Selected
            </button>
            <button
              type="button"
              onClick={unblockSelected}
              disabled={
                saving || selectedDates.length === 0
              }
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-secondary)',
                fontWeight: 600,
                cursor: selectedDates.length === 0
                  ? 'not-allowed' : 'pointer',
                opacity: selectedDates.length === 0
                  ? 0.5 : 1,
                fontSize: '0.85rem'
              }}
            >
              ✅ Unblock Selected
            </button>
            {selectedDates.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedDates([])}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '0.85rem'
                }}
              >
                Clear
              </button>
            )}
          </div>
          {msg && (
            <p style={{
              margin: '10px 0 0',
              fontSize: '0.85rem',
              color: msg.startsWith('✅')
                ? 'var(--success)'
                : 'var(--danger)'
            }}>
              {msg}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
