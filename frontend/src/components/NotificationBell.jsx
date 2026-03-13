import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { isLoggedIn } from '../utils/role'

export default function NotificationBell() {
  const [count, setCount] = useState(0)
  const [notifs, setNotifs] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const dropRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoggedIn()) return
    fetchCount()
    const interval = setInterval(fetchCount, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    function handleClick(e) {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function fetchCount() {
    try {
      const res = await api.get('/notifications/unread-count')
      setCount(res.data.count)
    } catch (e) {
      // ignore
    }
  }

  async function openPanel() {
    if (open) {
      setOpen(false)
      return
    }
    setOpen(true)
    setLoading(true)
    try {
      const res = await api.get('/notifications/')
      setNotifs(res.data)
      if (count > 0) {
        await api.patch('/notifications/mark-all-read')
        setCount(0)
      }
    } catch (e) {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  async function deleteNotif(e, id) {
    e.stopPropagation()
    try {
      await api.delete(`/notifications/${id}`)
      setNotifs((prev) => prev.filter((n) => n.id !== id))
    } catch (e) {
      // ignore
    }
  }

  function typeIcon(type) {
    switch (type) {
      case 'success':
        return '✅'
      case 'booking':
        return '📅'
      case 'warning':
        return '⚠️'
      case 'review':
        return '⭐'
      default:
        return 'ℹ️'
    }
  }

  function timeAgo(dateStr) {
    if (!dateStr) return ''
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  if (!isLoggedIn()) return null

  return (
    <div ref={dropRef} style={{ position: 'relative' }}>
      <button
        onClick={openPanel}
        style={{
          position: 'relative',
          background: 'rgba(255,255,255,0.15)',
          border: 'none',
          borderRadius: '50%',
          width: '38px',
          height: '38px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.1rem',
          color: 'white',
          transition: 'background 0.2s',
        }}
        title="Notifications"
      >
        🔔
        {count > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '2px',
              right: '2px',
              background: '#ef4444',
              color: 'white',
              borderRadius: '50%',
              width: '16px',
              height: '16px',
              fontSize: '0.65rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
            }}
          >
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: '48px',
            right: 0,
            width: '360px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-md)',
            zIndex: 1000,
            overflow: 'hidden',
            maxHeight: '480px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              padding: '14px 18px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                fontWeight: 700,
                fontSize: '0.95rem',
                color: 'var(--text-primary)',
              }}
            >
              🔔 Notifications
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
              }}
            >
              {notifs.length} total
            </span>
          </div>

          <div style={{ overflowY: 'auto', flex: 1 }}>
            {loading ? (
              <div
                style={{
                  padding: '32px',
                  textAlign: 'center',
                  color: 'var(--text-secondary)',
                }}
              >
                Loading...
              </div>
            ) : notifs.length === 0 ? (
              <div
                style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  color: 'var(--text-secondary)',
                }}
              >
                <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>
                  🔕
                </div>
                <p style={{ margin: 0, fontSize: '0.875rem' }}>
                  No notifications yet
                </p>
              </div>
            ) : (
              notifs.map((n, i) => (
                <div
                  key={n.id}
                  style={{
                    padding: '12px 16px',
                    borderBottom:
                      i < notifs.length - 1
                        ? '1px solid var(--border-color)'
                        : 'none',
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'flex-start',
                    background: n.is_read
                      ? 'transparent'
                      : 'var(--accent-light)',
                    transition: 'background 0.2s',
                  }}
                >
                  <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>
                    {typeIcon(n.type)}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: '0.825rem',
                        color: 'var(--text-primary)',
                        marginBottom: '2px',
                      }}
                    >
                      {n.title}
                    </div>
                    <div
                      style={{
                        fontSize: '0.775rem',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.5,
                        wordBreak: 'break-word',
                      }}
                    >
                      {n.message}
                    </div>
                    <div
                      style={{
                        fontSize: '0.7rem',
                        color: 'var(--text-muted)',
                        marginTop: '4px',
                      }}
                    >
                      {timeAgo(n.created_at)}
                    </div>
                  </div>
                  <button
                    onClick={(e) => deleteNotif(e, n.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      padding: '0 2px',
                      flexShrink: 0,
                      lineHeight: 1,
                    }}
                    title="Dismiss"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

