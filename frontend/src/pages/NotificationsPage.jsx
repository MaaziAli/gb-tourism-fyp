import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

const NOTIF_TYPES = {
  booking: { label: 'Bookings', icon: '📅', color: '#2563eb', bg: '#dbeafe' },
  payment: { label: 'Payments', icon: '💳', color: '#16a34a', bg: '#dcfce7' },
  success: { label: 'Success', icon: '✅', color: '#16a34a', bg: '#dcfce7' },
  review: { label: 'Reviews', icon: '⭐', color: '#d97706', bg: '#fef3c7' },
  system: { label: 'System', icon: '🔔', color: '#6b7280', bg: '#f3f4f6' },
  info: { label: 'Info', icon: 'ℹ️', color: '#0891b2', bg: '#e0f2fe' },
  warning: { label: 'Warning', icon: '⚠️', color: '#d97706', bg: '#fef3c7' },
}

function timeAgo(d) {
  if (!d) return ''
  const diff = Date.now() - new Date(d).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(d).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('all')
  const [clearing, setClearing] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    loadNotifications()
  }, [])

  async function loadNotifications() {
    setLoading(true)
    try {
      const [notifRes, statsRes] = await Promise.all([
        api.get('/notifications/'),
        api.get('/notifications/stats'),
      ])
      setNotifications(notifRes.data || [])
      setStats(statsRes.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function markAllRead() {
    try {
      await api.patch('/notifications/mark-all-read')
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      if (stats) {
        setStats((prev) => (prev ? { ...prev, unread: 0 } : null))
      }
    } catch (e) {
      console.error(e)
    }
  }

  async function markRead(id) {
    try {
      await api.patch(`/notifications/${id}/read`)
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
    } catch (e) {
      console.error(e)
    }
  }

  async function deleteNotif(id) {
    try {
      await api.delete(`/notifications/${id}`)
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    } catch (e) {
      console.error(e)
    }
  }

  async function clearAll() {
    if (!window.confirm('Clear all notifications?')) return
    setClearing(true)
    try {
      await api.delete('/notifications/clear-all')
      setNotifications([])
      setStats((prev) => (prev ? { ...prev, total: 0, unread: 0, by_type: {} } : null))
    } catch (e) {
      console.error(e)
    } finally {
      setClearing(false)
    }
  }

  const filtered =
    activeFilter === 'all'
      ? notifications
      : activeFilter === 'unread'
        ? notifications.filter((n) => !n.is_read)
        : notifications.filter((n) => (n.type || 'system') === activeFilter)

  const unreadCount = notifications.filter((n) => !n.is_read).length

  const statCards = stats
    ? [
        { label: 'Total', value: stats.total || 0, color: '#6b7280', icon: '🔔', key: 'total' },
        { label: 'Unread', value: stats.unread || 0, color: '#e11d48', icon: '🔴', key: 'unread' },
        ...Object.entries(stats.by_type || {}).map(([type, count]) => ({
          key: `type-${type}`,
          label: NOTIF_TYPES[type]?.label || type,
          value: count,
          color: NOTIF_TYPES[type]?.color || '#6b7280',
          icon: NOTIF_TYPES[type]?.icon || '🔔',
        })),
      ]
    : []

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
            maxWidth: '760px',
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
              onClick={() => navigate(-1)}
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
              ← Back
            </button>
            <h1 style={{ color: 'white', margin: '0 0 6px', fontSize: '1.8rem', fontWeight: 800 }}>
              🔔 Notifications
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.75)', margin: 0, fontSize: '0.9rem' }}>
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'} · {notifications.length} total
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
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
                ✅ Mark All Read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={clearAll}
                disabled={clearing}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: 'rgba(255,255,255,0.8)',
                  borderRadius: '10px',
                  padding: '9px 16px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                }}
              >
                🗑️ Clear All
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '760px', margin: '-48px auto 0', padding: '0 16px' }}>
        {stats && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
              gap: '10px',
              marginBottom: '16px',
            }}
          >
            {statCards.map((card) => (
              <div
                key={card.key}
                style={{
                  background: 'var(--bg-card)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  boxShadow: 'var(--shadow-sm)',
                  padding: '12px',
                  textAlign: 'center',
                  borderTop: `3px solid ${card.color}`,
                }}
              >
                <div style={{ fontSize: '1rem', marginBottom: '4px' }}>{card.icon}</div>
                <div style={{ fontWeight: 800, fontSize: '1.2rem', color: card.color }}>{card.value}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {card.label}
                </div>
              </div>
            ))}
          </div>
        )}

        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-md)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: '6px',
              padding: '12px 16px',
              borderBottom: '1px solid var(--border-color)',
              overflowX: 'auto',
              scrollbarWidth: 'none',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {[
              { key: 'all', label: '🔔 All', count: notifications.length },
              { key: 'unread', label: '🔴 Unread', count: unreadCount },
              ...Object.entries(NOTIF_TYPES).map(([key, val]) => ({
                key,
                label: `${val.icon} ${val.label}`,
                count: notifications.filter((n) => (n.type || 'system') === key).length,
              })),
            ]
              .filter((f) => f.key === 'all' || f.key === 'unread' || f.count > 0)
              .map((filter) => (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setActiveFilter(filter.key)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '999px',
                    border:
                      activeFilter === filter.key ? '2px solid var(--accent)' : '1px solid var(--border-color)',
                    background: activeFilter === filter.key ? 'var(--accent-light)' : 'var(--bg-secondary)',
                    color: activeFilter === filter.key ? 'var(--accent)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontWeight: activeFilter === filter.key ? 700 : 400,
                    fontSize: '0.78rem',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  {filter.label}
                  {filter.count > 0 && (
                    <span
                      style={{
                        background: activeFilter === filter.key ? 'var(--accent)' : 'var(--border-color)',
                        color: activeFilter === filter.key ? 'white' : 'var(--text-muted)',
                        borderRadius: '999px',
                        padding: '1px 6px',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                      }}
                    >
                      {filter.count}
                    </span>
                  )}
                </button>
              ))}
          </div>

          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🔔</div>
              Loading notifications...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>{activeFilter === 'unread' ? '✅' : '🔔'}</div>
              <h3 style={{ margin: '0 0 6px', color: 'var(--text-primary)' }}>
                {activeFilter === 'unread' ? "You're all caught up!" : 'No notifications'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
                {activeFilter === 'unread'
                  ? 'All notifications have been read'
                  : 'Nothing here yet'}
              </p>
            </div>
          ) : (
            <div>
              {filtered.map((notif, i) => {
                const typeInfo = NOTIF_TYPES[notif.type || 'system'] || NOTIF_TYPES.system
                return (
                  <div
                    key={notif.id}
                    role="button"
                    tabIndex={0}
                    style={{
                      display: 'flex',
                      gap: '12px',
                      padding: '14px 16px',
                      borderBottom: i < filtered.length - 1 ? '1px solid var(--border-color)' : 'none',
                      background: notif.is_read ? 'transparent' : `${typeInfo.bg}44`,
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                    onClick={() => {
                      if (!notif.is_read) markRead(notif.id)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        if (!notif.is_read) markRead(notif.id)
                      }
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--bg-secondary)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = notif.is_read ? 'transparent' : `${typeInfo.bg}44`
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: typeInfo.bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.1rem',
                        flexShrink: 0,
                      }}
                    >
                      {typeInfo.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          gap: '8px',
                          marginBottom: '3px',
                        }}
                      >
                        <div
                          style={{
                            fontWeight: notif.is_read ? 600 : 700,
                            fontSize: '0.875rem',
                            color: 'var(--text-primary)',
                            flex: 1,
                          }}
                        >
                          {notif.title}
                          {!notif.is_read && (
                            <span
                              style={{
                                display: 'inline-block',
                                width: 7,
                                height: 7,
                                borderRadius: '50%',
                                background: 'var(--accent)',
                                marginLeft: '6px',
                                verticalAlign: 'middle',
                              }}
                            />
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '6px', flexShrink: 0, alignItems: 'center' }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                            {timeAgo(notif.created_at)}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteNotif(notif.id)
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              fontSize: '0.9rem',
                              padding: '2px 4px',
                              borderRadius: '4px',
                              opacity: 0.6,
                            }}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {notif.message}
                      </p>
                      <div style={{ marginTop: '5px' }}>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            background: typeInfo.bg,
                            color: typeInfo.color,
                            padding: '1px 7px',
                            borderRadius: '999px',
                            fontWeight: 600,
                          }}
                        >
                          {typeInfo.icon} {typeInfo.label}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
