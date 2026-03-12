import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { logout } from '../utils/auth'

function Profile() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const user =
    typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem('user') || 'null')
      : null

  const email = user?.email || ''

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

  return (
    <div
      style={{
        maxWidth: '500px',
        margin: '40px auto',
        padding: '20px',
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        boxShadow: '0 1px 4px rgba(15, 23, 42, 0.08)',
      }}
    >
      <h1 style={{ marginBottom: '16px' }}>Profile</h1>
      <p style={{ marginBottom: '8px' }}>
        <strong>Email:</strong> {email || '(unknown)'}
      </p>

      <hr style={{ margin: '16px 0', borderColor: '#e5e7eb' }} />

      <h2 style={{ marginBottom: '8px', color: '#dc2626', fontSize: '1rem' }}>
        Danger Zone
      </h2>
      <p style={{ marginBottom: '12px', fontSize: '0.95rem' }}>
        Deleting your account is permanent. You must remove your listings and
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
          backgroundColor: '#dc2626',
          color: '#ffffff',
          cursor: loading ? 'default' : 'pointer',
          opacity: loading ? 0.7 : 1,
          fontSize: '0.95rem',
        }}
      >
        {loading ? 'Deleting account...' : 'Delete Account'}
      </button>
      {error && (
        <p style={{ marginTop: '12px', color: 'red', fontSize: '0.9rem' }}>
          {error}
        </p>
      )}
    </div>
  )
}

export default Profile

