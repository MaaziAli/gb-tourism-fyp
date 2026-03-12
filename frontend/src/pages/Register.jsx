import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'

function Register() {
  const navigate = useNavigate()

  const [selectedRole, setSelectedRole] = useState(null) // 'user' | 'provider' | null
  const [full_name, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const handleRoleSelect = (role) => {
    setSelectedRole(role)
    setError('')
    setFieldErrors({})
  }

  const resetToRoleSelection = () => {
    setSelectedRole(null)
    setError('')
    setFieldErrors({})
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const newFieldErrors = {}

    if (!full_name.trim()) {
      newFieldErrors.full_name = 'Full name is required'
    }
    if (!email.trim()) {
      newFieldErrors.email = 'Email is required'
    }
    if (!password) {
      newFieldErrors.password = 'Password is required'
    } else if (password.length < 8) {
      newFieldErrors.password = 'Password must be at least 8 characters'
    }
    if (!confirmPassword) {
      newFieldErrors.confirmPassword = 'Please confirm your password'
    } else if (password && confirmPassword && password !== confirmPassword) {
      newFieldErrors.confirmPassword = 'Passwords do not match'
    }
    if (!selectedRole) {
      newFieldErrors.role = 'Please choose how you will use GB Tourism'
    }

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors)
      return
    }

    setFieldErrors({})
    setSubmitting(true)
    try {
      await api.post('/auth/register', {
        full_name,
        email,
        password,
        role: selectedRole,
      })
      navigate('/login', {
        state: { message: 'Registration successful! Please log in.' },
      })
    } catch (err) {
      const msg = err.response?.data?.detail ?? err.message ?? 'Registration failed'
      setError(
        Array.isArray(msg)
          ? msg.map((m) => m.msg ?? JSON.stringify(m)).join(', ')
          : String(msg),
      )
    } finally {
      setSubmitting(false)
    }
  }

  const containerStyle = {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '20px',
  }

  const cardStyle = {
    maxWidth: '440px',
    margin: '40px auto',
    backgroundColor: '#ffffff',
    padding: '32px',
    borderRadius: '12px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
  }

  const labelStyle = {
    fontSize: '0.85rem',
    fontWeight: 500,
    color: '#374151',
    display: 'block',
    marginBottom: '2px',
  }

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '0.95rem',
    boxSizing: 'border-box',
    marginTop: '4px',
  }

  const errorTextStyle = {
    color: 'red',
    fontSize: '0.85rem',
    marginTop: '4px',
  }

  if (!selectedRole) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <h1
            style={{
              textAlign: 'center',
              fontSize: '1.8rem',
              fontWeight: 700,
              margin: '0 0 8px 0',
            }}
          >
            Join GB Tourism
          </h1>
          <p
            style={{
              textAlign: 'center',
              fontSize: '1rem',
              color: '#6b7280',
              margin: '0 0 24px 0',
            }}
          >
            How will you use GB Tourism?
          </p>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '16px',
              justifyContent: 'center',
              marginBottom: '16px',
            }}
          >
            <button
              type="button"
              onClick={() => handleRoleSelect('user')}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#2563eb'
                e.currentTarget.style.boxShadow = '0 0 0 2px #dbeafe'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb'
                e.currentTarget.style.boxShadow = 'none'
              }}
              style={{
                flex: '1 1 200px',
                maxWidth: '220px',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '24px',
                cursor: 'pointer',
                textAlign: 'center',
                backgroundColor: '#ffffff',
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🧳</div>
              <div
                style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  marginBottom: '4px',
                  color: '#111827',
                }}
              >
                I&apos;m a Traveler
              </div>
              <p
                style={{
                  fontSize: '0.85rem',
                  color: '#6b7280',
                  margin: 0,
                }}
              >
                Browse and book hotels, tours, transport and activities across
                Gilgit-Baltistan
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleRoleSelect('provider')}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#2563eb'
                e.currentTarget.style.boxShadow = '0 0 0 2px #dbeafe'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb'
                e.currentTarget.style.boxShadow = 'none'
              }}
              style={{
                flex: '1 1 200px',
                maxWidth: '220px',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '24px',
                cursor: 'pointer',
                textAlign: 'center',
                backgroundColor: '#ffffff',
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🏨</div>
              <div
                style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  marginBottom: '4px',
                  color: '#111827',
                }}
              >
                I&apos;m a Service Provider
              </div>
              <p
                style={{
                  fontSize: '0.85rem',
                  color: '#6b7280',
                  margin: 0,
                }}
              >
                List your hotel, tour, transport service or activity and manage
                bookings
              </p>
            </button>
          </div>

          {fieldErrors.role && (
            <p style={{ ...errorTextStyle, textAlign: 'center' }}>
              {fieldErrors.role}
            </p>
          )}

          <p
            style={{
              marginTop: '16px',
              fontSize: '0.9rem',
              textAlign: 'center',
            }}
          >
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#2563eb' }}>
              Login
            </Link>
          </p>
        </div>
      </div>
    )
  }

  const isTraveler = selectedRole === 'user'
  const isProvider = selectedRole === 'provider'

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <button
          type="button"
          onClick={resetToRoleSelection}
          style={{
            border: 'none',
            background: 'transparent',
            color: '#2563eb',
            cursor: 'pointer',
            padding: 0,
            marginBottom: '8px',
            fontSize: '0.9rem',
          }}
        >
          ← Back
        </button>

        <div style={{ marginBottom: '16px' }}>
          {isTraveler && (
            <span
              style={{
                display: 'inline-block',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: 600,
                backgroundColor: '#d1fae5',
                color: '#065f46',
              }}
            >
              🧳 Registering as Traveler
            </span>
          )}
          {isProvider && (
            <span
              style={{
                display: 'inline-block',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: 600,
                backgroundColor: '#dbeafe',
                color: '#1e40af',
              }}
            >
              🏨 Registering as Service Provider
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="full_name" style={labelStyle}>
              Full Name
            </label>
            <input
              id="full_name"
              type="text"
              value={full_name}
              onChange={(e) => setFullName(e.target.value)}
              style={inputStyle}
              required
            />
            {fieldErrors.full_name && (
              <p style={errorTextStyle}>{fieldErrors.full_name}</p>
            )}
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="email" style={labelStyle}>
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              required
            />
            {fieldErrors.email && (
              <p style={errorTextStyle}>{fieldErrors.email}</p>
            )}
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="password" style={labelStyle}>
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
              required
            />
            {fieldErrors.password && (
              <p style={errorTextStyle}>{fieldErrors.password}</p>
            )}
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="confirmPassword" style={labelStyle}>
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={inputStyle}
              required
            />
            {fieldErrors.confirmPassword && (
              <p style={errorTextStyle}>{fieldErrors.confirmPassword}</p>
            )}
          </div>

          {isProvider && (
            <div
              style={{
                marginBottom: '16px',
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '0.85rem',
                color: '#1e40af',
              }}
            >
              ℹ️ As a Service Provider, you&apos;ll be able to add your hotel, tour
              packages, transport services, or activities after registration.
            </div>
          )}

          {error && (
            <p
              style={{
                color: 'red',
                fontSize: '0.85rem',
                marginTop: '4px',
                marginBottom: '8px',
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              padding: '11px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              cursor: submitting ? 'default' : 'pointer',
              fontSize: '1rem',
              fontWeight: 600,
              marginTop: '8px',
              opacity: submitting ? 0.85 : 1,
            }}
          >
            {submitting ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p
          style={{
            marginTop: '16px',
            fontSize: '0.9rem',
            textAlign: 'center',
          }}
        >
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#2563eb' }}>
            Login
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Register
