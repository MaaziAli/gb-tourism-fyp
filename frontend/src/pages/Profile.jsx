import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { logout } from '../utils/auth'
import { getUser } from '../utils/role'

function Profile() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [listingsCount, setListingsCount] = useState(0)
  const [totalBookings, setTotalBookings] = useState(0)

  const user = getUser()
  const fullName = user?.full_name || ''
  const email = user?.email || ''
  const role = user?.role || 'user'
  const createdAt = user?.created_at || null

  // Compute initials for avatar
  const initials = fullName ? fullName.trim().charAt(0).toUpperCase() : 'U'

  // Format "Member since ..."
  let memberSince = ''
  if (createdAt) {
    const date = new Date(createdAt)
    if (!Number.isNaN(date.getTime())) {
      memberSince = `Member since ${date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
      })}`
    }
  }

  const isProvider = role === 'provider'

  // Provider stats
  useEffect(() => {
    if (!isProvider) {
      return
    }
    let cancelled = false

    const loadStats = async () => {
      try {
        const [listingsRes, revenueRes] = await Promise.all([
          api.get('/listings/me'),
          api.get('/bookings/provider/revenue'),
        ])
        if (cancelled) return
        setListingsCount(Array.isArray(listingsRes.data) ? listingsRes.data.length : 0)
        setTotalBookings(revenueRes.data?.total_bookings ?? 0)
      } catch (err) {
        console.error('Failed to load provider stats', {
          message: err.message,
          status: err.response?.status,
          data: err.response?.data,
        })
      }
    }

    loadStats()

    return () => {
      cancelled = true
    }
  }, [isProvider])

  const handleDeleteAccount = async () => {
    if (
      !window.confirm(
        'Are you absolutely sure? This action is permanent and cannot be undone.\n\n' +
          'All your data will be deleted, and you will be logged out.',
      )
    ) {
      return
    }

    setLoading(true)
    setError('')
    try {
      await api.delete('/users/me')
      await logout(navigate)
      alert('Your account has been deleted.')
    } catch (err) {
      console.error('Delete account failed:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      })
      const msg =
        err.response?.data?.detail ||
        'Failed to delete account. Please try again later.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const getRoleBadge = () => {
    if (role === 'provider') {
      return {
        label: 'Service Provider',
        style: {
          backgroundColor: '#dbeafe',
          color: '#1e40af',
        },
      }
    }
    if (role === 'admin') {
      return {
        label: 'Admin',
        style: {
          backgroundColor: '#fee2e2',
          color: '#991b1b',
        },
      }
    }
    return {
      label: 'Traveler',
      style: {
        backgroundColor: '#d1fae5',
        color: '#065f46',
      },
    }
  }

  const roleBadge = getRoleBadge()

  return (
    <div
      className="page-container"
      style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}
    >
      <div
        style={{
          maxWidth: '600px',
          margin: '40px auto',
          padding: '20px',
          backgroundColor: 'var(--bg-card)',
          borderRadius: '8px',
          boxShadow: 'var(--shadow-sm)',
          border: '1px solid var(--border-color)',
        }}
      >
      {/* Section 1 - User info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'var(--accent)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            fontWeight: 600,
          }}
        >
          {initials}
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1
              style={{
                margin: 0,
                fontSize: '1.4rem',
                color: 'var(--text-primary)',
              }}
            >
              {fullName || '(Unknown User)'}
            </h1>
            <span
              style={{
                display: 'inline-block',
                padding: '3px 10px',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: 600,
                ...roleBadge.style,
              }}
            >
              {roleBadge.label}
            </span>
          </div>
          <p
            style={{
              margin: '4px 0',
              fontSize: '0.9rem',
              color: 'var(--text-secondary)',
            }}
          >
            {email || '(unknown email)'}
          </p>
          {memberSince && (
            <p
              style={{
                margin: 0,
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
              }}
            >
              {memberSince}
            </p>
          )}
        </div>
      </div>

      {/* Section 2 - Provider stats */}
      {isProvider && (
        <div
          style={{
            marginTop: '24px',
            display: 'flex',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div
              style={{
                flex: '1 1 120px',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '16px',
                textAlign: 'center',
              }}
          >
            <div
              style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
              }}
            >
              {listingsCount}
            </div>
            <div
              style={{
                marginTop: '4px',
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
              }}
            >
              My Stays
            </div>
          </div>
          <div
              style={{
                flex: '1 1 120px',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '16px',
                textAlign: 'center',
              }}
          >
            <div
              style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
              }}
            >
              {totalBookings}
            </div>
            <div
              style={{
                marginTop: '4px',
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
              }}
            >
              Total Bookings
            </div>
          </div>
        </div>
      )}

      {/* Section 3 - Danger zone */}
      <hr style={{ margin: '24px 0', borderColor: 'var(--border-color)' }} />

      <h2 style={{ marginBottom: '8px', color: '#ef4444', fontSize: '1rem' }}>
        Danger Zone
      </h2>
      <p style={{ marginBottom: '12px', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
        Deleting your account is permanent. You must remove your stays and
        cancel active bookings before you can delete your account.
      </p>
      <button
        type="button"
        onClick={handleDeleteAccount}
        disabled={loading}
        style={{
          padding: '10px 16px',
          borderRadius: '6px',
          border: 'none',
          backgroundColor: 'var(--danger)',
          color: '#ffffff',
          cursor: loading ? 'default' : 'pointer',
          opacity: loading ? 0.7 : 1,
          fontSize: '0.95rem',
        }}
      >
        {loading ? 'Deleting account...' : 'Delete Account'}
      </button>
      {error && (
        <p style={{ marginTop: '12px', color: 'var(--danger)', fontSize: '0.9rem' }}>
          {error}
        </p>
      )}
      </div>
    </div>
  )
}

export default Profile


