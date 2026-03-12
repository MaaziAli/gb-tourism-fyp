import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import api from '../api/axios'

function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const successMessage = location.state?.message

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      const formData = new URLSearchParams()
      formData.append('username', email)
      formData.append('password', password)

      const { data } = await api.post('/auth/login', formData)
      localStorage.setItem('token', data.access_token)
      // Fetch current user profile for client-side authorization
      try {
        const meRes = await api.get('/users/me')
        localStorage.setItem('user', JSON.stringify(meRes.data))
      } catch {
        // If /users/me fails, continue with token-only auth
      }
      navigate('/')
    } catch (err) {
      const msg = err.response?.data?.detail ?? err.message ?? 'Login failed'
      setError(
        Array.isArray(msg)
          ? msg.map((m) => m.msg ?? JSON.stringify(m)).join(', ')
          : String(msg),
      )
    }
  }

  const containerStyle = {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '20px',
  }

  const cardStyle = {
    maxWidth: '400px',
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

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h1
          style={{
            textAlign: 'center',
            fontSize: '1.6rem',
            fontWeight: 700,
            margin: '0 0 4px 0',
          }}
        >
          Welcome Back
        </h1>
        <p
          style={{
            textAlign: 'center',
            fontSize: '0.9rem',
            color: '#6b7280',
            margin: '0 0 24px 0',
          }}
        >
          Sign in to your account
        </p>

        {successMessage && (
          <div
            style={{
              backgroundColor: '#d1fae5',
              border: '1px solid #6ee7b7',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '0.9rem',
              color: '#065f46',
              marginBottom: '16px',
            }}
          >
            {successMessage}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label htmlFor="email" style={labelStyle}>
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={inputStyle}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label htmlFor="password" style={labelStyle}>
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={inputStyle}
            />
          </div>
          {error && (
            <p style={{ color: 'red', fontSize: '0.9rem', marginTop: '4px' }}>
              {error}
            </p>
          )}
          <button
            type="submit"
            style={{
              marginTop: '8px',
              padding: '11px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 600,
              width: '100%',
            }}
          >
            Login
          </button>
        </form>

        <p
          style={{
            marginTop: '16px',
            fontSize: '0.9rem',
            textAlign: 'center',
          }}
        >
          Don&apos;t have an account?{' '}
          <Link to="/register" style={{ color: '#2563eb' }}>
            Register
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Login
