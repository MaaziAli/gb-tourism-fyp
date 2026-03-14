import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { getRole } from '../utils/role'

export default function Profile() {
  const [user, setUser] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [fullName, setFullName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [showDelete, setShowDelete] = useState(false)
  const navigate = useNavigate()
  const role = getRole() || 'user'

  useEffect(() => {
    fetchProfile()
    fetchStats()
  }, [])

  async function fetchProfile() {
    try {
      const res = await api.get('/users/me')
      setUser(res.data)
      setFullName(res.data.full_name)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function fetchStats() {
    try {
      if (role === 'provider') {
        const [listRes, bookRes] = await Promise.all([
          api.get('/listings/me'),
          api.get('/bookings/provider/revenue'),
        ])
        setStats({
          listings: listRes.data.length,
          revenue: bookRes.data.total_revenue || 0,
        })
      } else if (role === 'user') {
        const res = await api.get('/bookings/me')
        setStats({ bookings: res.data.length })
      }
    } catch (e) {
      console.error(e)
    }
  }

  async function handleSave() {
    if (!fullName.trim()) return
    setSaving(true)
    setSaveMsg('')
    try {
      await api.put('/users/me', { full_name: fullName })
      setUser((prev) => ({ ...prev, full_name: fullName }))
      const stored = JSON.parse(
        localStorage.getItem('user') || '{}',
      )
      localStorage.setItem(
        'user',
        JSON.stringify({
          ...stored,
          full_name: fullName,
        }),
      )
      setSaveMsg('✅ Name updated!')
      setEditing(false)
    } catch (e) {
      setSaveMsg('❌ Update failed')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteAccount() {
    try {
      await api.delete('/users/me')
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      navigate('/register')
    } catch (e) {
      console.error(e)
    }
  }

  function getInitials(name) {
    if (!name) return '?'
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  function getRoleLabel() {
    switch (role) {
      case 'admin':
        return {
          label: 'Administrator',
          emoji: '🔑',
          color: '#7c3aed',
        }
      case 'provider':
        return {
          label: 'Service Provider',
          emoji: '🏨',
          color: '#0369a1',
        }
      default:
        return {
          label: 'Traveler',
          emoji: '🧳',
          color: '#16a34a',
        }
    }
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
          color: 'var(--text-secondary)',
        }}
      >
        Loading profile...
      </div>
    )

  const roleInfo = getRoleLabel()

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        padding: '0 0 48px',
      }}
    >
      {/* Hero banner */}
      <div
        style={{
          background:
            'linear-gradient(135deg, #1e3a5f 0%, #0ea5e9 100%)',
          padding: '40px 16px 80px',
        }}
      >
        <div
          style={{
            maxWidth: '680px',
            margin: '0 auto',
            textAlign: 'center',
          }}
        >
          <h1
            style={{
              color: 'white',
              margin: '0 0 6px',
              fontSize: '1.5rem',
              fontWeight: 800,
            }}
          >
            My Profile
          </h1>
          <p
            style={{
              color: 'rgba(255,255,255,0.75)',
              margin: 0,
              fontSize: '0.875rem',
            }}
          >
            Manage your GB Tourism account
          </p>
        </div>
      </div>

      <div
        style={{
          maxWidth: '680px',
          margin: '-56px auto 0',
          padding: '0 16px',
        }}
      >
        {/* Avatar + name card */}
        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-md)',
            padding: '28px 24px',
            marginBottom: '16px',
            textAlign: 'center',
          }}
        >
          {/* Avatar circle */}
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background:
                'linear-gradient(135deg, #1e3a5f, #0ea5e9)',
              color: 'white',
              fontSize: '1.8rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px',
              boxShadow: '0 4px 16px rgba(14,165,233,0.3)',
            }}
          >
            {getInitials(user?.full_name)}
          </div>

          {/* Name */}
          {editing ? (
            <div style={{ marginBottom: '12px' }}>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={{
                  padding: '10px 14px',
                  fontSize: '1rem',
                  fontWeight: 700,
                  textAlign: 'center',
                  borderRadius: '8px',
                  border: '2px solid var(--accent)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  width: '100%',
                  maxWidth: '280px',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
            </div>
          ) : (
            <h2
              style={{
                margin: '0 0 6px',
                fontSize: '1.4rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
              }}
            >
              {user?.full_name}
            </h2>
          )}

          {/* Email */}
          <p
            style={{
              margin: '0 0 12px',
              fontSize: '0.9rem',
              color: 'var(--text-secondary)',
            }}
          >
            {user?.email}
          </p>

          {/* Role badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 14px',
              borderRadius: '999px',
              background: roleInfo.color + '18',
              border: '1px solid ' + roleInfo.color + '40',
              marginBottom: '20px',
            }}
          >
            <span>{roleInfo.emoji}</span>
            <span
              style={{
                fontWeight: 700,
                fontSize: '0.85rem',
                color: roleInfo.color,
              }}
            >
              {roleInfo.label}
            </span>
          </div>

          {/* Edit / Save buttons */}
          <div
            style={{
              display: 'flex',
              gap: '10px',
              justifyContent: 'center',
            }}
          >
            {editing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    padding: '9px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    background:
                      'linear-gradient(135deg, #1e3a5f, #0ea5e9)',
                    color: 'white',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? 'Saving...' : '✓ Save'}
                </button>
                <button
                  onClick={() => {
                    setEditing(false)
                    setFullName(user?.full_name)
                    setSaveMsg('')
                  }}
                  style={{
                    padding: '9px 24px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-secondary)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                  }}
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                style={{
                  padding: '9px 24px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-secondary)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                }}
              >
                ✏️ Edit Name
              </button>
            )}
          </div>

          {saveMsg && (
            <p
              style={{
                marginTop: '10px',
                fontSize: '0.875rem',
                color: saveMsg.startsWith('✅')
                  ? 'var(--success)'
                  : 'var(--danger)',
              }}
            >
              {saveMsg}
            </p>
          )}
        </div>

        {/* Stats card */}
        {stats && (
          <div
            style={{
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-sm)',
              padding: '20px 24px',
              marginBottom: '16px',
            }}
          >
            <h3
              style={{
                margin: '0 0 16px',
                fontSize: '0.95rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
              }}
            >
              📊 Your Activity
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit, minmax(120px, 1fr))',
                gap: '12px',
              }}
            >
              {role === 'provider' && (
                <>
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '16px',
                      background: 'var(--bg-secondary)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '1.6rem',
                        fontWeight: 800,
                        color: 'var(--accent)',
                      }}
                    >
                      {stats.listings}
                    </div>
                    <div
                      style={{
                        fontSize: '0.78rem',
                        color: 'var(--text-secondary)',
                        marginTop: '4px',
                      }}
                    >
                      My Services
                    </div>
                  </div>
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '16px',
                      background: 'var(--bg-secondary)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '1.6rem',
                        fontWeight: 800,
                        color: '#10b981',
                      }}
                    >
                      PKR{' '}
                      {stats.revenue?.toLocaleString('en-PK')}
                    </div>
                    <div
                      style={{
                        fontSize: '0.78rem',
                        color: 'var(--text-secondary)',
                        marginTop: '4px',
                      }}
                    >
                      Total Revenue
                    </div>
                  </div>
                </>
              )}
              {role === 'user' && (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '16px',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <div
                    style={{
                      fontSize: '1.6rem',
                      fontWeight: 800,
                      color: 'var(--accent)',
                    }}
                  >
                    {stats.bookings}
                  </div>
                  <div
                    style={{
                      fontSize: '0.78rem',
                      color: 'var(--text-secondary)',
                      marginTop: '4px',
                    }}
                  >
                    Total Bookings
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick links card */}
        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)',
            overflow: 'hidden',
            marginBottom: '16px',
          }}
        >
          <div
            style={{
              padding: '14px 20px',
              borderBottom: '1px solid var(--border-color)',
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: '0.95rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
              }}
            >
              🔗 Quick Links
            </h3>
          </div>
          {[
            role === 'user' && {
              label: 'My Bookings',
              emoji: '📅',
              path: '/my-bookings',
            },
            role === 'provider' && {
              label: 'My Services',
              emoji: '🏨',
              path: '/my-listings',
            },
            role === 'provider' && {
              label: 'Analytics',
              emoji: '📊',
              path: '/my-analytics',
            },
            role !== 'admin' && {
              label: 'Recommendations',
              emoji: '✨',
              path: '/recommendations',
            },
            {
              label: 'Explore Map',
              emoji: '📍',
              path: '/map',
            },
          ]
            .filter(Boolean)
            .map((link, i, arr) => (
              <div
                key={link.path}
                onClick={() => navigate(link.path)}
                style={{
                  padding: '14px 20px',
                  borderBottom:
                    i < arr.length - 1
                      ? '1px solid var(--border-color)'
                      : 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background =
                    'var(--bg-secondary)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background =
                    'transparent')
                }
              >
                <span
                  style={{
                    fontSize: '0.9rem',
                    color: 'var(--text-primary)',
                    fontWeight: 500,
                  }}
                >
                  {link.emoji} {link.label}
                </span>
                <span style={{ color: 'var(--text-muted)' }}>
                  →
                </span>
              </div>
            ))}
        </div>

        {/* Danger zone */}
        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--danger)',
            boxShadow: 'var(--shadow-sm)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '14px 20px',
              borderBottom: '1px solid var(--danger)',
              background: 'var(--danger-bg)',
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: '0.95rem',
                fontWeight: 700,
                color: 'var(--danger)',
              }}
            >
              ⚠️ Danger Zone
            </h3>
          </div>
          <div style={{ padding: '16px 20px' }}>
            <p
              style={{
                margin: '0 0 14px',
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
              }}
            >
              Permanently delete your account and all associated
              data. This action cannot be undone.
            </p>
            {!showDelete ? (
              <button
                onClick={() => setShowDelete(true)}
                style={{
                  padding: '9px 20px',
                  borderRadius: '8px',
                  border: '1px solid var(--danger)',
                  background: 'transparent',
                  color: 'var(--danger)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                }}
              >
                Delete My Account
              </button>
            ) : (
              <div
                style={{
                  padding: '16px',
                  background: 'var(--danger-bg)',
                  borderRadius: '8px',
                  border: '1px solid var(--danger)',
                }}
              >
                <p
                  style={{
                    margin: '0 0 12px',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    color: 'var(--danger)',
                  }}
                >
                  Are you sure? This cannot be undone.
                </p>
                <div
                  style={{
                    display: 'flex',
                    gap: '10px',
                  }}
                >
                  <button
                    onClick={handleDeleteAccount}
                    style={{
                      padding: '8px 18px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'var(--danger)',
                      color: 'white',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                    }}
                  >
                    Yes, Delete
                  </button>
                  <button
                    onClick={() => setShowDelete(false)}
                    style={{
                      padding: '8px 18px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-secondary)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

